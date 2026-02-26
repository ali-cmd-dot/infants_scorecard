import React, { useEffect } from "react";
import { VehicleData } from "@/lib/sheets";
import ScoreRing from "./ScoreRing";

interface Props {
  vehicle: VehicleData | null;
  onClose: () => void;
}

const ALERT_TYPES = [
  { key: "distractedDriving", label: "Distracted Driving", icon: "👁️", color: "#f87171" },
  { key: "seatBeltAbsent",    label: "Seat Belt Absent",   icon: "🔒", color: "#fb923c" },
  { key: "smoking",           label: "Smoking",            icon: "🚬", color: "#94a3b8" },
  { key: "fatigueDriving",    label: "Fatigue Driving",    icon: "😴", color: "#60a5fa" },
  { key: "phoneCall",         label: "Phone Call",         icon: "📱", color: "#f472b6" },
  { key: "overSpeed",         label: "Over Speed",         icon: "⚡", color: "#fde047" },
];

export default function VehicleDetailModal({ vehicle, onClose }: Props) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  if (!vehicle) return null;

  const { vehicleNumber, score, clientName, alerts } = vehicle;
  const safeScore = score ?? 0;
  const total = alerts.totalAlerts || 1;

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

        {/* Alert breakdown */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
          <div style={{
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Inter', sans-serif",
            marginBottom: "14px",
          }}>
            Alert Breakdown — Monthly
          </div>

          {ALERT_TYPES.map(({ key, label, icon, color }) => {
            const val = alerts[key as keyof typeof alerts] as number;
            const pct = alerts.totalAlerts > 0 ? Math.round((val / alerts.totalAlerts) * 100) : 0;

            return (
              <div key={key} style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "10px",
                background: val > 0 ? `${color}08` : "rgba(255,255,255,0.01)",
                border: `1px solid ${val > 0 ? color + "20" : "rgba(255,255,255,0.04)"}`,
                marginBottom: "7px",
              }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px",
                    color: val > 0 ? "#f0f7f0" : "rgba(255,255,255,0.3)",
                    fontWeight: 500,
                    marginBottom: "5px",
                  }}>
                    {label}
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    height: "3px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: color,
                      borderRadius: "2px",
                      transition: "width 1s ease-out",
                    }} />
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontWeight: 800,
                    fontSize: "16px",
                    color: val > 0 ? color : "rgba(255,255,255,0.2)",
                  }}>
                    {val}
                  </div>
                  {val > 0 && (
                    <div style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.3)",
                    }}>
                      {pct}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
