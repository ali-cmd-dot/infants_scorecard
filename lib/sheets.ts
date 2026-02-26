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

// ✅ Sheet 1 — Tab: Sheet1
const SHEET1_ID = "1LrVdz7A790qBLfmo9D6cXNQWl-L5P11XJz2rG8LaMqI";
const SHEET1_GID = "0";

// Sheet 2 — Tab: Installation MIS
const SHEET2_ID = "1GFUotxyLDqe-2qIOOmuSlshODi6FmzFdPaQ8vtv17AU";
const SHEET2_GID = "368130144";

async function fetchSheetCSV(spreadsheetId: string, gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet ${spreadsheetId} gid ${gid}: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  return parseCSV(text);
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let inQuote = false;
    let cur = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
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

function findColIndex(headers: string[], ...candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex(
      (h) => h.trim().toLowerCase() === candidate.toLowerCase()
    );
    if (idx !== -1) return idx;
  }
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) =>
      h.trim().toLowerCase().includes(candidate.toLowerCase())
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

export async function getDashboardData(): Promise<DashboardData> {
  const sheet1Rows = await fetchSheetCSV(SHEET1_ID, SHEET1_GID);
  const sheet2Rows = await fetchSheetCSV(SHEET2_ID, SHEET2_GID);

  if (!sheet1Rows.length || !sheet2Rows.length) {
    throw new Error("Empty sheet data");
  }

  const s1Headers = sheet1Rows[0].map((h) => h.trim());
  const s1VehicleCol = findColIndex(s1Headers, "Vehicle Number", "VehicleNumber", "vehicle number", "vehicle no", "Vehicle No");
  const s1ScoreCol = findColIndex(s1Headers, "Scores", "Score", "scores", "Total Score", "total score");

  if (s1VehicleCol === -1)
    throw new Error(`Sheet1: Cannot find 'Vehicle Number' column. Headers: ${s1Headers.join(", ")}`);
  if (s1ScoreCol === -1)
    throw new Error(`Sheet1: Cannot find 'Scores' column. Headers: ${s1Headers.join(", ")}`);

  const vehicleScoreMap: Record<string, number | null> = {};
  for (let i = 1; i < sheet1Rows.length; i++) {
    const row = sheet1Rows[i];
    const vNum = row[s1VehicleCol]?.trim();
    if (!vNum) continue;
    const rawScore = row[s1ScoreCol]?.trim();
    const parsed = rawScore ? parseFloat(rawScore) : NaN;
    vehicleScoreMap[vNum] = isNaN(parsed) ? null : parsed;
  }

  const s2Headers = sheet2Rows[0].map((h) => h.trim());
  const s2VehicleCol = findColIndex(
    s2Headers,
    "Vehicle Number/Chassis Number",
    "VehicleNumber/ChassisNumberNO.",
    "Vehicle Number",
    "VehicleNumber",
    "Chassis Number",
    "vehicle number"
  );
  const s2ClientCol = findColIndex(
    s2Headers,
    "Running company/School",
    "Running Company/School",
    "Running company",
    "School",
    "running company"
  );

  if (s2VehicleCol === -1)
    throw new Error(`Sheet2: Cannot find vehicle column. Headers: ${s2Headers.join(", ")}`);
  if (s2ClientCol === -1)
    throw new Error(`Sheet2: Cannot find 'Running company/School' column. Headers: ${s2Headers.join(", ")}`);

  const clientMap: Record<string, VehicleScore[]> = {};
  const otherVehicles: VehicleScore[] = [];
  const matchedVehicles = new Set<string>();

  for (let i = 1; i < sheet2Rows.length; i++) {
    const row = sheet2Rows[i];
    const vNum = row[s2VehicleCol]?.trim();
    if (!vNum) continue;
    const client = row[s2ClientCol]?.trim();
    matchedVehicles.add(vNum);

    const score = vehicleScoreMap[vNum] ?? null;
    const vehicleScore: VehicleScore = { vehicleNumber: vNum, score };

    if (!client) {
      otherVehicles.push(vehicleScore);
    } else {
      if (!clientMap[client]) clientMap[client] = [];
      clientMap[client].push(vehicleScore);
    }
  }

  for (const [vNum, score] of Object.entries(vehicleScoreMap)) {
    if (!matchedVehicles.has(vNum)) {
      otherVehicles.push({ vehicleNumber: vNum, score });
    }
  }

  if (otherVehicles.length > 0) {
    clientMap["Other"] = otherVehicles;
  }

  const clients: ClientData[] = Object.entries(clientMap).map(([name, vehicles]) => {
    const scored = vehicles.filter((v) => v.score !== null);
    const averageScore =
      scored.length > 0
        ? Math.round(scored.reduce((sum, v) => sum + (v.score ?? 0), 0) / scored.length)
        : 0;
    return { name, vehicles, averageScore, totalVehicles: vehicles.length };
  });

  clients.sort((a, b) => {
    if (a.name === "Other") return 1;
    if (b.name === "Other") return -1;
    return b.averageScore - a.averageScore;
  });

  const totalVehicles = clients.reduce((sum, c) => sum + c.totalVehicles, 0);

  return {
    clients,
    lastUpdated: new Date().toISOString(),
    totalVehicles,
  };
}
