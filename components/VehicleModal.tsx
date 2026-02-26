import React, { useEffect } from "react";
import { ClientData, VehicleScore } from "@/lib/sheets";
import ScoreRing from "./ScoreRing";
import DonutAlertChart from "./DonutAlertChart";

interface Props { client: ClientData | null; onClose: () => void; }

function clr(s: number | null) {
  if (s === null) return "rgba(255,255,255,0.2)";
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#86efac";
  if (s >= 40) return "#fde047";
  return "#f87171";
}

function VehicleRow({ v, i }: { v: VehicleScore; i: number }) {
  const c = clr(v.score);
  return (
    <div
      className="card-anim"
      style={{
        animationDelay: `${i * 0.025}s`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 16px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        marginBottom: "7px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}`, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13.5px", fontWeight: 500, color: "#f0f7f0", letterSpacing: "0.01em" }}>
          {v.vehicleNumber}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {v.score !== null ? (
          <>
            <div style={{ width: "72px", height: "3px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${v.score}%`, background: c, transition: "width 1s ease-out" }} />
            </div>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "14px", color: c, minWidth: "32px", textAlign: "right" }}>
              {v.score}
            </span>
          </>
        ) : (
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No data</span>
        )}
      </div>
    </div>
  );
}

type Tab = "vehicles" | "alerts";

export default function VehicleModal({ client, onClose }: Props) {
  const [tab, setTab] = React.useState<Tab>("vehicles");

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  if (!client) return null;

  const scored = [...client.vehicles.filter(v => v.score !== null)].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const unscored = client.vehicles.filter(v => v.score === null);

  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        {/* Header */}
        <div style={{ padding: "24px 26px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <ScoreRing score={client.averageScore} size={68} strokeWidth={5} />
            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(74,222,128,0.55)", fontFamily: "'Inter', sans-serif", marginBottom: "3px" }}>
                Sub-Client · Infants
              </div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "20px", color: "#f0f7f0", marginBottom: "2px" }}>
                {client.name}
              </h2>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif" }}>
                {client.totalVehicles} vehicles &nbsp;·&nbsp; {scored.length} scored
                &nbsp;·&nbsp; <span style={{ color: "#a78bfa" }}>{client.alerts.totalAlerts} alerts</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex",
          gap: "4px",
          padding: "12px 26px 0",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          {(["vehicles", "alerts"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? "rgba(74,222,128,0.12)" : "transparent",
                border: tab === t ? "1px solid rgba(74,222,128,0.3)" : "1px solid transparent",
                borderBottom: "none",
                borderRadius: "8px 8px 0 0",
                padding: "7px 16px 9px",
                color: tab === t ? "#4ade80" : "rgba(255,255,255,0.35)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.2s",
                letterSpacing: "0.03em",
              }}
            >
              {t === "vehicles" ? "🚌 Vehicles" : "🔔 Alert Distribution"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 26px 24px" }}>

          {/* VEHICLES TAB */}
          {tab === "vehicles" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 16px 8px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif" }}>
                <span>Vehicle No.</span><span>Score / 100</span>
              </div>
              {scored.map((v, i) => <VehicleRow key={v.vehicleNumber} v={v} i={i} />)}
              {unscored.length > 0 && (
                <>
                  {scored.length > 0 && (
                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)", fontFamily: "'Inter', sans-serif", padding: "10px 0 8px", borderTop: "1px solid rgba(255,255,255,0.04)", margin: "10px 0 0" }}>
                      No Score Data
                    </div>
                  )}
                  {unscored.map((v, i) => <VehicleRow key={v.vehicleNumber} v={v} i={scored.length + i} />)}
                </>
              )}
              {client.vehicles.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>No vehicles</div>
              )}
            </>
          )}

          {/* ALERTS TAB */}
          {tab === "alerts" && (
            <div style={{ paddingTop: "8px" }}>
              <DonutAlertChart alerts={client.alerts} compact={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
