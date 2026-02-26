import React, { useMemo } from "react";
import { DateAlertPoint } from "@/lib/sheets";

const SERIES = [
  { key: "distractedDriving", label: "Distracted Driving", color: "#f87171" },
  { key: "seatBeltAbsent",    label: "Seat Belt Absent",   color: "#fb923c" },
  { key: "smoking",           label: "Smoking",            color: "#94a3b8" },
  { key: "fatigueDriving",    label: "Fatigue Driving",    color: "#60a5fa" },
  { key: "phoneCall",         label: "Phone Call",         color: "#f472b6" },
  { key: "overSpeed",         label: "Over Speed",         color: "#fde047" },
] as const;

interface Props {
  data: DateAlertPoint[];
  title?: string;
}

// Smooth bezier path through points (Catmull-Rom → bezier)
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  const tension = 0.3;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function areaPath(pts: { x: number; y: number }[], baseY: number): string {
  if (pts.length < 2) return "";
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${line} L ${last.x.toFixed(1)} ${baseY.toFixed(1)} L ${first.x.toFixed(1)} ${baseY.toFixed(1)} Z`;
}

export default function LineAlertChart({ data, title }: Props) {
  const PAD_L = 58, PAD_R = 24, PAD_T = 28, PAD_B = 72;
  const W = 900, H = 340;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const { points, yMax, yTicks } = useMemo(() => {
    if (!data.length) return { points: {}, yMax: 100, yTicks: [] };

    // Find overall max across all series
    let max = 0;
    for (const d of data) {
      for (const s of SERIES) {
        const v = d[s.key as keyof DateAlertPoint] as number;
        if (v > max) max = v;
      }
    }
    // Round up to nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(max || 1)));
    const niceMax = Math.ceil((max * 1.1) / magnitude) * magnitude;

    // Y axis ticks — 5 intervals
    const step = niceMax / 5;
    const ticks: number[] = [];
    for (let i = 0; i <= 5; i++) ticks.push(Math.round(i * step));

    // Build XY points per series
    const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;
    const pts: Record<string, { x: number; y: number }[]> = {};
    for (const s of SERIES) {
      pts[s.key] = data.map((d, i) => {
        const val = d[s.key as keyof DateAlertPoint] as number;
        const x = PAD_L + i * xStep;
        const y = PAD_T + chartH - (val / niceMax) * chartH;
        return { x, y };
      });
    }

    return { points: pts, yMax: niceMax, yTicks: ticks };
  }, [data, chartW, chartH]);

  const baseY = PAD_T + chartH;
  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;

  // Decide how many X labels to show (max ~10)
  const xLabelEvery = Math.max(1, Math.ceil(data.length / 10));

  if (!data.length) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "200px", color: "rgba(255,255,255,0.2)",
        fontFamily: "'Inter', sans-serif", fontSize: "13px",
        background: "rgba(255,255,255,0.02)", borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
        No date-based data — make sure the Alerts tab has a &quot;date&quot; column
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "32px" }}>
      {title && (
        <div style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700, fontSize: "15px",
          color: "#f0f7f0", marginBottom: "16px",
          letterSpacing: "-0.01em",
        }}>
          {title}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: "block", minWidth: "520px" }}
        >
          <defs>
            {SERIES.map(s => (
              <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.04" />
              </linearGradient>
            ))}
          </defs>

          {/* Y grid lines */}
          {yTicks.map(tick => {
            const y = PAD_T + chartH - (tick / yMax) * chartH;
            return (
              <g key={`grid-${tick}`}>
                <line
                  x1={PAD_L} y1={y} x2={PAD_L + chartW} y2={y}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                  strokeDasharray={tick === 0 ? "none" : "4 4"}
                />
                <text x={PAD_L - 8} y={y} textAnchor="end" dominantBaseline="middle"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fill: "rgba(255,255,255,0.3)" }}>
                  {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {data.map((d, i) => {
            if (i % xLabelEvery !== 0 && i !== data.length - 1) return null;
            const x = PAD_L + i * xStep;
            return (
              <text key={`xlabel-${i}`} x={x} y={baseY + 16} textAnchor="middle"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fill: "rgba(255,255,255,0.35)" }}>
                {d.date}
              </text>
            );
          })}

          {/* Area fills — draw in reverse order so smaller ones on top */}
          {[...SERIES].reverse().map(s => {
            const pts = points[s.key];
            if (!pts || pts.length < 2) return null;
            return (
              <path key={`area-${s.key}`}
                d={areaPath(pts, baseY)}
                fill={`url(#grad-${s.key})`}
                stroke="none"
              />
            );
          })}

          {/* Lines */}
          {SERIES.map(s => {
            const pts = points[s.key];
            if (!pts || pts.length < 2) return null;
            return (
              <path key={`line-${s.key}`}
                d={smoothPath(pts)}
                fill="none"
                stroke={s.color}
                strokeWidth="1.8"
                strokeOpacity="0.9"
              />
            );
          })}

          {/* Dots at data points (only if few points) */}
          {data.length <= 20 && SERIES.map(s => {
            const pts = points[s.key];
            if (!pts) return null;
            return pts.map((pt, i) => (
              <circle key={`dot-${s.key}-${i}`}
                cx={pt.x} cy={pt.y} r="2.5"
                fill={s.color} fillOpacity="0.8"
              />
            ));
          })}

          {/* Legend */}
          {(() => {
            const legendY = H - 24;
            const totalW = SERIES.length * 140;
            const startX = (W - totalW) / 2;
            return (
              <g>
                {SERIES.map((s, i) => {
                  const lx = startX + i * 140;
                  return (
                    <g key={`leg-${s.key}`}>
                      {/* Line sample */}
                      <line x1={lx} y1={legendY} x2={lx + 18} y2={legendY}
                        stroke={s.color} strokeWidth="2" strokeOpacity="0.9" />
                      <circle cx={lx + 9} cy={legendY} r="3" fill={s.color} />
                      <text x={lx + 24} y={legendY} dominantBaseline="middle"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fill: "rgba(255,255,255,0.5)" }}>
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
