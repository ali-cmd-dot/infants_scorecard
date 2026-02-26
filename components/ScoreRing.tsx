import React from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  fontSize?: number;
  animate?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#2ECC71";
  if (score >= 60) return "#82E0AA";
  if (score >= 40) return "#F7DC6F";
  return "#E74C3C";
}

export default function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  fontSize = 26,
  animate = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animate ? circumference : offset}
        style={
          animate
            ? {
                transition: `stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)`,
                strokeDashoffset: offset,
              }
            : {}
        }
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${cx}px ${cy}px`,
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          fill: color,
          fontFamily: "Syne, sans-serif",
        }}
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + fontSize * 0.7}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${cx}px ${cy}px`,
          fontSize: `${fontSize * 0.35}px`,
          fill: "rgba(255,255,255,0.45)",
          fontFamily: "DM Sans, sans-serif",
          letterSpacing: "0.05em",
        }}
      >
        / 100
      </text>
    </svg>
  );
}
