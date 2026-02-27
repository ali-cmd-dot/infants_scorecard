export interface VehicleScore { vehicleNumber: string; score: number | null; }

export interface AlertSummary {
  distractedDriving: number; seatBeltAbsent: number; smoking: number;
  fatigueDriving: number; phoneCall: number; overSpeed: number; totalAlerts: number;
}

export interface DateAlertPoint {
  date: string;
  distractedDriving: number; seatBeltAbsent: number; smoking: number;
  fatigueDriving: number; phoneCall: number; overSpeed: number;
}

export interface VehicleData { vehicleNumber: string; score: number | null; clientName: string; alerts: AlertSummary; }
export interface ClientData { name: string; vehicles: VehicleScore[]; averageScore: number; totalVehicles: number; alerts: AlertSummary; }
export interface DashboardData {
  clients: ClientData[]; vehicles: VehicleData[]; overallAlerts: AlertSummary;
  dateAlerts: DateAlertPoint[]; lastUpdated: string; totalVehicles: number;
}

const SHEET1_ID = "1f4-NLt91O_81eB7tCqpgnpglAhZGwxbuSk2Lrc2YY2A";
const SHEET1_SUMMARY_GID = "1750056371";
const SHEET2_ID = "1GFUotxyLDqe-2qIOOmuSlshODi6FmzFdPaQ8vtv17AU";
const SHEET2_GID = "368130144";
const SHEET1_ALERTS_GID = "793292000";

