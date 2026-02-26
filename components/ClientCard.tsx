import React from "react";
import ScoreRing from "./ScoreRing";
import { ClientData } from "@/lib/sheets";

interface Props {
  client: ClientData;
  index: number;
  onClick: () => void;
}

function scoreColor(s: number) {
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#86efac";
  if (s >= 40) return "#fde047";
  return "#f87171";
}

function scoreLabel(s: number) {
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Poor";
}

export default function ClientCard({ client, index, onClick }: Props) {
  const { name, averageScore, totalVehicles, vehicles } = client;
  const scored = vehicles.filter(v => v.score !== null).length;
  const clr = scoreColor(averageScore);

  return (
    <div
      className="scorecard card-anim"
      style={{ animationDelay: `${index * 0.07}s`, padding: "0" }}
      onClick={onClick}
    >
      {/* Top gradient bar */}
      <div style={{
        height: "3px",
        background: `linear-gradient(90deg, transparent, ${clr}60, transparent)`,
        borderRadius: "20px 20px 0 0",
      }} />

      <div style={{ padding: "24px 24px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(74,222,128,0.55)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              marginBottom: "5px",
            }}>
              {name === "Other" ? "Unmatched" : "Sub-Client"}
            </div>
            <h3 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: "17px",
              color: "#f0f7f0",
              lineHeight: 1.25,
              wordBreak: "break-word",
              maxWidth: "160px",
            }}>
              {name}
            </h3>
          </div>
          {/* Score badge */}
          <div style={{
            background: `${clr}18`,
            border: `1px solid ${clr}40`,
            borderRadius: "8px",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: 700,
            color: clr,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}>
            {scoreLabel(averageScore)}
          </div>
        </div>

        {/* Score Ring centered */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <ScoreRing score={averageScore} size={108} strokeWidth={8} />
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: "Vehicles", val: totalVehicles },
            { label: "Scored", val: scored },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "10px",
              padding: "10px 14px",
            }}>
              <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif", marginBottom: "4px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#f0f7f0", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {stat.val}
              </div>
            </div>
          ))}
        </div>

        {/* "View Details" button — like the Get In Touch button on cautio.com */}
        <button className="btn-green" style={{ width: "100%", justifyContent: "center" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          View Vehicles
        </button>
      </div>
    </div>
  );
}
