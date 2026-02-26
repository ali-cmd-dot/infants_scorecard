import React from "react";
import { AlertSummary } from "@/lib/sheets";

interface Props {
  alerts: AlertSummary;
  title?: string;
}

const ALERT_TYPES = [
  { key: "totalAlerts",       label: "Total Alerts",       icon: "🔔", color: "#a78bfa" },
  { key: "distractedDriving", label: "Distracted Driving", icon: "👁️", color: "#f87171" },
  { key: "seatBeltAbsent",    label: "Seat Belt Absent",   icon: "🔒", color: "#fb923c" },
  { key: "smoking",           label: "Smoking",            icon: "🚬", color: "#94a3b8" },
  { key: "fatigueDriving",    label: "Fatigue Driving",    icon: "😴", color: "#60a5fa" },
  { key: "phoneCall",         label: "Phone Call",         icon: "📱", color: "#f472b6" },
  { key: "overSpeed",         label: "Over Speed",         icon: "⚡", color: "#fde047" },
];

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

export default function AlertCards({ alerts, title }: Props) {
  const total = alerts.totalAlerts || 1; // avoid div by zero

  return (
    <div style={{ marginBottom: "32px" }}>
      {title && (
        <div style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: "15px",
          color: "#f0f7f0",
          marginBottom: "14px",
          letterSpacing: "-0.01em",
        }}>
          {title}
        </div>
      )}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "10px",
      }}>
        {ALERT_TYPES.map(({ key, label, icon, color }) => {
          const val = alerts[key as keyof AlertSummary] as number;
          const pct = key === "totalAlerts" ? 100 : Math.round((val / total) * 100);
          const isTotal = key === "totalAlerts";

          return (
            <div
              key={key}
              style={{
                background: isTotal
                  ? `linear-gradient(135deg, ${color}15, ${color}08)`
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${isTotal ? color + "35" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "14px",
                padding: "14px 16px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Progress bar at bottom */}
              {!isTotal && (
                <div style={{
                  position: "absolute",
                  bottom: 0, left: 0,
                  height: "2px",
                  width: `${pct}%`,
                  background: color,
                  borderRadius: "0 2px 2px 0",
                  transition: "width 1s ease-out",
                }} />
              )}

              <div style={{
                fontSize: "20px",
                marginBottom: "8px",
                lineHeight: 1,
              }}>
                {icon}
              </div>
              <div style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: isTotal ? "26px" : "22px",
                color: isTotal ? color : "#f0f7f0",
                lineHeight: 1,
                marginBottom: "4px",
              }}>
                {fmt(val)}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                lineHeight: 1.3,
              }}>
                {label}
              </div>
              {!isTotal && val > 0 && (
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "10px",
                  color: color,
                  marginTop: "3px",
                  fontWeight: 500,
                }}>
                  {pct}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
