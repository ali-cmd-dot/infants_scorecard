export interface VehicleScore {
  vehicleNumber: string;
  score: number | null;
}

export interface ClientData {
  name: string;
  vehicles: VehicleScore[];
  averageScore: number;
  totalVehicles: number;
}

export interface DashboardData {
  clients: ClientData[];
  lastUpdated: string;
  totalVehicles: number;
}

const SHEET1_ID = "1LrVdz7A790qBLfmo9D6cXNQWl-L5P11XJz2rG8LaMqI";
const SHEET1_GID = "0";

const SHEET2_ID = "1GFUotxyLDqe-2qIOOmuSlshODi6FmzFdPaQ8vtv17AU";
const SHEET2_GID = "368130144";

async function fetchSheetCSV(spreadsheetId: string, gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${spreadsheetId} gid=${gid} status=${res.status}`);
  return parseCSV(await res.text());
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let inQuote = false;
    let cur = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim());
        cur = "";
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

export async function getDashboardData(): Promise<DashboardData> {
  const [s1, s2] = await Promise.all([
    fetchSheetCSV(SHEET1_ID, SHEET1_GID),
    fetchSheetCSV(SHEET2_ID, SHEET2_GID),
  ]);

  if (!s1.length) throw new Error("Sheet1 is empty");
  if (!s2.length) throw new Error("Sheet2 is empty");

  const h1 = s1[0].map(h => h.trim());
  const vCol1 = findCol(h1, "Vehicle Number", "VehicleNumber", "vehicle no", "Vehicle No");
  const sCol = findCol(h1, "Scores", "Score", "scores", "Total Score", "total score");
  if (vCol1 === -1) throw new Error("Sheet1: No vehicle column. Got: " + h1.join(", "));
  if (sCol === -1) throw new Error("Sheet1: No score column. Got: " + h1.join(", "));

  const sheet1Vehicles: { vehicleNumber: string; score: number | null }[] = [];
  for (let i = 1; i < s1.length; i++) {
    const v = s1[i][vCol1]?.trim();
    if (!v) continue;
    const raw = s1[i][sCol]?.trim();
    const n = raw ? parseFloat(raw) : NaN;
    sheet1Vehicles.push({ vehicleNumber: v, score: isNaN(n) ? null : n });
  }

  const h2 = s2[0].map(h => h.trim());
  const vCol2 = findCol(h2,
    "Vehicle Number/Chassis Number",
    "VehicleNumber/ChassisNumberNO.",
    "Vehicle Number", "VehicleNumber", "Chassis Number", "vehicle number"
  );
  const cCol = findCol(h2,
    "Running company/School",
    "Running Company/School",
    "Running company", "School"
  );
  if (vCol2 === -1) throw new Error("Sheet2: No vehicle column. Got: " + h2.join(", "));
  if (cCol === -1) throw new Error("Sheet2: No client column. Got: " + h2.join(", "));

  const vehicleToClient: Record<string, string> = {};
  for (let i = 1; i < s2.length; i++) {
    const v = s2[i][vCol2]?.trim();
    if (!v) continue;
    const client = s2[i][cCol]?.trim();
    if (client) vehicleToClient[v] = client;
  }

  const clientMap: Record<string, VehicleScore[]> = {};
  for (const { vehicleNumber, score } of sheet1Vehicles) {
    const client = vehicleToClient[vehicleNumber] || "Other";
    if (!clientMap[client]) clientMap[client] = [];
    clientMap[client].push({ vehicleNumber, score });
  }

  const clients: ClientData[] = Object.entries(clientMap).map(([name, vehicles]) => {
    const scored = vehicles.filter(v => v.score !== null);
    const avg = scored.length
      ? Math.round(scored.reduce((s, v) => s + (v.score ?? 0), 0) / scored.length)
      : 0;
    return { name, vehicles, averageScore: avg, totalVehicles: vehicles.length };
  });

  clients.sort((a, b) => {
    if (a.name === "Other") return 1;
    if (b.name === "Other") return -1;
    return b.averageScore - a.averageScore;
  });

  return {
    clients,
    lastUpdated: new Date().toISOString(),
    totalVehicles: sheet1Vehicles.length,
  };
}
