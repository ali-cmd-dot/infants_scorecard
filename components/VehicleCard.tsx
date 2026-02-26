import React from "react";
import { VehicleData } from "@/lib/sheets";
import DonutAlertChart from "./DonutAlertChart";

interface Props {
  vehicle: VehicleData;
  index: number;
  onClick: () => void;
}

function scoreColor(s: number | null) {
  if (s === null) return "#94a3b8";
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#86efac";
  if (s >= 40) return "#fde047";
  return "#f87171";
}
function scoreLabel(s: number | null) {
  if (s === null) return "No Score";
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Poor";
}

export default function VehicleCard({ vehicle, index, onClick }: Props) {
  const { vehicleNumber, score, clientName, alerts } = vehicle;
  const clr = scoreColor(score);

  return (
    <div
      className="scorecard card-anim"
      style={{ animationDelay: `${index * 0.04}s`, padding: 0, height: "100%", display: "flex", flexDirection: "column", cursor: "pointer" }}
      onClick={onClick}
    >
      <div style={{ height: "3px", flexShrink: 0, background: `linear-gradient(90deg, transparent, ${clr}70, transparent)`, borderRadius: "20px 20px 0 0" }} />

      <div style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(74,222,128,0.5)", fontFamily: "'Inter',sans-serif", fontWeight: 600, marginBottom: "3px" }}>
              {clientName}
            </div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "15px", color: "#f0f7f0", letterSpacing: "0.02em" }}>
              {vehicleNumber}
            </div>
          </div>
          <div style={{ background: `${clr}18`, border: `1px solid ${clr}35`, borderRadius: "7px", padding: "3px 9px", fontSize: "10px", fontWeight: 700, color: clr, fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>
            {scoreLabel(score)}
          </div>
        </div>

        {/* Safety Score label + value */}
        <div style={{ marginBottom: "14px", paddingLeft: "2px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter',sans-serif", fontWeight: 600, marginBottom: "2px" }}>
            Safety Score
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
            <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "40px", color: clr, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {score !== null ? score : "—"}
            </span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
              / 100
            </span>
          </div>
        </div>

        <DonutAlertChart alerts={alerts} card={true} />
      </div>
    </div>
  );
}
