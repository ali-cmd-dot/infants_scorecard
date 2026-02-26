import React, { useEffect } from "react";
import { ClientData, VehicleScore } from "@/lib/sheets";
import ScoreRing from "./ScoreRing";

interface VehicleModalProps {
  client: ClientData | null;
  onClose: () => void;
}

function getScoreColor(score: number | null): string {
  if (score === null) return "rgba(255,255,255,0.3)";
  if (score >= 80) return "#2ECC71";
  if (score >= 60) return "#82E0AA";
  if (score >= 40) return "#F7DC6F";
  return "#E74C3C";
}

function VehicleRow({ vehicle, index }: { vehicle: VehicleScore; index: number }) {
  const color = getScoreColor(vehicle.score);
  const score = vehicle.score;

  return (
    <div
      className="fade-in-up"
      style={{
        animationDelay: `${index * 0.03}s`,
        animationFillMode: "both",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        marginBottom: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 8px ${color}`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 500,
            color: "#e8f5ea",
            fontSize: "14px",
            letterSpacing: "0.02em",
          }}
        >
          {vehicle.vehicleNumber}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {score !== null ? (
          <>
            <div
              style={{
                width: "80px",
                height: "4px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${score}%`,
                  background: color,
                  borderRadius: "2px",
                  transition: "width 1s ease-out",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                color: color,
                fontSize: "15px",
                minWidth: "36px",
                textAlign: "right",
              }}
            >
              {score}
            </span>
          </>
        ) : (
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              color: "rgba(255,255,255,0.25)",
              fontSize: "13px",
              fontStyle: "italic",
            }}
          >
            No data
          </span>
        )}
      </div>
    </div>
  );
}

export default function VehicleModal({ client, onClose }: VehicleModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!client) return null;

  const scoredVehicles = client.vehicles.filter((v) => v.score !== null);
  const unscoredVehicles = client.vehicles.filter((v) => v.score === null);
  const sortedScored = [...scoredVehicles].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0d1a0f 0%, #071009 100%)",
          border: "1px solid rgba(46,204,113,0.2)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(46,204,113,0.1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <ScoreRing score={client.averageScore} size={72} strokeWidth={5} fontSize={16} />
            <div>
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(46,204,113,0.6)",
                  fontFamily: "DM Sans, sans-serif",
                  marginBottom: "4px",
                }}
              >
                Sub-Client · Infants
              </div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: "22px",
                  color: "#e8f5ea",
                  margin: "0 0 4px 0",
                }}
              >
                {client.name}
              </h2>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {client.totalVehicles} vehicle{client.totalVehicles !== 1 ? "s" : ""} &nbsp;·&nbsp; {scoredVehicles.length} scored
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Vehicle list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0 16px 10px",
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            <span>Vehicle Number</span>
            <span>Score / 100</span>
          </div>

          {sortedScored.map((v, i) => (
            <VehicleRow key={v.vehicleNumber} vehicle={v} index={i} />
          ))}

          {unscoredVehicles.length > 0 && (
            <>
              {sortedScored.length > 0 && (
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    margin: "16px 0 12px",
                    paddingTop: "12px",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  No Score Data
                </div>
              )}
              {unscoredVehicles.map((v, i) => (
                <VehicleRow key={v.vehicleNumber} vehicle={v} index={sortedScored.length + i} />
              ))}
            </>
          )}

          {client.vehicles.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              No vehicles found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
