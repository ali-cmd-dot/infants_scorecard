import React from "react";
import { ClientData } from "@/lib/sheets";
import DonutAlertChart from "./DonutAlertChart";

interface Props { client: ClientData; index: number; onClick: () => void; }

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
  const { name, averageScore, totalVehicles, alerts } = client;
  const clr = scoreColor(averageScore);

  return (
    <div
      className="scorecard card-anim"
      style={{ animationDelay: `${index * 0.07}s`, padding: "0", height: "100%", display: "flex", flexDirection: "column", cursor: "pointer" }}
      onClick={onClick}
    >
      <div style={{ height: "3px", flexShrink: 0, background: `linear-gradient(90deg, transparent, ${clr}70, transparent)`, borderRadius: "20px 20px 0 0" }} />

      <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: "10px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(74,222,128,0.55)", fontFamily: "'Inter',sans-serif", fontWeight: 600, marginBottom: "4px" }}>
              Sub-Client
            </div>
            <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: "16px", color: "#f0f7f0", lineHeight: 1.25, wordBreak: "break-word", margin: 0 }}>
              {name}
            </h3>
          </div>
          <div style={{ background: `${clr}18`, border: `1px solid ${clr}40`, borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, color: clr, fontFamily: "'Inter',sans-serif", flexShrink: 0, whiteSpace: "nowrap" }}>
            {scoreLabel(averageScore)}
          </div>
        </div>

        {/* Score + vehicles */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter',sans-serif", fontWeight: 600, marginBottom: "2px" }}>
              Safety Score
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
              <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "42px", color: clr, lineHeight: 1, letterSpacing: "-0.02em" }}>
                {averageScore}
              </span>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.3)", fontWeight: 500, marginBottom: "4px" }}>
                / 100
              </span>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "5px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter',sans-serif", marginBottom: "2px" }}>Vehicles</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#f0f7f0", fontFamily: "'Bricolage Grotesque',sans-serif", lineHeight: 1 }}>{totalVehicles}</div>
          </div>
        </div>

        <DonutAlertChart alerts={alerts} card={true} />
      </div>
    </div>
  );
}
