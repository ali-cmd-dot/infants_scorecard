import React from "react";
import { AlertSummary } from "@/lib/sheets";

const ALERT_TYPES = [
  { key: "distractedDriving", label: "Distracted Driving", color: "#f87171" },
  { key: "seatBeltAbsent",    label: "Seat Belt Absent",   color: "#fb923c" },
  { key: "smoking",           label: "Smoking",            color: "#94a3b8" },
  { key: "fatigueDriving",    label: "Fatigue Driving",    color: "#60a5fa" },
  { key: "phoneCall",         label: "Phone Call",         color: "#f472b6" },
  { key: "overSpeed",         label: "Over Speed",         color: "#fde047" },
];

interface Props {
  alerts: AlertSummary;
  title?: string;
  compact?: boolean; // smaller version for cards/modals
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegment(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startAngle: number, endAngle: number
): string {
  const gap = 1.2; // small gap between segments in degrees
  const sA = startAngle + gap / 2;
  const eA = endAngle - gap / 2;
  if (eA <= sA) return "";

  const o1 = polarToCartesian(cx, cy, outerR, sA);
  const o2 = polarToCartesian(cx, cy, outerR, eA);
  const i1 = polarToCartesian(cx, cy, innerR, sA);
  const i2 = polarToCartesian(cx, cy, innerR, eA);
  const large = eA - sA > 180 ? 1 : 0;

  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export default function DonutAlertChart({ alerts, title, compact = false }: Props) {
  const total = alerts.totalAlerts || 0;

  // Build segments data
  const items = ALERT_TYPES.map(t => ({
    ...t,
    val: alerts[t.key as keyof AlertSummary] as number,
  })).filter(t => t.val > 0);

  // SVG dimensions
  const W = compact ? 420 : 580;
  const H = compact ? 280 : 360;
  const CX = compact ? 160 : 210;
  const CY = H / 2;
  const OUTER_R = compact ? 100 : 130;
  const INNER_R = compact ? 62 : 82;
  const LABEL_R  = OUTER_R + (compact ? 22 : 28);
  const TEXT_R   = OUTER_R + (compact ? 38 : 52);
  const fontSize = compact ? 9 : 11;
  const pctSize  = compact ? 8 : 10;

  // Calculate angles
  let currentAngle = 0;
  type Segment = typeof items[0] & {
    startAngle: number;
    endAngle: number;
    midAngle: number;
    pct: number;
  };
  const segments: Segment[] = items.map(item => {
    const pct = total > 0 ? item.val / total : 0;
    const sweep = pct * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep;
    const midAngle = startAngle + sweep / 2;
    currentAngle = endAngle;
    return { ...item, startAngle, endAngle, midAngle, pct };
  });

  return (
    <div style={{ marginBottom: compact ? 0 : "28px" }}>
      {title && (
        <div style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: compact ? "13px" : "15px",
          color: "#f0f7f0",
          marginBottom: "14px",
          letterSpacing: "-0.01em",
        }}>
          {title}
        </div>
      )}

      {total === 0 ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "120px",
          color: "rgba(255,255,255,0.2)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "13px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          No alert data
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            style={{ maxWidth: `${W}px`, display: "block" }}
          >
            {/* Glow behind donut */}
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(74,222,128,0.15)" />
                <stop offset="100%" stopColor="rgba(74,222,128,0)" />
              </radialGradient>
              {segments.map(s => (
                <filter key={`glow-${s.key}`} id={`glow-${s.key}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            {/* Background glow circle */}
            <circle cx={CX} cy={CY} r={OUTER_R + 20} fill="url(#centerGlow)" />

            {/* Donut segments */}
            {segments.map(seg => (
              <path
                key={seg.key}
                d={donutSegment(CX, CY, OUTER_R, INNER_R, seg.startAngle, seg.endAngle)}
                fill={seg.color}
                fillOpacity={0.88}
                stroke="rgba(10,15,10,0.6)"
                strokeWidth="0.5"
              />
            ))}

            {/* Inner circle (dark) */}
            <circle cx={CX} cy={CY} r={INNER_R - 1} fill="#0a0f0a" />

            {/* Center: total label */}
            <text
              x={CX}
              y={CY - (compact ? 10 : 14)}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: compact ? "22px" : "28px",
                fill: "#f0f7f0",
              }}
            >
              {fmt(total)}
            </text>
            <text
              x={CX}
              y={CY + (compact ? 10 : 14)}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: compact ? "8px" : "10px",
                fill: "rgba(255,255,255,0.4)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Total Alarms
            </text>

            {/* Leader lines + labels */}
            {segments.map(seg => {
              const mid = seg.midAngle;
              const isRight = mid < 180;

              // Points for leader line
              const p1 = polarToCartesian(CX, CY, OUTER_R + (compact ? 4 : 6), mid);
              const p2 = polarToCartesian(CX, CY, LABEL_R + (compact ? 4 : 8), mid);

              // Horizontal end point
              const textX = isRight
                ? CX + TEXT_R + (compact ? 50 : 70)
                : CX - TEXT_R - (compact ? 50 : 70);
              const p3 = { x: textX, y: p2.y };

              const pctStr = `(${(seg.pct * 100).toFixed(seg.pct < 0.01 ? 2 : seg.pct < 0.1 ? 2 : 1)}%)`;

              return (
                <g key={`label-${seg.key}`}>
                  {/* Dot on segment edge */}
                  <circle cx={p1.x} cy={p1.y} r={compact ? 2 : 2.5} fill={seg.color} />

                  {/* Leader line */}
                  <polyline
                    points={`${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="0.8"
                    strokeOpacity="0.7"
                  />

                  {/* Label text */}
                  <text
                    x={isRight ? p3.x + (compact ? 4 : 5) : p3.x - (compact ? 4 : 5)}
                    y={p3.y}
                    textAnchor={isRight ? "start" : "end"}
                    dominantBaseline="middle"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: `${fontSize}px`,
                      fill: "rgba(240,247,240,0.75)",
                      fontWeight: 500,
                    }}
                  >
                    {seg.label}{" "}
                    <tspan fill={seg.color} fontWeight="600" fontSize={`${pctSize}px`}>
                      {pctStr}
                    </tspan>
                  </text>
                </g>
              );
            })}

            {/* Legend row at bottom */}
            {!compact && (() => {
              const legendY = H - 28;
              const itemW = W / Math.min(segments.length, 6);
              return (
                <g>
                  {segments.map((seg, i) => {
                    const lx = (i + 0.5) * itemW;
                    return (
                      <g key={`leg-${seg.key}`}>
                        <rect x={lx - 16} y={legendY - 5} width={10} height={10} rx={2}
                          fill={seg.color} fillOpacity={0.85} />
                        <text x={lx - 3} y={legendY + 1}
                          dominantBaseline="middle"
                          style={{ fontFamily: "'Inter', sans-serif", fontSize: "8px", fill: "rgba(255,255,255,0.4)" }}>
                          {seg.label.split(" ")[0]}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </div>
      )}
    </div>
  );
}
