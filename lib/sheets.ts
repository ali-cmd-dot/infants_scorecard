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

const SHEET1_ID = "1FCHtmrcuPVXDRbmgMbJI8TSP_wondoE1ElZANVJnHag";
const SHEET1_SUMMARY_GID = "154520238";
const SHEET2_ID = "1GFUotxyLDqe-2qIOOmuSlshODi6FmzFdPaQ8vtv17AU";
const SHEET2_GID = "368130144";
const SHEET1_ALERTS_GID = "1184598582";

async function fetchSheetCSV(spreadsheetId: string, gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${spreadsheetId} gid=${gid} → ${res.status}`);
  return parseCSV(await res.text());
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let inQuote = false, cur = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function findCol(headers: string[], ...names: string[]): number {
  for (const name of names) {
    const i = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
    if (i !== -1) return i;
  }
  for (const name of names) {
    const i = headers.findIndex(h => h.trim().toLowerCase().includes(name.toLowerCase()));
    if (i !== -1) return i;
  }
  return -1;
}

function safeInt(val: string | undefined): number {
  if (!val) return 0;
  const n = parseInt(val.replace(/,/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

function emptyAlerts(): AlertSummary {
  return { distractedDriving: 0, seatBeltAbsent: 0, smoking: 0, fatigueDriving: 0, phoneCall: 0, overSpeed: 0, totalAlerts: 0 };
}

function addAlerts(a: AlertSummary, b: AlertSummary): AlertSummary {
  return {
    distractedDriving: a.distractedDriving + b.distractedDriving,
    seatBeltAbsent: a.seatBeltAbsent + b.seatBeltAbsent,
    smoking: a.smoking + b.smoking,
    fatigueDriving: a.fatigueDriving + b.fatigueDriving,
    phoneCall: a.phoneCall + b.phoneCall,
    overSpeed: a.overSpeed + b.overSpeed,
    totalAlerts: a.totalAlerts + b.totalAlerts,
  };
}

// Keep date exactly as it appears in the sheet — no parsing
function cleanDateLabel(raw: string): string {
  return raw.trim();
}

// Try to get a sort key from the date string for ordering
function dateSortKey(raw: string): number {
  const clean = raw.trim();
  // Try direct parse
  const d = new Date(clean);
  if (!isNaN(d.getTime())) return d.getTime();
  // Try DD/MM/YYYY or DD-MM-YYYY
  const match = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    const [, dd, mm, yy] = match;
    const year = yy.length === 2 ? 2000 + parseInt(yy) : parseInt(yy);
    const d2 = new Date(year, parseInt(mm) - 1, parseInt(dd));
    if (!isNaN(d2.getTime())) return d2.getTime();
  }
  return 0;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [summaryRows, alertRows, s2Rows] = await Promise.all([
    fetchSheetCSV(SHEET1_ID, SHEET1_SUMMARY_GID),
    fetchSheetCSV(SHEET1_ID, SHEET1_ALERTS_GID),
    fetchSheetCSV(SHEET2_ID, SHEET2_GID),
  ]);

  if (!summaryRows.length) throw new Error("Summary tab is empty");
  if (!s2Rows.length) throw new Error("Sheet2 is empty");

  // ── SUMMARY TAB ──
  const h1 = summaryRows[0].map(h => h.trim());
  const vCol1 = findCol(h1, "Vehicle Number", "VehicleNumber", "vehicle no");
  const sCol  = findCol(h1, "Scores", "Score", "scores", "Total Score");
  if (vCol1 === -1) throw new Error("Summary: No vehicle column. Got: " + h1.join(", "));
  if (sCol  === -1) throw new Error("Summary: No score column. Got: " + h1.join(", "));

  const sheet1Vehicles: { vehicleNumber: string; score: number | null }[] = [];
  for (let i = 1; i < summaryRows.length; i++) {
    const v = summaryRows[i][vCol1]?.trim();
    if (!v) continue;
    const raw = summaryRows[i][sCol]?.trim();
    const n = raw ? parseFloat(raw) : NaN;
    sheet1Vehicles.push({ vehicleNumber: v, score: isNaN(n) ? null : n });
  }

  // ── ALERTS TAB ──
  const vehicleAlertMap: Record<string, AlertSummary> = {};
  const dateAlertMap: Record<string, DateAlertPoint> = {};

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
    const totalCol   = findCol(ha, "total_alerts", "Total Alerts", "TotalAlerts");

    if (plateCol === -1) throw new Error("Alerts: No plate_number column. Got: " + ha.join(", "));

    for (let i = 1; i < alertRows.length; i++) {
      const row = alertRows[i];
      const plate = row[plateCol]?.trim();
      if (!plate) continue;

      const rowAlerts: AlertSummary = {
        distractedDriving: distCol    !== -1 ? safeInt(row[distCol])    : 0,
        seatBeltAbsent:    seatCol    !== -1 ? safeInt(row[seatCol])    : 0,
        smoking:           smokeCol   !== -1 ? safeInt(row[smokeCol])   : 0,
        fatigueDriving:    fatigueCol !== -1 ? safeInt(row[fatigueCol]) : 0,
        phoneCall:         phoneCol   !== -1 ? safeInt(row[phoneCol])   : 0,
        overSpeed:         speedCol   !== -1 ? safeInt(row[speedCol])   : 0,
        totalAlerts:       totalCol   !== -1 ? safeInt(row[totalCol])   : 0,
      };

      if (!vehicleAlertMap[plate]) vehicleAlertMap[plate] = emptyAlerts();
      vehicleAlertMap[plate] = addAlerts(vehicleAlertMap[plate], rowAlerts);

      // Date aggregation — only if date column exists
      if (dateCol !== -1) {
        const rawDate = row[dateCol]?.trim();
        if (rawDate) {
          const dateKey = cleanDateLabel(rawDate);
          if (!dateAlertMap[dateKey]) {
            dateAlertMap[dateKey] = {
              date: dateKey,
              distractedDriving: 0, seatBeltAbsent: 0, smoking: 0,
              fatigueDriving: 0, phoneCall: 0, overSpeed: 0,
            };
          }
          dateAlertMap[dateKey].distractedDriving += rowAlerts.distractedDriving;
          dateAlertMap[dateKey].seatBeltAbsent    += rowAlerts.seatBeltAbsent;
          dateAlertMap[dateKey].smoking           += rowAlerts.smoking;
          dateAlertMap[dateKey].fatigueDriving    += rowAlerts.fatigueDriving;
          dateAlertMap[dateKey].phoneCall         += rowAlerts.phoneCall;
          dateAlertMap[dateKey].overSpeed         += rowAlerts.overSpeed;
        }
      }
    }
  }

  const dateAlerts: DateAlertPoint[] = Object.values(dateAlertMap)
    .sort((a, b) => {
      const ka = dateSortKey(a.date);
      const kb = dateSortKey(b.date);
      if (ka && kb) return ka - kb;
      return a.date.localeCompare(b.date);
    });

  // ── SHEET 2 ──
  const h2 = s2Rows[0].map(h => h.trim());
  const vCol2 = findCol(h2, "Vehicle Number/Chassis Number", "VehicleNumber/ChassisNumberNO.", "Vehicle Number", "VehicleNumber", "Chassis Number", "vehicle number");
  const cCol  = findCol(h2, "Running company/School", "Running Company/School", "Running company", "School");
  if (vCol2 === -1) throw new Error("Sheet2: No vehicle column. Got: " + h2.join(", "));
  if (cCol  === -1) throw new Error("Sheet2: No client column. Got: " + h2.join(", "));

  const vehicleToClient: Record<string, string> = {};
  for (let i = 1; i < s2Rows.length; i++) {
    const v = s2Rows[i][vCol2]?.trim();
    if (!v) continue;
    const client = s2Rows[i][cCol]?.trim();
    if (client) vehicleToClient[v] = client;
  }

  const allVehicles: VehicleData[] = [];
  const clientMap: Record<string, { vehicles: VehicleScore[]; alerts: AlertSummary }> = {};

  for (const { vehicleNumber, score } of sheet1Vehicles) {
    const clientName = vehicleToClient[vehicleNumber] || "Other";
    const alerts = vehicleAlertMap[vehicleNumber] || emptyAlerts();
    allVehicles.push({ vehicleNumber, score, clientName, alerts });
    if (!clientMap[clientName]) clientMap[clientName] = { vehicles: [], alerts: emptyAlerts() };
    clientMap[clientName].vehicles.push({ vehicleNumber, score });
    clientMap[clientName].alerts = addAlerts(clientMap[clientName].alerts, alerts);
  }

  const clients: ClientData[] = Object.entries(clientMap).map(([name, data]) => {
    const scored = data.vehicles.filter(v => v.score !== null);
    const avg = scored.length ? Math.round(scored.reduce((s, v) => s + (v.score ?? 0), 0) / scored.length) : 0;
    return { name, vehicles: data.vehicles, averageScore: avg, totalVehicles: data.vehicles.length, alerts: data.alerts };
  });

  clients.sort((a, b) => {
    if (a.name === "Other") return 1;
    if (b.name === "Other") return -1;
    return b.averageScore - a.averageScore;
  });

  const overallAlerts = allVehicles.reduce((acc, v) => addAlerts(acc, v.alerts), emptyAlerts());

  return {
    clients, vehicles: allVehicles, overallAlerts, dateAlerts,
    lastUpdated: new Date().toISOString(),
    totalVehicles: sheet1Vehicles.length,
  };
}
