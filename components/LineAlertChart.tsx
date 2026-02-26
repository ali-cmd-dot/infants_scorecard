import React, { useMemo, useRef, useState, useCallback } from "react";
import { DateAlertPoint } from "@/lib/sheets";

const SERIES = [
  { key: "distractedDriving", label: "Distracted Driving", color: "#f87171" },
  { key: "seatBeltAbsent",    label: "Seat Belt Absent",   color: "#fb923c" },
  { key: "smoking",           label: "Smoking",            color: "#94a3b8" },
  { key: "fatigueDriving",    label: "Fatigue Driving",    color: "#60a5fa" },
  { key: "phoneCall",         label: "Phone Call",         color: "#f472b6" },
  { key: "overSpeed",         label: "Over Speed",         color: "#fde047" },
] as const;

interface Props { data: DateAlertPoint[]; title?: string; }

function fmtY(n: number) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+"M";
  if (n >= 1000) return (n/1000).toFixed(0)+"k";
  return String(n);
}

function smoothPath(pts: {x:number;y:number}[]): string {
  if (pts.length < 2) return "";
  const t = 0.3;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length-1; i++) {
    const p0=pts[Math.max(i-1,0)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(i+2,pts.length-1)];
    const cp1x=p1.x+(p2.x-p0.x)*t, cp1y=p1.y+(p2.y-p0.y)*t;
    const cp2x=p2.x-(p3.x-p1.x)*t, cp2y=p2.y-(p3.y-p1.y)*t;
    d+=` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)},${cp2x.toFixed(1)} ${cp2y.toFixed(1)},${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function areaPath(pts: {x:number;y:number}[], baseY: number): string {
  if (pts.length < 2) return "";
  return `${smoothPath(pts)} L ${pts[pts.length-1].x.toFixed(1)} ${baseY} L ${pts[0].x.toFixed(1)} ${baseY} Z`;
}

export default function LineAlertChart({ data, title }: Props) {
  const PAD_L=64, PAD_R=28, PAD_T=28, PAD_B=80;
  const W=900, H=400;
  const chartW=W-PAD_L-PAD_R, chartH=H-PAD_T-PAD_B;
  const baseY=PAD_T+chartH;

  const [hoverIdx, setHoverIdx] = useState<number|null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { pointsMap, yMax, yTicks, xStep } = useMemo(()=>{
    if (!data.length) return { pointsMap:{}, yMax:100, yTicks:[], xStep:0 };
    let max=0;
    for (const d of data) for (const s of SERIES) { const v=d[s.key] as number; if (v>max) max=v; }
    const mag=Math.pow(10,Math.floor(Math.log10(max||1)));
    const niceMax=Math.ceil((max*1.1)/mag)*mag;
    const step=niceMax/5;
    const ticks=Array.from({length:6},(_,i)=>Math.round(i*step));
    const xSt = data.length>1?chartW/(data.length-1):chartW;
    const pm: Record<string,{x:number;y:number}[]>={};
    for (const s of SERIES) {
      pm[s.key]=data.map((d,i)=>({ x:PAD_L+i*xSt, y:PAD_T+chartH-((d[s.key] as number)/niceMax)*chartH }));
    }
    return { pointsMap:pm, yMax:niceMax, yTicks:ticks, xStep:xSt };
  }, [data, chartW, chartH]);

  // How many x-axis labels
  const maxLabels = 14;
  const everyN = data.length<=maxLabels ? 1 : Math.ceil(data.length/maxLabels);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !data.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const relX = mouseX - PAD_L;
    const idx = Math.max(0, Math.min(data.length-1, Math.round(relX / (xStep||1))));
    setHoverIdx(idx);
  }, [data.length, xStep]);

  const handleMouseLeave = useCallback(()=>setHoverIdx(null),[]);

  const hoverX = hoverIdx !== null ? PAD_L + hoverIdx * xStep : null;
  const hoverData = hoverIdx !== null ? data[hoverIdx] : null;

  // Tooltip position: flip to left if near right edge
  const tooltipLeft = hoverX !== null && hoverX > W*0.6;

  if (!data.length) {
    return (
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"200px",
        color:"rgba(255,255,255,0.2)",fontFamily:"'Inter',sans-serif",fontSize:"13px",
        background:"rgba(255,255,255,0.02)",borderRadius:"14px",border:"1px solid rgba(255,255,255,0.05)" }}>
        No date-based data — make sure the Alerts tab has a &ldquo;date&rdquo; column
      </div>
    );
  }

  return (
    <div>
      {title && (
        <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:700, fontSize:"15px",
          color:"#f0f7f0", marginBottom:"16px", letterSpacing:"-0.01em" }}>
          {title}
        </div>
      )}
      <div style={{ overflowX:"auto" }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%"
          style={{ display:"block", minWidth:"520px", cursor:"crosshair" }}
          onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>

          <defs>
            {SERIES.map(s=>(
              <linearGradient key={`g-${s.key}`} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.4"/>
                <stop offset="100%" stopColor={s.color} stopOpacity="0.04"/>
              </linearGradient>
            ))}
          </defs>

          {/* Y grid + labels */}
          {yTicks.map(tick=>{
            const y=PAD_T+chartH-(tick/yMax)*chartH;
            return (
              <g key={`g-${tick}`}>
                <line x1={PAD_L} y1={y} x2={PAD_L+chartW} y2={y}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                  strokeDasharray={tick===0?"none":"5 5"}/>
                <text x={PAD_L-8} y={y} textAnchor="end" dominantBaseline="middle"
                  style={{fontFamily:"'Inter',sans-serif",fontSize:"11px",fill:"rgba(255,255,255,0.32)"}}>
                  {fmtY(tick)}
                </text>
              </g>
            );
          })}

          {/* X labels */}
          {data.map((d,i)=>{
            if (i % everyN !== 0 && i !== data.length-1) return null;
            const x=PAD_L+i*xStep;
            return (
              <text key={`xl-${i}`} x={x} y={baseY+18} textAnchor="middle"
                style={{fontFamily:"'Inter',sans-serif",fontSize:"10px",fill:"rgba(255,255,255,0.35)"}}>
                {d.date}
              </text>
            );
          })}

          {/* Area fills — reverse so smaller on top */}
          {[...SERIES].reverse().map(s=>{
            const pts=pointsMap[s.key];
            if (!pts||pts.length<2) return null;
            return <path key={`a-${s.key}`} d={areaPath(pts,baseY)} fill={`url(#g-${s.key})`} stroke="none"/>;
          })}

          {/* Lines */}
          {SERIES.map(s=>{
            const pts=pointsMap[s.key];
            if (!pts||pts.length<2) return null;
            return <path key={`l-${s.key}`} d={smoothPath(pts)} fill="none" stroke={s.color} strokeWidth="2" strokeOpacity={hoverIdx!==null?"0.4":"0.9"}/>;
          })}

          {/* Hover crosshair */}
          {hoverX !== null && (
            <>
              <line x1={hoverX} y1={PAD_T} x2={hoverX} y2={baseY}
                stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="4 3"/>

              {/* Highlight dots on each line */}
              {SERIES.map(s=>{
                const pts=pointsMap[s.key];
                if (!pts||hoverIdx===null) return null;
                const pt=pts[hoverIdx];
                const val=(hoverData?.[s.key] as number)||0;
                if (val===0) return null;
                return <circle key={`dot-${s.key}`} cx={pt.x} cy={pt.y} r="5" fill={s.color} stroke="#0a0f0a" strokeWidth="2"/>;
              })}

              {/* Tooltip box */}
              {hoverData && (() => {
                const BOX_W=190, BOX_H=8+SERIES.filter(s=>(hoverData[s.key] as number)>0).length*20+12;
                const bx = tooltipLeft ? hoverX-BOX_W-14 : hoverX+14;
                const by = Math.max(PAD_T, Math.min(baseY-BOX_H, PAD_T+chartH/2-BOX_H/2));
                const activeSeries = SERIES.filter(s=>(hoverData[s.key] as number)>0);
                return (
                  <g>
                    <rect x={bx} y={by} width={BOX_W} height={BOX_H} rx="8"
                      fill="#0e160e" stroke="rgba(74,222,128,0.25)" strokeWidth="1"
                      style={{filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.6))"}}/>
                    <text x={bx+10} y={by+15} style={{fontFamily:"'Inter',sans-serif",fontSize:"10px",fill:"rgba(255,255,255,0.4)",fontWeight:600}}>
                      {hoverData.date}
                    </text>
                    {activeSeries.map((s,i)=>{
                      const val=hoverData[s.key] as number;
                      return (
                        <g key={`tt-${s.key}`}>
                          <circle cx={bx+16} cy={by+30+i*20} r="4" fill={s.color}/>
                          <text x={bx+26} y={by+30+i*20} dominantBaseline="middle"
                            style={{fontFamily:"'Inter',sans-serif",fontSize:"11px",fill:"rgba(255,255,255,0.7)"}}>
                            {s.label}
                          </text>
                          <text x={bx+BOX_W-10} y={by+30+i*20} textAnchor="end" dominantBaseline="middle"
                            style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"12px",fontWeight:700,fill:s.color}}>
                            {fmtY(val)}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </>
          )}

          {/* Bottom legend */}
          {(() => {
            const ly=H-22;
            const totalLW=SERIES.length*145;
            const startX=(W-totalLW)/2;
            return (
              <g>
                {SERIES.map((s,i)=>{
                  const lx=startX+i*145;
                  return (
                    <g key={`leg-${s.key}`}>
                      <line x1={lx} y1={ly} x2={lx+18} y2={ly} stroke={s.color} strokeWidth="2.5" strokeOpacity="0.9"/>
                      <circle cx={lx+9} cy={ly} r="3.5" fill={s.color}/>
                      <text x={lx+25} y={ly} dominantBaseline="middle"
                        style={{fontFamily:"'Inter',sans-serif",fontSize:"11.5px",fill:"rgba(255,255,255,0.5)"}}>
                        {s.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
