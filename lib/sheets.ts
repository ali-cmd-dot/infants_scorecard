export interface VehicleScore {
  vehicleNumber: string;
  score: number | null;
}

export interface AlertSummary {
  distractedDriving: number;
  seatBeltAbsent: number;
  smoking: number;
  fatigueDriving: number;
  phoneCall: number;
  overSpeed: number;
  totalAlerts: number;
}

export interface DateAlertPoint {
  date: string;
  distractedDriving: number;
  seatBeltAbsent: number;
  smoking: number;
  fatigueDriving: number;
  phoneCall: number;
  overSpeed: number;
}

export interface VehicleData {
  vehicleNumber: string;
  score: number | null;
  clientName: string;
  alerts: AlertSummary;
}

export interface ClientData {
  name: string;
  vehicles: VehicleScore[];
  averageScore: number;
  totalVehicles: number;
  alerts: AlertSummary;
}

export interface DashboardData {
  clients: ClientData[];
  vehicles: VehicleData[];
  overallAlerts: AlertSummary;
  dateAlerts: DateAlertPoint[];
  lastUpdated: string;
  totalVehicles: number;
}

// ── Single Sheet — all tabs live here ──────────────────────────────────────
const SHEET_ID           = "1f4-NLt91O_81eB7tCqpgnpglAhZGwxbuSk2Lrc2YY2A";
const BASE_GID           = "0";           // plate_number | device_id | display_name
const SUMMARY_GID        = "1750056371";  // Vehicle Number | Score
const ALERTS_GID         = "793292000";   // per-vehicle alert counts

// ── CSV helpers ─────────────────────────────────────────────────────────────
async function fetchSheetCSV(gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok)
    throw new Error(`Sheet fetch failed: gid=${gid} → ${res.status}`);
  return parseCSV(await res.text());
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let inQ = false, cur = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        cols.push(cur.trim()); cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function findCol(headers: string[], ...names: string[]): number {
  // exact match first
  for (const name of names) {
    const i = headers.findIndex(
      h => h.trim().toLowerCase() === name.toLowerCase()
    );
    if (i !== -1) return i;
  }
  // partial match fallback
  for (const name of names) {
    const i = headers.findIndex(
      h => h.trim().toLowerCase().includes(name.toLowerCase())
    );
    if (i !== -1) return i;
  }
  return -1;
}

