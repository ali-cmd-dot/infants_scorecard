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
  titleCenter?: boolean;
  compact?: boolean; // modal
  card?: boolean;    // inside card
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

interface DonutConfig {
  W: number; H: number;
  CX: number; CY: number;
  OR: number; IR: number;
  lineReach: number;  // how far leader line goes beyond OR
  labelOffset: number; // extra horizontal offset for label end
  fontSize: number;
  pctFontSize: number;
  dotR: number;
  centerFontSize: number;
  subFontSize: number;
  showLegend?: boolean;
}

function DonutCore({ alerts, cfg }: { alerts: AlertSummary; cfg: DonutConfig }) {
  const { W, H, CX, CY, OR, IR, lineReach, labelOffset, fontSize, pctFontSize,
          dotR, centerFontSize, subFontSize, showLegend } = cfg;

  const total = alerts.totalAlerts || 0;
  const items = ALERT_TYPES.map(t => ({
    ...t,
    val: alerts[t.key as keyof AlertSummary] as number,
  })).filter(t => t.val > 0);

  let angle = 0;
  type Seg = typeof items[0] & { startAngle: number; endAngle: number; midAngle: number; pct: number; };
  const segments: Seg[] = items.map(item => {
    const pct = total > 0 ? item.val / total : 0;
    const sweep = pct * 360;
    const start = angle;
    angle += sweep;
    return { ...item, startAngle: start, endAngle: angle, midAngle: start + sweep / 2, pct };
  });

  const legendY = H - 20;
  const iw = W / Math.min(segments.length, 6);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block", overflow: "visible" }}  // ← overflow:visible fixes label clipping
    >
      <defs>
        <radialGradient id={`cg_d_${CX}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(74,222,128,0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Glow */}
      <circle cx={CX} cy={CY} r={OR + 18} fill={`url(#cg_d_${CX})`} />

      {/* Track */}
      <circle cx={CX} cy={CY} r={(OR + IR) / 2} fill="none"
        stroke="rgba(255,255,255,0.04)" strokeWidth={OR - IR} />

      {/* Segments */}
      {segments.map(seg => (
        <path key={seg.key}
          d={donutSegment(CX, CY, OR, IR, seg.startAngle, seg.endAngle)}
          fill={seg.color} fillOpacity={0.88}
          stroke="rgba(10,15,10,0.7)" strokeWidth="0.6"
        />
      ))}

      {/* Inner fill */}
      <circle cx={CX} cy={CY} r={IR - 1} fill="#0a0f0a" />

      {/* Center text */}
      <text x={CX} y={CY - subFontSize * 1.2} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: `${centerFontSize}px`, fill: "#f0f7f0" }}>
        {fmt(total)}
      </text>
      <text x={CX} y={CY + subFontSize * 1.5} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: "'Inter', sans-serif", fontSize: `${subFontSize}px`,
          fill: "rgba(255,255,255,0.38)", letterSpacing: "0.1em" }}>
        TOTAL ALARMS
      </text>

      {/* Leader lines + labels */}
      {segments.map(seg => {
        const isRight = seg.midAngle < 180;
        const p1 = polarToCartesian(CX, CY, OR + 5, seg.midAngle);
        const p2 = polarToCartesian(CX, CY, OR + lineReach, seg.midAngle);
        // Horizontal endpoint — extends well beyond the donut
        const endX = isRight
          ? CX + OR + lineReach + labelOffset
          : CX - OR - lineReach - labelOffset;
        const p3 = { x: endX, y: p2.y };
        const pctStr = `(${(seg.pct * 100).toFixed(seg.pct < 0.01 ? 2 : seg.pct < 0.1 ? 2 : 1)}%)`;
        const displayLabel = seg.short;

        return (
          <g key={`lbl-${seg.key}`}>
            <circle cx={p1.x} cy={p1.y} r={dotR} fill={seg.color} />
            <polyline
              points={`${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`}
              fill="none" stroke={seg.color} strokeWidth="0.85" strokeOpacity="0.65"
            />
            <text
              x={isRight ? p3.x + 4 : p3.x - 4}
              y={p3.y}
              textAnchor={isRight ? "start" : "end"}
              dominantBaseline="middle"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: `${fontSize}px`,
                fill: "rgba(240,247,240,0.8)", fontWeight: 500 }}>
              {displayLabel}{" "}
              <tspan fill={seg.color} fontWeight="700" fontSize={`${pctFontSize}px`}>{pctStr}</tspan>
            </text>
          </g>
        );
      })}

      {/* Legend row (full mode only) */}
      {showLegend && (
        <g>
          {segments.map((seg, i) => {
            const lx = (i + 0.5) * iw;
            return (
              <g key={`leg-${seg.key}`}>
                <rect x={lx - 18} y={legendY - 5} width={10} height={10} rx={2}
                  fill={seg.color} fillOpacity={0.85} />
                <text x={lx - 5} y={legendY + 1} dominantBaseline="middle"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", fill: "rgba(255,255,255,0.35)" }}>
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
      fontFamily: "'Bricolage Grotesque', sans-serif",
      fontWeight: 700,
      fontSize: card ? "11px" : compact ? "13px" : "15px",
      color: "#f0f7f0",
      marginBottom: card ? "6px" : "14px",
      letterSpacing: "-0.01em",
      textAlign: titleCenter ? "center" : "left",
    }}>
      {title}
    </div>
  );

  const emptyEl = (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: card ? "100px" : "120px",
      color: "rgba(255,255,255,0.2)", fontFamily: "'Inter', sans-serif", fontSize: "12px",
      background: "rgba(255,255,255,0.02)", borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.05)",
    }}>
      No alert data
    </div>
  );

  // CARD mode — fits inside a card, overflow:visible handles labels
  if (card) {
    return (
      <div style={{ padding: "0 40px" }}> {/* horizontal padding gives space for overflow labels */}
        {titleEl}
        {total === 0 ? emptyEl : (
          <DonutCore alerts={alerts} cfg={{
            W: 300, H: 260,
            CX: 150, CY: 122,
            OR: 82, IR: 52,
            lineReach: 28, labelOffset: 90,
            fontSize: 9.5, pctFontSize: 8.5,
            dotR: 2.2,
            centerFontSize: 22, subFontSize: 7,
          }} />
        )}
      </div>
    );
  }

  // COMPACT mode — modals
  if (compact) {
    return (
      <div style={{ padding: "0 50px" }}>
        {titleEl}
        {total === 0 ? emptyEl : (
          <DonutCore alerts={alerts} cfg={{
            W: 340, H: 280,
            CX: 170, CY: 134,
            OR: 100, IR: 64,
            lineReach: 32, labelOffset: 100,
            fontSize: 10.5, pctFontSize: 9.5,
            dotR: 2.5,
            centerFontSize: 27, subFontSize: 8.5,
          }} />
        )}
      </div>
    );
  }

  // FULL mode — overall summary
  return (
    <div style={{ marginBottom: "28px", padding: "0 60px" }}>
      {titleEl}
      {total === 0 ? emptyEl : (
        <DonutCore alerts={alerts} cfg={{
          W: 480, H: 380,
          CX: 240, CY: 175,
          OR: 135, IR: 87,
          lineReach: 40, labelOffset: 130,
          fontSize: 12, pctFontSize: 11,
          dotR: 3,
          centerFontSize: 32, subFontSize: 10,
          showLegend: true,
        }} />
      )}
    </div>
  );
}
