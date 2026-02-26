import React from "react";
import { VehicleData } from "@/lib/sheets";
import ScoreRing from "./ScoreRing";

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
  const safeScore = score ?? 0;

  const alertItems = [
    { label: "Distracted", val: alerts.distractedDriving, color: "#f87171" },
    { label: "Seat Belt",  val: alerts.seatBeltAbsent,    color: "#fb923c" },
    { label: "Smoking",    val: alerts.smoking,            color: "#94a3b8" },
    { label: "Fatigue",    val: alerts.fatigueDriving,     color: "#60a5fa" },
    { label: "Phone",      val: alerts.phoneCall,          color: "#f472b6" },
    { label: "Speed",      val: alerts.overSpeed,          color: "#fde047" },
  ].filter(a => a.val > 0);

  return (
    <div
      className="scorecard card-anim"
      style={{
        animationDelay: `${index * 0.04}s`,
        padding: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      {/* Accent line */}
      <div style={{
        height: "3px",
        flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${clr}70, transparent)`,
        borderRadius: "20px 20px 0 0",
      }} />

      <div style={{ padding: "18px 18px 16px", display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <div>
            <div style={{
              fontSize: "9px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(74,222,128,0.5)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              marginBottom: "3px",
            }}>
              {clientName}
            </div>
            <div style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              color: "#f0f7f0",
              letterSpacing: "0.02em",
            }}>
              {vehicleNumber}
            </div>
          </div>
          <div style={{
            background: `${clr}18`,
            border: `1px solid ${clr}35`,
            borderRadius: "7px",
            padding: "3px 9px",
            fontSize: "10px",
            fontWeight: 700,
            color: clr,
            fontFamily: "'Inter', sans-serif",
            flexShrink: 0,
          }}>
            {scoreLabel(score)}
          </div>
        </div>

        {/* Score ring — smaller for vehicle cards */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
          <ScoreRing score={safeScore} size={90} strokeWidth={7} />
        </div>

        {/* Total alerts pill */}
        {alerts.totalAlerts > 0 && (
          <div style={{
            background: "rgba(167,139,250,0.1)",
            border: "1px solid rgba(167,139,250,0.25)",
            borderRadius: "8px",
            padding: "7px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Total Alerts
            </span>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "#a78bfa", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {alerts.totalAlerts}
            </span>
          </div>
        )}

        {/* Alert breakdown mini chips */}
        {alertItems.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
            {alertItems.map(a => (
              <div key={a.label} style={{
                background: `${a.color}12`,
                border: `1px solid ${a.color}30`,
                borderRadius: "6px",
                padding: "3px 8px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}>
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {a.label}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: a.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {a.val}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* View details button */}
        <button className="btn-green" style={{ width: "100%", justifyContent: "center", fontSize: "12px", padding: "7px 14px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          View Details
        </button>
      </div>
    </div>
  );
}
