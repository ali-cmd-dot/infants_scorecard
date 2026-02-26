import React from "react";
import ScoreRing from "./ScoreRing";
import { ClientData } from "@/lib/sheets";

interface ClientCardProps {
  client: ClientData;
  index: number;
  onClick: () => void;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Attention";
}

function getScoreBadgeStyle(score: number): React.CSSProperties {
  if (score >= 80)
    return { background: "rgba(46,204,113,0.15)", color: "#2ECC71", border: "1px solid rgba(46,204,113,0.3)" };
  if (score >= 60)
    return { background: "rgba(130,224,170,0.1)", color: "#82E0AA", border: "1px solid rgba(130,224,170,0.3)" };
  if (score >= 40)
    return { background: "rgba(247,220,111,0.1)", color: "#F7DC6F", border: "1px solid rgba(247,220,111,0.3)" };
  return { background: "rgba(231,76,60,0.1)", color: "#E74C3C", border: "1px solid rgba(231,76,60,0.3)" };
}

export default function ClientCard({ client, index, onClick }: ClientCardProps) {
  const { name, averageScore, totalVehicles, vehicles } = client;
  const scoredCount = vehicles.filter((v) => v.score !== null).length;
  const isOther = name === "Other";

  return (
    <div
      className="client-card rounded-2xl p-6 fade-in-up"
      style={{ animationDelay: `${index * 0.08}s`, animationFillMode: "both" }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                fontWeight: 600,
                textTransform: "uppercase",
                color: "rgba(46,204,113,0.6)",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              {isOther ? "Unmatched" : "Sub-Client"}
            </span>
          </div>
          <h3
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#e8f5ea",
              lineHeight: 1.2,
              margin: 0,
              wordBreak: "break-word",
            }}
          >
            {name}
          </h3>
        </div>
        <span
          style={{
            ...getScoreBadgeStyle(averageScore),
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "DM Sans, sans-serif",
            letterSpacing: "0.06em",
            flexShrink: 0,
            marginLeft: "12px",
          }}
        >
          {getScoreLabel(averageScore)}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
        <ScoreRing score={averageScore} size={110} strokeWidth={8} fontSize={24} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "16px",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: "10px",
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "4px",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            Vehicles
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#e8f5ea",
              fontFamily: "Syne, sans-serif",
            }}
          >
            {totalVehicles}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: "10px",
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "4px",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            Scored
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#e8f5ea",
              fontFamily: "Syne, sans-serif",
            }}
          >
            {scoredCount}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "rgba(46,204,113,0.5)",
          fontSize: "12px",
          fontFamily: "DM Sans, sans-serif",
          letterSpacing: "0.04em",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        View all vehicles
      </div>
    </div>
  );
}
