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

export default function ScoreRing({ score, size = 100, strokeWidth = 7 }: Props) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const c = size / 2;
  const clr = color(score);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke={clr}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)", strokeDashoffset: offset }}
      />
      <text
        x={c} y={c}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${c}px ${c}px`,
          fontSize: `${size * 0.22}px`,
          fontWeight: 800,
          fill: clr,
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}
      >
        {score}
      </text>
      <text
        x={c} y={c + size * 0.17}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${c}px ${c}px`,
          fontSize: `${size * 0.09}px`,
          fill: "rgba(255,255,255,0.3)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        / 100
      </text>
    </svg>
  );
}