async function fetchSheetCSV(id: string, gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${id} gid=${gid} → ${res.status}`);
  return parseCSV(await res.text());
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const cols: string[] = []; let inQ = false, cur = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim()); rows.push(cols);
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

function safeInt(v?: string): number { if (!v) return 0; const n = parseInt(v.replace(/,/g, ""), 10); return isNaN(n) ? 0 : n; }
function emptyAlerts(): AlertSummary { return { distractedDriving:0,seatBeltAbsent:0,smoking:0,fatigueDriving:0,phoneCall:0,overSpeed:0,totalAlerts:0 }; }
function addAlerts(a: AlertSummary, b: AlertSummary): AlertSummary {
  return {
    distractedDriving: a.distractedDriving+b.distractedDriving, seatBeltAbsent: a.seatBeltAbsent+b.seatBeltAbsent,
    smoking: a.smoking+b.smoking, fatigueDriving: a.fatigueDriving+b.fatigueDriving,
    phoneCall: a.phoneCall+b.phoneCall, overSpeed: a.overSpeed+b.overSpeed, totalAlerts: a.totalAlerts+b.totalAlerts,
  };
}

// ── Date sort key — handles DD/MM/YYYY, YYYY-MM-DD, etc. without ambiguity ──
function dateSortKey(raw: string): number {
  const s = raw.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(+m[3], +m[2]-1, +m[1]).getTime();
  // YYYY-MM-DD
  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3]).getTime();
  // DD/MM/YY
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) return new Date(2000 + +m[3], +m[2]-1, +m[1]).getTime();
  return 0;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [summaryRows, alertRows, s2Rows] = await Promise.all([
    fetchSheetCSV(SHEET1_ID, SHEET1_SUMMARY_GID),
    fetchSheetCSV(SHEET1_ID, SHEET1_ALERTS_GID),
    fetchSheetCSV(SHEET2_ID, SHEET2_GID),
  ]);
  if (!summaryRows.length) throw new Error("Summary tab is empty");

  const h1 = summaryRows[0].map(h => h.trim());
  const vCol1 = findCol(h1,"Vehicle Number","VehicleNumber","vehicle no");
  const sCol  = findCol(h1,"Scores","Score","scores","Total Score");
  if (vCol1===-1) throw new Error("Summary: No vehicle column. Got: "+h1.join(", "));
  if (sCol ===-1) throw new Error("Summary: No score column. Got: "+h1.join(", "));

  const sheet1Vehicles: {vehicleNumber:string;score:number|null}[] = [];
  for (let i=1;i<summaryRows.length;i++) {
    const v=summaryRows[i][vCol1]?.trim(); if(!v) continue;
    const n=parseFloat(summaryRows[i][sCol]?.trim()||"");
    sheet1Vehicles.push({vehicleNumber:v,score:isNaN(n)?null:n});
  }

  const vehicleAlertMap: Record<string,AlertSummary> = {};
  const dateAlertMap: Record<string,DateAlertPoint> = {};

  if (alertRows.length>1) {
    const ha=alertRows[0].map(h=>h.trim());
    const plateCol  =findCol(ha,"plate_number","plate number","PlateNumber","Vehicle Number");
    const dateCol   =findCol(ha,"date","Date","alarm_date","AlarmDate","created_at","Created At");
    const distCol   =findCol(ha,"DistractedDrivingAlarm","Distracted Driving");
    const seatCol   =findCol(ha,"SeatBeltAbsent","Seat Belt Absent","SeatBelt");
    const smokeCol  =findCol(ha,"SmokingAlarm","Smoking");
    const fatigueCol=findCol(ha,"FatigueDrivingAlarm","Fatigue Driving");
    const phoneCol  =findCol(ha,"PhoneCallAlarm","Phone Call");
    const speedCol  =findCol(ha,"OverSpeedAlarm","OverSpeed","Over Speed");
    const totalCol  =findCol(ha,"total_alerts","Total Alerts","TotalAlerts");
    if (plateCol===-1) throw new Error("Alerts: No plate_number column. Got: "+ha.join(", "));

    for (let i=1;i<alertRows.length;i++) {
      const row=alertRows[i];
      const plate=row[plateCol]?.trim(); if(!plate) continue;
      const ra: AlertSummary = {
        distractedDriving: distCol   !==-1?safeInt(row[distCol])   :0,
        seatBeltAbsent:    seatCol   !==-1?safeInt(row[seatCol])   :0,
        smoking:           smokeCol  !==-1?safeInt(row[smokeCol])  :0,
        fatigueDriving:    fatigueCol!==-1?safeInt(row[fatigueCol]):0,
        phoneCall:         phoneCol  !==-1?safeInt(row[phoneCol])  :0,
        overSpeed:         speedCol  !==-1?safeInt(row[speedCol])  :0,
        totalAlerts:       totalCol  !==-1?safeInt(row[totalCol])  :0,
      };
      if (!vehicleAlertMap[plate]) vehicleAlertMap[plate]=emptyAlerts();
      vehicleAlertMap[plate]=addAlerts(vehicleAlertMap[plate],ra);

      if (dateCol!==-1) {
        const dk=row[dateCol]?.trim(); if(!dk) continue;
        if (!dateAlertMap[dk]) dateAlertMap[dk]={date:dk,distractedDriving:0,seatBeltAbsent:0,smoking:0,fatigueDriving:0,phoneCall:0,overSpeed:0};
        dateAlertMap[dk].distractedDriving+=ra.distractedDriving;
        dateAlertMap[dk].seatBeltAbsent   +=ra.seatBeltAbsent;
        dateAlertMap[dk].smoking          +=ra.smoking;
        dateAlertMap[dk].fatigueDriving   +=ra.fatigueDriving;
        dateAlertMap[dk].phoneCall        +=ra.phoneCall;
        dateAlertMap[dk].overSpeed        +=ra.overSpeed;
      }
    }
  }

  const dateAlerts = Object.values(dateAlertMap).sort((a,b)=>{
    const ka=dateSortKey(a.date), kb=dateSortKey(b.date);
    if (ka&&kb) return ka-kb;
    return a.date.localeCompare(b.date);
  });

  const h2=s2Rows[0].map(h=>h.trim());
  const vCol2=findCol(h2,"Vehicle Number/Chassis Number","VehicleNumber/ChassisNumberNO.","Vehicle Number","VehicleNumber","Chassis Number","vehicle number");
  const cCol =findCol(h2,"Running company/School","Running Company/School","Running company","School");
  if (vCol2===-1) throw new Error("Sheet2: No vehicle column. Got: "+h2.join(", "));
  if (cCol ===-1) throw new Error("Sheet2: No client column. Got: "+h2.join(", "));

  const vehicleToClient: Record<string,string>={};
  for (let i=1;i<s2Rows.length;i++) {
    const v=s2Rows[i][vCol2]?.trim(); if(!v) continue;
    const c=s2Rows[i][cCol]?.trim(); if(c) vehicleToClient[v]=c;
  }

  const allVehicles: VehicleData[]=[];
  const clientMap: Record<string,{vehicles:VehicleScore[];alerts:AlertSummary}>={};
  for (const {vehicleNumber,score} of sheet1Vehicles) {
    const cn=vehicleToClient[vehicleNumber]||"Other";
    const alerts=vehicleAlertMap[vehicleNumber]||emptyAlerts();
    allVehicles.push({vehicleNumber,score,clientName:cn,alerts});
    if (!clientMap[cn]) clientMap[cn]={vehicles:[],alerts:emptyAlerts()};
    clientMap[cn].vehicles.push({vehicleNumber,score});
    clientMap[cn].alerts=addAlerts(clientMap[cn].alerts,alerts);
  }

  const clients: ClientData[]=Object.entries(clientMap).map(([name,data])=>{
    const scored=data.vehicles.filter(v=>v.score!==null);
    const avg=scored.length?Math.round(scored.reduce((s,v)=>s+(v.score??0),0)/scored.length):0;
    return {name,vehicles:data.vehicles,averageScore:avg,totalVehicles:data.vehicles.length,alerts:data.alerts};
  });
  clients.sort((a,b)=>{if(a.name==="Other")return 1;if(b.name==="Other")return-1;return b.averageScore-a.averageScore;});

  return {clients,vehicles:allVehicles,overallAlerts:allVehicles.reduce((a,v)=>addAlerts(a,v.alerts),emptyAlerts()),dateAlerts,lastUpdated:new Date().toISOString(),totalVehicles:sheet1Vehicles.length};
}
