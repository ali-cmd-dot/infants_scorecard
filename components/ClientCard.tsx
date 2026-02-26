import React from "react";
import ScoreRing from "./ScoreRing";
import { ClientData } from "@/lib/sheets";
import DonutAlertChart from "./DonutAlertChart";

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
  const { name, averageScore, totalVehicles, alerts } = client;
  const clr = scoreColor(averageScore);

  return (
    <div
      className="scorecard card-anim"
      style={{
        animationDelay: `${index * 0.07}s`,
        padding: "0",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div style={{
        height: "3px",
        flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${clr}70, transparent)`,
        borderRadius: "20px 20px 0 0",
      }} />

      <div style={{
        padding: "22px 22px 18px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}>

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: "10px" }}>
            <div style={{
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(74,222,128,0.55)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              marginBottom: "4px",
            }}>
              Sub-Client
            </div>
            <h3 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              color: "#f0f7f0",
              lineHeight: 1.25,
              wordBreak: "break-word",
              margin: 0,
            }}>
              {name}
            </h3>
          </div>
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
            whiteSpace: "nowrap",
          }}>
            {scoreLabel(averageScore)}
          </div>
        </div>

        {/* Score Ring */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <ScoreRing score={averageScore} size={110} strokeWidth={8} />
        </div>

        {/* Vehicles count */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "10px",
          padding: "9px 16px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.35)",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
          }}>
            Vehicles
          </span>
          <span style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#f0f7f0",
            fontFamily: "'Bricolage Grotesque', sans-serif",
            lineHeight: 1,
          }}>
            {totalVehicles}
          </span>
        </div>

        {/* Mini donut */}
        <div style={{ marginBottom: "14px" }}>
          <DonutAlertChart alerts={alerts} mini={true} />
        </div>

        <div style={{ flex: 1 }} />

        {/* View button */}
        <button
          className="btn-green"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          View Vehicles
        </button>
      </div>
    </div>
  );
}
