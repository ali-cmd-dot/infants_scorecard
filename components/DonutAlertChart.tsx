import React from "react";
import { AlertSummary } from "@/lib/sheets";

const ALERT_TYPES = [
  { key: "distractedDriving", label: "Distracted Driving", short: "Distracted", color: "#f87171" },
  { key: "seatBeltAbsent",    label: "Seat Belt Absent",   short: "Seat Belt",  color: "#fb923c" },
  { key: "smoking",           label: "Smoking",            short: "Smoking",    color: "#94a3b8" },
  { key: "fatigueDriving",    label: "Fatigue Driving",    short: "Fatigue",    color: "#60a5fa" },
  { key: "phoneCall",         label: "Phone Call",         short: "Phone",      color: "#f472b6" },
  { key: "overSpeed",         label: "Over Speed",         short: "Overspeed",  color: "#fde047" },
];

interface Props {
  alerts: AlertSummary;
  title?: string;
  compact?: boolean; // modal size with leader lines
  mini?: boolean;    // inside cards — donut + legend grid
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
  const gap = 1.5;
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

// ─── MINI: inside VehicleCard / ClientCard ──────────────────────────────────
function MiniDonut({ alerts }: { alerts: AlertSummary }) {
  const total = alerts.totalAlerts || 0;

  const allItems = ALERT_TYPES.map(t => ({
    ...t,
    val: alerts[t.key as keyof AlertSummary] as number,
  }));
  const activeItems = allItems.filter(t => t.val > 0);

  const W = 200, H = 200;
  const CX = W / 2, CY = H / 2;
  const OR = 72, IR = 46;

  let angle = 0;
  const segments = activeItems.map(item => {
    const pct = total > 0 ? item.val / total : 0;
    const sweep = pct * 360;
    const start = angle;
    angle += sweep;
    return { ...item, startAngle: start, endAngle: angle, pct };
  });

  if (total === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "80px", color: "rgba(255,255,255,0.18)",
        fontFamily: "'Inter', sans-serif", fontSize: "11px",
      }}>
        No alerts
      </div>
    );
  }

  return (
    <div>
      {/* Donut SVG */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%"
        style={{ display: "block", maxWidth: `${W}px`, margin: "0 auto" }}>
        {/* Track ring */}
        <circle cx={CX} cy={CY} r={(OR + IR) / 2} fill="none"
          stroke="rgba(255,255,255,0.04)" strokeWidth={OR - IR} />

        {/* Segments */}
        {segments.map(seg => (
          <path key={seg.key}
            d={donutSegment(CX, CY, OR, IR, seg.startAngle, seg.endAngle)}
            fill={seg.color} fillOpacity={0.9}
            stroke="rgba(10,15,10,0.9)" strokeWidth="1"
          />
        ))}

        {/* Inner fill */}
        <circle cx={CX} cy={CY} r={IR - 1} fill="#111811" />

        {/* Center: total */}
        <text x={CX} y={CY - 9} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "20px", fill: "#f0f7f0" }}>
          {fmt(total)}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "7px", fill: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
          TOTAL ALARMS
        </text>
      </svg>

      {/* Legend grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "5px",
        marginTop: "6px",
      }}>
        {activeItems.map(item => (
          <div key={item.key} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: `${item.color}0e`,
            border: `1px solid ${item.color}26`,
            borderRadius: "6px",
            padding: "4px 7px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "2px",
                background: item.color, flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "9px",
                color: "rgba(255,255,255,0.4)",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {item.short}
              </span>
            </div>
            <span style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              color: item.color,
              flexShrink: 0,
              marginLeft: "4px",
            }}>
              {fmt(item.val)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FULL: Overall summary page + modals ────────────────────────────────────
export default function DonutAlertChart({ alerts, title, compact = false, mini = false }: Props) {

  if (mini) {
    return (
      <div>
        {title && (
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600, fontSize: "9px",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: "8px",
          }}>
            {title}
          </div>
        )}
        <MiniDonut alerts={alerts} />
      </div>
    );
  }

  const total = alerts.totalAlerts || 0;
  const items = ALERT_TYPES.map(t => ({
    ...t,
    val: alerts[t.key as keyof AlertSummary] as number,
  })).filter(t => t.val > 0);

  const W = compact ? 420 : 580;
  const H = compact ? 280 : 360;
  const CX = compact ? 160 : 210;
  const CY = H / 2;
  const OR = compact ? 100 : 130;
  const IR = compact ? 62 : 82;
  const LABEL_R = OR + (compact ? 22 : 28);
  const TEXT_R  = OR + (compact ? 38 : 52);
  const fs = compact ? 9 : 11;
  const ps = compact ? 8 : 10;

  let angle = 0;
  type Seg = typeof items[0] & { startAngle: number; endAngle: number; midAngle: number; pct: number; };
  const segments: Seg[] = items.map(item => {
    const pct = total > 0 ? item.val / total : 0;
    const sweep = pct * 360;
    const start = angle;
    angle += sweep;
    return { ...item, startAngle: start, endAngle: angle, midAngle: start + sweep / 2, pct };
  });

  return (
    <div style={{ marginBottom: compact ? 0 : "28px" }}>
      {title && (
        <div style={{
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700,
          fontSize: compact ? "13px" : "15px", color: "#f0f7f0",
          marginBottom: "14px", letterSpacing: "-0.01em",
        }}>
          {title}
        </div>
      )}
      {total === 0 ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "120px", color: "rgba(255,255,255,0.2)",
          fontFamily: "'Inter', sans-serif", fontSize: "13px",
          background: "rgba(255,255,255,0.02)", borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          No alert data
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: `${W}px`, display: "block" }}>
            <defs>
              <radialGradient id="cg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(74,222,128,0.15)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r={OR + 20} fill="url(#cg)" />
            {segments.map(seg => (
              <path key={seg.key}
                d={donutSegment(CX, CY, OR, IR, seg.startAngle, seg.endAngle)}
                fill={seg.color} fillOpacity={0.88}
                stroke="rgba(10,15,10,0.6)" strokeWidth="0.5"
              />
            ))}
            <circle cx={CX} cy={CY} r={IR - 1} fill="#0a0f0a" />
            <text x={CX} y={CY - (compact ? 10 : 14)} textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
                fontSize: compact ? "22px" : "28px", fill: "#f0f7f0" }}>
              {fmt(total)}
            </text>
            <text x={CX} y={CY + (compact ? 10 : 14)} textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: compact ? "8px" : "10px",
                fill: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>
              Total Alarms
            </text>
            {segments.map(seg => {
              const isRight = seg.midAngle < 180;
              const p1 = polarToCartesian(CX, CY, OR + (compact ? 4 : 6), seg.midAngle);
              const p2 = polarToCartesian(CX, CY, LABEL_R + (compact ? 4 : 8), seg.midAngle);
              const tx = isRight ? CX + TEXT_R + (compact ? 50 : 70) : CX - TEXT_R - (compact ? 50 : 70);
              const p3 = { x: tx, y: p2.y };
              const pctStr = `(${(seg.pct * 100).toFixed(seg.pct < 0.01 ? 2 : seg.pct < 0.1 ? 2 : 1)}%)`;
              return (
                <g key={`lbl-${seg.key}`}>
                  <circle cx={p1.x} cy={p1.y} r={compact ? 2 : 2.5} fill={seg.color} />
                  <polyline
                    points={`${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`}
                    fill="none" stroke={seg.color} strokeWidth="0.8" strokeOpacity="0.7"
                  />
                  <text
                    x={isRight ? p3.x + (compact ? 4 : 5) : p3.x - (compact ? 4 : 5)}
                    y={p3.y} textAnchor={isRight ? "start" : "end"} dominantBaseline="middle"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: `${fs}px`,
                      fill: "rgba(240,247,240,0.75)", fontWeight: 500 }}>
                    {seg.label}{" "}
                    <tspan fill={seg.color} fontWeight="600" fontSize={`${ps}px`}>{pctStr}</tspan>
                  </text>
                </g>
              );
            })}
            {!compact && (() => {
              const ly = H - 28;
              const iw = W / Math.min(segments.length, 6);
              return (
                <g>
                  {segments.map((seg, i) => {
                    const lx = (i + 0.5) * iw;
                    return (
                      <g key={`leg-${seg.key}`}>
                        <rect x={lx - 16} y={ly - 5} width={10} height={10} rx={2} fill={seg.color} fillOpacity={0.85} />
                        <text x={lx - 3} y={ly + 1} dominantBaseline="middle"
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
