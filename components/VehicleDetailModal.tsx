import React, { useEffect } from "react";
import { VehicleData } from "@/lib/sheets";
import ScoreRing from "./ScoreRing";
import DonutAlertChart from "./DonutAlertChart";

interface Props {
  vehicle: VehicleData | null;
  onClose: () => void;
}

export default function VehicleDetailModal({ vehicle, onClose }: Props) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  if (!vehicle) return null;

  const { vehicleNumber, score, clientName, alerts } = vehicle;
  const safeScore = score ?? 0;

  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        {/* Header */}
        <div style={{
          padding: "22px 24px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ScoreRing score={safeScore} size={68} strokeWidth={5} />
            <div>
              <div style={{
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(74,222,128,0.55)",
                fontFamily: "'Inter', sans-serif",
                marginBottom: "3px",
              }}>
                {clientName} · Infants
              </div>
              <h2 style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: "20px",
                color: "#f0f7f0",
                margin: "0 0 2px 0",
                letterSpacing: "0.02em",
              }}>
                {vehicleNumber}
              </h2>
              <div style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.35)",
                fontFamily: "'Inter', sans-serif",
              }}>
                Total Alerts: <span style={{ color: "#a78bfa", fontWeight: 700 }}>{alerts.totalAlerts}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "8px",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.4)",
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Donut chart */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
          <div style={{
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Inter', sans-serif",
            marginBottom: "10px",
          }}>
            Alarm Type Distribution
          </div>
          <DonutAlertChart alerts={alerts} compact={true} />
        </div>
      </div>
    </div>
  );
}
