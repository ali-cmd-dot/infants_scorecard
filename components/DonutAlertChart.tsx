import React from "react";
import { AlertSummary } from "@/lib/sheets";

const ALERT_TYPES = [
  { key: "distractedDriving", short: "Distracted",  color: "#f87171" },
  { key: "seatBeltAbsent",    short: "Seat Belt",   color: "#fb923c" },
  { key: "smoking",           short: "Smoking",     color: "#94a3b8" },
  { key: "fatigueDriving",    short: "Fatigue",     color: "#60a5fa" },
  { key: "phoneCall",         short: "Phone",       color: "#f472b6" },
  { key: "overSpeed",         short: "Overspeed",   color: "#fde047" },
];

interface Props {
  alerts: AlertSummary;
  title?: string;
  titleCenter?: boolean;
  compact?: boolean;
  card?: boolean;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArc(cx: number, cy: number, OR: number, IR: number, sa: number, ea: number): string {
  const gap = 1.5, sA = sa + gap/2, eA = ea - gap/2;
  if (eA <= sA) return "";
  const o1=polarToCartesian(cx,cy,OR,sA), o2=polarToCartesian(cx,cy,OR,eA);
  const i1=polarToCartesian(cx,cy,IR,sA), i2=polarToCartesian(cx,cy,IR,eA);
  const lg = eA-sA>180?1:0;
  return [`M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,`A ${OR} ${OR} 0 ${lg} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,`L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,`A ${IR} ${IR} 0 ${lg} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,"Z"].join(" ");
}

function buildSegments(alerts: AlertSummary) {
  const total = alerts.totalAlerts || 0;
  let angle = 0;
  return ALERT_TYPES.map(t => {
    const val = alerts[t.key as keyof AlertSummary] as number;
    const pct = total > 0 ? val / total : 0;
    const sweep = pct * 360;
    const start = angle; angle += sweep;
    return { ...t, val, pct, startAngle: start, endAngle: angle, midAngle: start + sweep/2 };
  }).filter(s => s.val > 0);
}

// ── Collision-free label positioning ────────────────────────────────────────
function positionLabels(
  segments: ReturnType<typeof buildSegments>,
  CX: number, CY: number, OR: number,
  lineReach: number, horizLen: number,
  minSpacing: number
) {
  const right = segments.filter(s => s.midAngle >= 0   && s.midAngle < 180);
  const left  = segments.filter(s => s.midAngle >= 180 && s.midAngle < 360);

  function spread(group: typeof segments, isRight: boolean) {
    // Natural y positions
    const items = group.map(seg => {
      const p = polarToCartesian(CX, CY, OR + lineReach, seg.midAngle);
      return { seg, naturalY: p.y, finalY: p.y };
    });
    // Sort by natural y
    items.sort((a,b) => a.naturalY - b.naturalY);
    // Push apart with minimum spacing
    for (let i = 1; i < items.length; i++) {
      if (items[i].finalY - items[i-1].finalY < minSpacing) {
        items[i].finalY = items[i-1].finalY + minSpacing;
      }
    }
    // Also push upward if needed (reverse pass)
    for (let i = items.length - 2; i >= 0; i--) {
      if (items[i+1].finalY - items[i].finalY < minSpacing) {
        items[i].finalY = items[i+1].finalY - minSpacing;
      }
    }
    return items.map(item => {
      const kinkPt = polarToCartesian(CX, CY, OR + lineReach, item.seg.midAngle);
      const endX = isRight ? CX + OR + lineReach + horizLen : CX - OR - lineReach - horizLen;
      return { seg: item.seg, dotPt: polarToCartesian(CX, CY, OR+5, item.seg.midAngle), kinkPt, endX, endY: item.finalY };
    });
  }

  return [...spread(right, true), ...spread(left, false)];
}

// ── CARD: side-by-side donut + legend list ───────────────────────────────────
function CardDonut({ alerts }: { alerts: AlertSummary }) {
  const total = alerts.totalAlerts || 0;
  const segments = buildSegments(alerts);
  const active = ALERT_TYPES.map(t => ({ ...t, val: alerts[t.key as keyof AlertSummary] as number })).filter(t => t.val > 0);
  const W=200, H=200, CX=100, CY=100, OR=80, IR=51;

  if (total === 0) return <div style={{ padding:"12px 0", color:"rgba(255,255,255,0.2)", fontFamily:"'Inter',sans-serif", fontSize:"11px", textAlign:"center" }}>No alert data</div>;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
      <div style={{ flexShrink:0, width:`${W}px` }}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display:"block" }}>
          <defs>
            <radialGradient id="cg_c" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(74,222,128,0.1)"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
          </defs>
          <circle cx={CX} cy={CY} r={OR+14} fill="url(#cg_c)"/>
          <circle cx={CX} cy={CY} r={(OR+IR)/2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={OR-IR}/>
          {segments.map(s=><path key={s.key} d={donutArc(CX,CY,OR,IR,s.startAngle,s.endAngle)} fill={s.color} fillOpacity={0.9} stroke="rgba(10,15,10,0.9)" strokeWidth="1"/>)}
          <circle cx={CX} cy={CY} r={IR-1} fill="#111811"/>
          <text x={CX} y={CY-9} textAnchor="middle" dominantBaseline="middle" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:"20px",fill:"#f0f7f0"}}>{fmt(total)}</text>
          <text x={CX} y={CY+10} textAnchor="middle" dominantBaseline="middle" style={{fontFamily:"'Inter',sans-serif",fontSize:"7px",fill:"rgba(255,255,255,0.35)",letterSpacing:"0.1em"}}>TOTAL ALARMS</text>
        </svg>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"5px" }}>
        {active.map(item=>{
          const pct = total>0?((item.val/total)*100):0;
          return (
            <div key={item.key} style={{ display:"flex", alignItems:"center", background:`${item.color}0e`, border:`1px solid ${item.color}28`, borderRadius:"6px", padding:"4px 8px", gap:"6px" }}>
              <div style={{ width:"7px", height:"7px", borderRadius:"2px", background:item.color, flexShrink:0 }}/>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"9.5px", color:"rgba(255,255,255,0.5)", fontWeight:500, flex:1, whiteSpace:"nowrap" }}>{item.short}</span>
              <span style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:"11px", color:item.color, flexShrink:0 }}>{fmt(item.val)}</span>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"8.5px", color:"rgba(255,255,255,0.28)", flexShrink:0 }}>{pct.toFixed(pct<1?1:0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FULL / COMPACT: large donut with collision-free leader lines ─────────────
function FullDonut({ alerts, compact }: { alerts: AlertSummary; compact?: boolean }) {
  const segments = buildSegments(alerts);
  const total = alerts.totalAlerts || 0;

  // Large viewbox — labels fit on both sides
  const W = compact ? 640 : 820;
  const H = compact ? 360 : 480;
  const OR = compact ? 110 : 148;
  const IR = compact ? 70 : 94;
  const CX = W / 2;
  const CY = H / 2 - (compact ? 0 : 10);

  const labeled = positionLabels(segments, CX, CY, OR,
    compact ? 28 : 36,   // lineReach
    compact ? 70 : 90,   // horizLen
    compact ? 17 : 20,   // minSpacing
  );

  const legendY = H - 18;
  const iw = W / Math.min(segments.length || 1, 6);
  const fs = compact ? 11 : 13;
  const ps = compact ? 10 : 11.5;
  const cfs = compact ? 30 : 40;
  const sfs = compact ? 9 : 11;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display:"block", maxWidth:`${W}px`, margin:"0 auto" }}>
      <defs>
        <radialGradient id={`cg_f${compact?"c":"f"}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(74,222,128,0.13)"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={OR+22} fill={`url(#cg_f${compact?"c":"f"})`}/>
      <circle cx={CX} cy={CY} r={(OR+IR)/2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={OR-IR}/>
      {segments.map(s=>(
        <path key={s.key} d={donutArc(CX,CY,OR,IR,s.startAngle,s.endAngle)}
          fill={s.color} fillOpacity={0.88} stroke="rgba(10,15,10,0.7)" strokeWidth="0.7"/>
      ))}
      <circle cx={CX} cy={CY} r={IR-1} fill="#0a0f0a"/>

      <text x={CX} y={CY-sfs*1.3} textAnchor="middle" dominantBaseline="middle"
        style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:`${cfs}px`,fill:"#f0f7f0"}}>
        {fmt(total)}
      </text>
      <text x={CX} y={CY+sfs*1.7} textAnchor="middle" dominantBaseline="middle"
        style={{fontFamily:"'Inter',sans-serif",fontSize:`${sfs}px`,fill:"rgba(255,255,255,0.38)",letterSpacing:"0.1em"}}>
        TOTAL ALARMS
      </text>

      {labeled.map(({ seg, dotPt, kinkPt, endX, endY }) => {
        const isRight = seg.midAngle < 180;
        const pctStr = `(${(seg.pct*100).toFixed(seg.pct<0.01?2:seg.pct<0.1?1:0)}%)`;
        return (
          <g key={`lbl-${seg.key}`}>
            <circle cx={dotPt.x} cy={dotPt.y} r={compact?2.5:3} fill={seg.color}/>
            <polyline
              points={`${dotPt.x.toFixed(1)},${dotPt.y.toFixed(1)} ${kinkPt.x.toFixed(1)},${kinkPt.y.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`}
              fill="none" stroke={seg.color} strokeWidth="0.9" strokeOpacity="0.65"
            />
            <text
              x={isRight ? endX+5 : endX-5}
              y={endY}
              textAnchor={isRight?"start":"end"}
              dominantBaseline="middle"
              style={{fontFamily:"'Inter',sans-serif",fontSize:`${fs}px`,fill:"rgba(240,247,240,0.85)",fontWeight:500}}>
              {seg.short}{" "}
              <tspan fill={seg.color} fontWeight="700" fontSize={`${ps}px`}>{pctStr}</tspan>
            </text>
          </g>
        );
      })}

      {/* Legend row */}
      {!compact && (
        <g>
          {segments.map((seg,i)=>{
            const lx=(i+0.5)*iw;
            return (
              <g key={`leg-${seg.key}`}>
                <rect x={lx-20} y={legendY-5} width={11} height={11} rx={2} fill={seg.color} fillOpacity={0.85}/>
                <text x={lx-6} y={legendY+1} dominantBaseline="middle"
                  style={{fontFamily:"'Inter',sans-serif",fontSize:"10px",fill:"rgba(255,255,255,0.4)"}}>
                  {seg.short}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

export default function DonutAlertChart({ alerts, title, titleCenter=false, compact=false, card=false }: Props) {
  const total = alerts.totalAlerts || 0;

  const titleEl = title && (
    <div style={{
      fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700,
      fontSize: card?"11px":compact?"13px":"16px",
      color:"#f0f7f0", marginBottom: card?"10px":"18px",
      letterSpacing:"-0.01em", textAlign:titleCenter?"center":"left",
    }}>{title}</div>
  );

  const emptyEl = (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center", height:card?"80px":"140px",
      color:"rgba(255,255,255,0.2)",fontFamily:"'Inter',sans-serif",fontSize:"12px",
      background:"rgba(255,255,255,0.02)",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.05)" }}>
      No alert data
    </div>
  );

  if (card) return <div>{titleEl}{total===0?emptyEl:<CardDonut alerts={alerts}/>}</div>;
  return (
    <div style={{ marginBottom:compact?0:"10px", width:"100%" }}>
      {titleEl}
      {total===0?emptyEl:<FullDonut alerts={alerts} compact={compact}/>}
    </div>
  );
}
