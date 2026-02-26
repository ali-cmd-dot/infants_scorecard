import React from "react";
import { AlertSummary } from "@/lib/sheets";

const ALERT_TYPES = [
  { key: "distractedDriving", label: "Distracted Driving", short: "Distracted",  color: "#f87171" },
  { key: "seatBeltAbsent",    label: "Seat Belt Absent",   short: "Seat Belt",   color: "#fb923c" },
  { key: "smoking",           label: "Smoking",            short: "Smoking",     color: "#94a3b8" },
  { key: "fatigueDriving",    label: "Fatigue Driving",    short: "Fatigue",     color: "#60a5fa" },
  { key: "phoneCall",         label: "Phone Call",         short: "Phone",       color: "#f472b6" },
  { key: "overSpeed",         label: "Over Speed",         short: "Overspeed",   color: "#fde047" },
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

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegment(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string {
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

function buildSegments(alerts: AlertSummary) {
  const total = alerts.totalAlerts || 0;
  const items = ALERT_TYPES.map(t => ({
    ...t,
    val: alerts[t.key as keyof AlertSummary] as number,
  })).filter(t => t.val > 0);

  let angle = 0;
  return items.map(item => {
    const pct = total > 0 ? item.val / total : 0;
    const sweep = pct * 360;
    const start = angle;
    angle += sweep;
    return { ...item, startAngle: start, endAngle: angle, midAngle: start + sweep / 2, pct };
  });
}

// ── CARD MODE: donut on left, legend list on right — NO overflow issues ─────
function CardDonut({ alerts }: { alerts: AlertSummary }) {
  const total = alerts.totalAlerts || 0;
  const segments = buildSegments(alerts);

  const W = 200, H = 200;
  const CX = W / 2, CY = H / 2;
  const OR = 80, IR = 50;

  if (total === 0) {
    return (
      <div style={{ padding: "12px 0", color: "rgba(255,255,255,0.2)", fontFamily: "'Inter',sans-serif", fontSize: "11px", textAlign: "center" }}>
        No alert data
      </div>
    );
  }

  const activeItems = ALERT_TYPES.map(t => ({
    ...t, val: alerts[t.key as keyof AlertSummary] as number,
  })).filter(t => t.val > 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {/* Donut — fixed size, no overflow needed */}
      <div style={{ flexShrink: 0, width: `${W}px` }}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
          <defs>
            <radialGradient id="cg_card" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(74,222,128,0.1)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx={CX} cy={CY} r={OR + 16} fill="url(#cg_card)" />
          <circle cx={CX} cy={CY} r={(OR + IR) / 2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={OR - IR} />
          {segments.map(seg => (
            <path key={seg.key}
              d={donutSegment(CX, CY, OR, IR, seg.startAngle, seg.endAngle)}
              fill={seg.color} fillOpacity={0.9}
              stroke="rgba(10,15,10,0.9)" strokeWidth="1"
            />
          ))}
          <circle cx={CX} cy={CY} r={IR - 1} fill="#111811" />
          <text x={CX} y={CY - 9} textAnchor="middle" dominantBaseline="middle"
            style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "20px", fill: "#f0f7f0" }}>
            {fmt(total)}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" dominantBaseline="middle"
            style={{ fontFamily: "'Inter',sans-serif", fontSize: "7px", fill: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
            TOTAL ALARMS
          </text>
        </svg>
      </div>

      {/* Legend list — full labels, never truncated */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", minWidth: 0 }}>
        {activeItems.map(item => {
          const pct = total > 0 ? ((item.val / total) * 100) : 0;
          return (
            <div key={item.key} style={{
              display: "flex", alignItems: "center",
              background: `${item.color}0e`,
              border: `1px solid ${item.color}28`,
              borderRadius: "6px",
              padding: "4px 8px",
              gap: "6px",
            }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "2px", background: item.color, flexShrink: 0 }} />
              <span style={{
                fontFamily: "'Inter',sans-serif", fontSize: "9.5px",
                color: "rgba(255,255,255,0.5)", fontWeight: 500, flex: 1,
                whiteSpace: "nowrap",
              }}>
                {item.short}
              </span>
              <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "11px", color: item.color, flexShrink: 0 }}>
                {fmt(item.val)}
              </span>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "8.5px", color: "rgba(255,255,255,0.28)", flexShrink: 0 }}>
                {pct.toFixed(pct < 1 ? 1 : 0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FULL/COMPACT MODE: leader lines, positioned so labels always fit ─────────
function FullDonut({ alerts, compact }: { alerts: AlertSummary; compact?: boolean }) {
  const total = alerts.totalAlerts || 0;
  const segments = buildSegments(alerts);

  // Generous viewbox so labels on both sides fit
  const W = compact ? 560 : 700;
  const H = compact ? 320 : 420;
  const OR = compact ? 100 : 130;
  const IR = compact ? 64 : 84;
  // Donut centered
  const CX = W / 2;
  const CY = compact ? 152 : 190;

  const lineReach = compact ? 30 : 38;
  const horizLen  = compact ? 80 : 110;  // horizontal part of leader line
  const fontSize  = compact ? 10.5 : 12;
  const pctSize   = compact ? 9.5 : 11;
  const dotR      = compact ? 2.5 : 3;
  const cfs       = compact ? 28 : 34;
  const sfs       = compact ? 9 : 11;

  const legendY = H - 24;
  const iw = W / Math.min(segments.length, 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", maxWidth: `${W}px`, margin: "0 auto" }}>
      <defs>
        <radialGradient id={`cg_full_${compact ? "c" : "f"}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(74,222,128,0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={OR + 20} fill={`url(#cg_full_${compact ? "c" : "f"})`} />
      <circle cx={CX} cy={CY} r={(OR + IR) / 2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={OR - IR} />

      {segments.map(seg => (
        <path key={seg.key}
          d={donutSegment(CX, CY, OR, IR, seg.startAngle, seg.endAngle)}
          fill={seg.color} fillOpacity={0.88}
          stroke="rgba(10,15,10,0.7)" strokeWidth="0.7"
        />
      ))}

      <circle cx={CX} cy={CY} r={IR - 1} fill="#0a0f0a" />

      <text x={CX} y={CY - sfs * 1.2} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: `${cfs}px`, fill: "#f0f7f0" }}>
        {fmt(total)}
      </text>
      <text x={CX} y={CY + sfs * 1.6} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: `${sfs}px`, fill: "rgba(255,255,255,0.38)", letterSpacing: "0.1em" }}>
        TOTAL ALARMS
      </text>

      {segments.map(seg => {
        const isRight = seg.midAngle < 180;
        const p1 = polarToCartesian(CX, CY, OR + 5, seg.midAngle);
        const p2 = polarToCartesian(CX, CY, OR + lineReach, seg.midAngle);
        // Horizontal endpoint — clamped strictly within viewbox
        const rawEndX = isRight ? p2.x + horizLen : p2.x - horizLen;
        const endX = Math.max(6, Math.min(W - 6, rawEndX));
        const p3 = { x: endX, y: p2.y };
        const pctStr = `(${(seg.pct * 100).toFixed(seg.pct < 0.01 ? 2 : seg.pct < 0.1 ? 1 : 0)}%)`;

        return (
          <g key={`lbl-${seg.key}`}>
            <circle cx={p1.x} cy={p1.y} r={dotR} fill={seg.color} />
            <polyline
              points={`${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${endX.toFixed(1)},${p3.y.toFixed(1)}`}
              fill="none" stroke={seg.color} strokeWidth="0.85" strokeOpacity="0.65"
            />
            <text
              x={isRight ? endX + 4 : endX - 4}
              y={p3.y}
              textAnchor={isRight ? "start" : "end"}
              dominantBaseline="middle"
              style={{ fontFamily: "'Inter',sans-serif", fontSize: `${fontSize}px`, fill: "rgba(240,247,240,0.82)", fontWeight: 500 }}>
              {seg.short}{" "}
              <tspan fill={seg.color} fontWeight="700" fontSize={`${pctSize}px`}>{pctStr}</tspan>
            </text>
          </g>
        );
      })}

      {/* Legend bottom */}
      {!compact && (
        <g>
          {segments.map((seg, i) => {
            const lx = (i + 0.5) * iw;
            return (
              <g key={`leg-${seg.key}`}>
                <rect x={lx - 18} y={legendY - 5} width={10} height={10} rx={2} fill={seg.color} fillOpacity={0.85} />
                <text x={lx - 5} y={legendY + 1} dominantBaseline="middle"
                  style={{ fontFamily: "'Inter',sans-serif", fontSize: "9px", fill: "rgba(255,255,255,0.38)" }}>
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

export default function DonutAlertChart({ alerts, title, titleCenter = false, compact = false, card = false }: Props) {
  const total = alerts.totalAlerts || 0;

  const titleEl = title && (
    <div style={{
      fontFamily: "'Bricolage Grotesque',sans-serif",
      fontWeight: 700,
      fontSize: card ? "11px" : compact ? "13px" : "15px",
      color: "#f0f7f0",
      marginBottom: card ? "10px" : "16px",
      letterSpacing: "-0.01em",
      textAlign: titleCenter ? "center" : "left",
    }}>
      {title}
    </div>
  );

  const emptyEl = (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: card ? "80px" : "120px",
      color: "rgba(255,255,255,0.2)", fontFamily: "'Inter',sans-serif", fontSize: "12px",
      background: "rgba(255,255,255,0.02)", borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.05)",
    }}>
      No alert data
    </div>
  );

  if (card) return <div>{titleEl}{total === 0 ? emptyEl : <CardDonut alerts={alerts} />}</div>;

  return (
    <div style={{ marginBottom: compact ? 0 : "16px" }}>
      {titleEl}
      {total === 0 ? emptyEl : <FullDonut alerts={alerts} compact={compact} />}
    </div>
  );
}
