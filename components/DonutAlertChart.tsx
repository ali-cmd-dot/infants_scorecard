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
  compact?: boolean;  // modal with leader lines
  card?: boolean;     // inside cards — same style as full, scaled to fit
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

// ── Shared SVG donut renderer ──────────────────────────────────────────────
interface DonutSVGProps {
  alerts: AlertSummary;
  W: number; H: number;
  CX: number; CY: number;
  OR: number; IR: number;
  // label line reach beyond OR
  lineReach: number;
  // max X distance from CX for label end
  labelReach: number;
  fontSize: number;
  pctFontSize: number;
  dotR: number;
  centerFontSize: number;
  subFontSize: number;
  showLegend?: boolean;
}

function DonutSVG({
  alerts, W, H, CX, CY, OR, IR,
  lineReach, labelReach,
  fontSize, pctFontSize, dotR,
  centerFontSize, subFontSize,
  showLegend,
}: DonutSVGProps) {
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
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id={`cg_${CX}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(74,222,128,0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Glow */}
      <circle cx={CX} cy={CY} r={OR + 18} fill={`url(#cg_${CX})`} />

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

      {/* Inner dark */}
      <circle cx={CX} cy={CY} r={IR - 1} fill="#0a0f0a" />

      {/* Center total */}
      <text x={CX} y={CY - subFontSize * 1.1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: `${centerFontSize}px`, fill: "#f0f7f0" }}>
        {fmt(total)}
      </text>
      <text x={CX} y={CY + subFontSize * 1.4} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: "'Inter', sans-serif", fontSize: `${subFontSize}px`,
          fill: "rgba(255,255,255,0.38)", letterSpacing: "0.1em" }}>
        TOTAL ALARMS
      </text>

      {/* Leader lines + labels */}
      {segments.map(seg => {
        const isRight = seg.midAngle < 180;
        const p1 = polarToCartesian(CX, CY, OR + 5, seg.midAngle);
        const p2 = polarToCartesian(CX, CY, OR + lineReach, seg.midAngle);
        const endX = isRight
          ? Math.min(CX + labelReach, W - 4)
          : Math.max(CX - labelReach, 4);
        const p3 = { x: endX, y: p2.y };
        const pctStr = `(${(seg.pct * 100).toFixed(seg.pct < 0.01 ? 2 : seg.pct < 0.1 ? 2 : 1)}%)`;

        return (
          <g key={`lbl-${seg.key}`}>
            <circle cx={p1.x} cy={p1.y} r={dotR} fill={seg.color} />
            <polyline
              points={`${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`}
              fill="none" stroke={seg.color} strokeWidth="0.8" strokeOpacity="0.65"
            />
            <text
              x={isRight ? p3.x + 3 : p3.x - 3}
              y={p3.y}
              textAnchor={isRight ? "start" : "end"}
              dominantBaseline="middle"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: `${fontSize}px`,
                fill: "rgba(240,247,240,0.75)", fontWeight: 500 }}>
              {seg.short}{" "}
              <tspan fill={seg.color} fontWeight="600" fontSize={`${pctFontSize}px`}>{pctStr}</tspan>
            </text>
          </g>
        );
      })}

      {/* Legend row */}
      {showLegend && (
        <g>
          {segments.map((seg, i) => {
            const lx = (i + 0.5) * iw;
            return (
              <g key={`leg-${seg.key}`}>
                <rect x={lx - 16} y={legendY - 5} width={9} height={9} rx={2}
                  fill={seg.color} fillOpacity={0.85} />
                <text x={lx - 4} y={legendY + 1} dominantBaseline="middle"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "8px", fill: "rgba(255,255,255,0.35)" }}>
                  {seg.short.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function DonutAlertChart({
  alerts, title, titleCenter = false,
  compact = false, card = false,
}: Props) {
  const total = alerts.totalAlerts || 0;

  const emptyState = (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: card ? "100px" : "120px",
      color: "rgba(255,255,255,0.2)",
      fontFamily: "'Inter', sans-serif", fontSize: "12px",
      background: "rgba(255,255,255,0.02)", borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.05)",
    }}>
      No alert data
    </div>
  );

  const titleEl = title && (
    <div style={{
      fontFamily: "'Bricolage Grotesque', sans-serif",
      fontWeight: 700,
      fontSize: card ? "11px" : compact ? "13px" : "15px",
      color: "#f0f7f0",
      marginBottom: card ? "8px" : "14px",
      letterSpacing: "-0.01em",
      textAlign: titleCenter ? "center" : "left",
    }}>
      {title}
    </div>
  );

  // ── CARD mode: same donut style as full, fits inside a card ────────────
  if (card) {
    return (
      <div>
        {titleEl}
        {total === 0 ? emptyState : (
          <DonutSVG
            alerts={alerts}
            W={380} H={260}
            CX={190} CY={122}
            OR={82} IR={52}
            lineReach={28} labelReach={145}
            fontSize={9.5} pctFontSize={8.5}
            dotR={2.2}
            centerFontSize={22} subFontSize={7}
          />
        )}
      </div>
    );
  }

  // ── COMPACT mode: modal ─────────────────────────────────────────────────
  if (compact) {
    return (
      <div>
        {titleEl}
        {total === 0 ? emptyState : (
          <DonutSVG
            alerts={alerts}
            W={420} H={280}
            CX={175} CY={138}
            OR={100} IR={63}
            lineReach={32} labelReach={200}
            fontSize={10} pctFontSize={9}
            dotR={2.5}
            centerFontSize={26} subFontSize={8}
          />
        )}
      </div>
    );
  }

  // ── FULL mode: overall summary ──────────────────────────────────────────
  return (
    <div style={{ marginBottom: "28px" }}>
      {titleEl}
      {total === 0 ? emptyState : (
        <div style={{ overflowX: "auto" }}>
          <DonutSVG
            alerts={alerts}
            W={600} H={380}
            CX={210} CY={185}
            OR={135} IR={86}
            lineReach={38} labelReach={350}
            fontSize={11.5} pctFontSize={10.5}
            dotR={3}
            centerFontSize={30} subFontSize={10}
            showLegend={true}
          />
        </div>
      )}
    </div>
  );
}
