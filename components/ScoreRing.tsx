import React from "react";

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function color(s: number) {
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#86efac";
  if (s >= 40) return "#fde047";
  return "#f87171";
}

export default function ScoreRing({ score, size = 110, strokeWidth = 8 }: Props) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const c = size / 2;
  const clr = color(score);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      {/* Track */}
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke={clr}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        style={{
          transition: "stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)",
          strokeDashoffset: offset,
        }}
      />
      {/* Score number — big and bold */}
      <text
        x={c}
        y={c - 8}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${c}px ${c}px`,
          fontSize: `${Math.round(size * 0.27)}px`,
          fontWeight: 800,
          fill: clr,
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}
      >
        {score}
      </text>
      {/* /100 label — clearly visible */}
      <text
        x={c}
        y={c + size * 0.22}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${c}px ${c}px`,
          fontSize: `${Math.round(size * 0.11)}px`,
          fontWeight: 500,
          fill: "rgba(240,247,240,0.55)",
          fontFamily: "'Inter', sans-serif",
          letterSpacing: "0.03em",
        }}
      >
        / 100
      </text>
    </svg>
  );
}