function safeInt(v?: string): number {
  if (!v) return 0;
  const n = parseInt(v.replace(/,/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

function emptyAlerts(): AlertSummary {
  return {
    distractedDriving: 0, seatBeltAbsent: 0, smoking: 0,
    fatigueDriving: 0, phoneCall: 0, overSpeed: 0, totalAlerts: 0,
  };
}

function addAlerts(a: AlertSummary, b: AlertSummary): AlertSummary {
  return {
    distractedDriving: a.distractedDriving + b.distractedDriving,
    seatBeltAbsent:    a.seatBeltAbsent    + b.seatBeltAbsent,
    smoking:           a.smoking           + b.smoking,
    fatigueDriving:    a.fatigueDriving    + b.fatigueDriving,
    phoneCall:         a.phoneCall         + b.phoneCall,
    overSpeed:         a.overSpeed         + b.overSpeed,
    totalAlerts:       a.totalAlerts       + b.totalAlerts,
  };
}

// ── Date sort — handles DD/MM/YYYY, YYYY-MM-DD, DD-MM-YY ────────────────────
function dateSortKey(raw: string): number {
  const s = raw.trim();
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]).getTime();
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) return new Date(2000 + +m[3], +m[2] - 1, +m[1]).getTime();
  return 0;
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function getDashboardData(): Promise<DashboardData> {

  // Fetch all 3 tabs in parallel (all from the same sheet)
  const [baseRows, summaryRows, alertRows] = await Promise.all([
    fetchSheetCSV(BASE_GID),
    fetchSheetCSV(SUMMARY_GID),
    fetchSheetCSV(ALERTS_GID),
  ]);

  // ── 1. Build vehicle → client map from base tab ──────────────────────────
  //    Columns: plate_number | device_id | display_name
  if (!baseRows.length) throw new Error("Base tab is empty");
  const hBase   = baseRows[0].map(h => h.trim());
  const bPlateCol = findCol(hBase, "plate_number", "PlateNumber", "Vehicle Number");
  const bNameCol  = findCol(hBase, "display_name", "DisplayName", "Client", "School", "Running company");

  if (bPlateCol === -1) throw new Error("Base tab: no plate_number column. Got: " + hBase.join(", "));
  if (bNameCol  === -1) throw new Error("Base tab: no display_name column. Got: " + hBase.join(", "));

  const vehicleToClient: Record<string, string> = {};
  for (let i = 1; i < baseRows.length; i++) {
    const plate = baseRows[i][bPlateCol]?.trim();
    const name  = baseRows[i][bNameCol]?.trim();
    if (plate && name) vehicleToClient[plate] = name;
  }

  // ── 2. Parse summary tab (scores) ────────────────────────────────────────
  if (!summaryRows.length) throw new Error("Summary tab is empty");
  const hSum   = summaryRows[0].map(h => h.trim());
  const vCol   = findCol(hSum, "Vehicle Number", "VehicleNumber", "vehicle no", "plate_number");
  const sCol   = findCol(hSum, "Scores", "Score", "scores", "Total Score");

  if (vCol === -1) throw new Error("Summary tab: no vehicle column. Got: " + hSum.join(", "));
  if (sCol === -1) throw new Error("Summary tab: no score column. Got: "   + hSum.join(", "));

  const summaryVehicles: { vehicleNumber: string; score: number | null }[] = [];
  for (let i = 1; i < summaryRows.length; i++) {
    const v = summaryRows[i][vCol]?.trim();
    if (!v) continue;
    const n = parseFloat(summaryRows[i][sCol]?.trim() || "");
    summaryVehicles.push({ vehicleNumber: v, score: isNaN(n) ? null : n });
  }

  // ── 3. Parse alerts tab ───────────────────────────────────────────────────
  const vehicleAlertMap: Record<string, AlertSummary>  = {};
  const dateAlertMap:    Record<string, DateAlertPoint> = {};

  if (alertRows.length > 1) {
    const ha = alertRows[0].map(h => h.trim());
    const plateCol   = findCol(ha, "plate_number", "plate number", "PlateNumber", "Vehicle Number");
    const dateCol    = findCol(ha, "date", "Date", "alarm_date", "AlarmDate", "created_at", "Created At");
    const distCol    = findCol(ha, "DistractedDrivingAlarm", "Distracted Driving");
    const seatCol    = findCol(ha, "SeatBeltAbsent", "Seat Belt Absent", "SeatBelt");
    const smokeCol   = findCol(ha, "SmokingAlarm", "Smoking");
    const fatigueCol = findCol(ha, "FatigueDrivingAlarm", "Fatigue Driving");
    const phoneCol   = findCol(ha, "PhoneCallAlarm", "Phone Call");
    const speedCol   = findCol(ha, "OverSpeedAlarm", "OverSpeed", "Over Speed");

    if (plateCol === -1)
      throw new Error("Alerts tab: no plate_number column. Got: " + ha.join(", "));

    for (let i = 1; i < alertRows.length; i++) {
      const row   = alertRows[i];
      const plate = row[plateCol]?.trim();
      if (!plate) continue;

      const dd = distCol    !== -1 ? safeInt(row[distCol])    : 0;
      const sb = seatCol    !== -1 ? safeInt(row[seatCol])    : 0;
      const sm = smokeCol   !== -1 ? safeInt(row[smokeCol])   : 0;
      const fd = fatigueCol !== -1 ? safeInt(row[fatigueCol]) : 0;
      const pc = phoneCol   !== -1 ? safeInt(row[phoneCol])   : 0;
      const os = speedCol   !== -1 ? safeInt(row[speedCol])   : 0;

      const ra: AlertSummary = {
        distractedDriving: dd, seatBeltAbsent: sb, smoking: sm,
        fatigueDriving: fd, phoneCall: pc, overSpeed: os,
        totalAlerts: dd + sb + sm + fd + pc + os,   // computed — not from sheet
      };

      if (!vehicleAlertMap[plate]) vehicleAlertMap[plate] = emptyAlerts();
      vehicleAlertMap[plate] = addAlerts(vehicleAlertMap[plate], ra);

      if (dateCol !== -1) {
        const dk = row[dateCol]?.trim();
        if (!dk) continue;
        if (!dateAlertMap[dk])
          dateAlertMap[dk] = { date: dk, distractedDriving: 0, seatBeltAbsent: 0, smoking: 0, fatigueDriving: 0, phoneCall: 0, overSpeed: 0 };
        dateAlertMap[dk].distractedDriving += ra.distractedDriving;
        dateAlertMap[dk].seatBeltAbsent    += ra.seatBeltAbsent;
        dateAlertMap[dk].smoking           += ra.smoking;
        dateAlertMap[dk].fatigueDriving    += ra.fatigueDriving;
        dateAlertMap[dk].phoneCall         += ra.phoneCall;
        dateAlertMap[dk].overSpeed         += ra.overSpeed;
      }
    }
  }

  const dateAlerts = Object.values(dateAlertMap).sort((a, b) => {
    const ka = dateSortKey(a.date), kb = dateSortKey(b.date);
    return (ka && kb) ? ka - kb : a.date.localeCompare(b.date);
  });

  // ── 4. Assemble final data ────────────────────────────────────────────────
  const allVehicles: VehicleData[] = [];
  const clientMap: Record<string, { vehicles: VehicleScore[]; alerts: AlertSummary }> = {};

  for (const { vehicleNumber, score } of summaryVehicles) {
    const clientName = vehicleToClient[vehicleNumber] || "Other";
    const alerts     = vehicleAlertMap[vehicleNumber]  || emptyAlerts();

    allVehicles.push({ vehicleNumber, score, clientName, alerts });

    if (!clientMap[clientName])
      clientMap[clientName] = { vehicles: [], alerts: emptyAlerts() };

    clientMap[clientName].vehicles.push({ vehicleNumber, score });
    clientMap[clientName].alerts = addAlerts(clientMap[clientName].alerts, alerts);
  }

  const clients: ClientData[] = Object.entries(clientMap).map(([name, data]) => {
    const scored = data.vehicles.filter(v => v.score !== null);
    const avg    = scored.length
      ? Math.round(scored.reduce((s, v) => s + (v.score ?? 0), 0) / scored.length)
      : 0;
    return { name, vehicles: data.vehicles, averageScore: avg, totalVehicles: data.vehicles.length, alerts: data.alerts };
  });

  // Sort: highest avg score first; "Other" always last
  clients.sort((a, b) => {
    if (a.name === "Other") return 1;
    if (b.name === "Other") return -1;
    return b.averageScore - a.averageScore;
  });

  return {
    clients,
    vehicles: allVehicles,
    overallAlerts: allVehicles.reduce((a, v) => addAlerts(a, v.alerts), emptyAlerts()),
    dateAlerts,
    lastUpdated: new Date().toISOString(),
    totalVehicles: summaryVehicles.length,
  };
}
