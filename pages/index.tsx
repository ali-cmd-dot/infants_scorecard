import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import ClientCard from "@/components/ClientCard";
import VehicleCard from "@/components/VehicleCard";
import VehicleModal from "@/components/VehicleModal";
import VehicleDetailModal from "@/components/VehicleDetailModal";
import LoadingScreen from "@/components/LoadingScreen";
import AlertCards from "@/components/AlertCards";
import { ClientData, VehicleData, DashboardData } from "@/lib/sheets";

type ViewMode = "client" | "vehicle";

export default function Dashboard() {
  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [viewMode, setViewMode]   = useState<ViewMode>("client");
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [search, setSearch]       = useState("");
  const [updated, setUpdated]     = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.details || e.error || "Failed");
      }
      const json: DashboardData = await res.json();
      setData(json);
      setUpdated(new Date(json.lastUpdated).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setTimeout(() => setLoading(false), 2000);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredClients = data?.clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredVehicles = data?.vehicles.filter(v =>
    v.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const overall = data?.clients.length
    ? Math.round(data.clients.reduce((s, c) => s + c.averageScore, 0) / data.clients.length)
    : 0;

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Head>
        <title>Cautio — Fleet Score Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta name="theme-color" content="#0a0f0a" />
      </Head>

      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 40% at 15% 0%, rgba(74,222,128,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 85% 100%, rgba(74,222,128,0.04) 0%, transparent 60%)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>

          {/* ── HEADER ── */}
          <header style={{
            position: "sticky", top: 0, zIndex: 100,
            height: "64px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(10,15,10,0.92)",
            backdropFilter: "blur(24px)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 32px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src="/cautio_shield.webp" alt="Cautio" style={{ width: "36px", height: "36px", objectFit: "contain", display: "block" }} />
              <div>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "18px", color: "#f0f7f0", letterSpacing: "-0.01em", lineHeight: "1.2" }}>
                  Cautio
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "9.5px", color: "rgba(74,222,128,0.6)", letterSpacing: "0.13em", textTransform: "uppercase", lineHeight: "1.2" }}>
                  Fleet Intelligence
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {updated && (
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif" }}>
                  {updated}
                </span>
              )}
              <button className="btn-green" onClick={() => fetchData(true)} disabled={refreshing}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}>
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-4.14" />
                </svg>
                Refresh
              </button>
            </div>
          </header>

          {/* ── HERO ── */}
          <div style={{ padding: "40px 32px 24px", maxWidth: "700px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(74,222,128,0.55)", fontFamily: "'Inter', sans-serif", marginBottom: "10px", fontWeight: 600 }}>
              Client · Infants
            </div>
            <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 46px)", lineHeight: 1.1, letterSpacing: "-0.025em", color: "#f0f7f0", marginBottom: "10px" }}>
              Fleet Safety{" "}
              <span style={{ color: "#4ade80", fontStyle: "italic" }}>Scores,</span>
              <br />At a Glance
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "rgba(240,247,240,0.4)", lineHeight: 1.6, maxWidth: "440px", margin: 0 }}>
              Real-time safety performance across all sub-clients and vehicles.
            </p>
          </div>

          {/* ── STATS BAR ── */}
          {data && (
            <div style={{ padding: "0 32px 24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { label: "Overall Score",  val: String(overall),  unit: "/ 100", green: true },
                { label: "Total Vehicles", val: String(data.totalVehicles) },
                { label: "Sub-Clients",    val: String(data.clients.filter(c => c.name !== "Other").length) },
                { label: "Other",          val: String(data.clients.find(c => c.name === "Other")?.totalVehicles ?? 0) },
              ].map(s => (
                <div key={s.label} style={{
                  background: s.green ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.02)",
                  border: s.green ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  minWidth: "120px",
                }}>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif", marginBottom: "4px" }}>
                    {s.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "24px", color: s.green ? "#4ade80" : "#f0f7f0" }}>
                      {s.val}
                    </span>
                    {s.unit && <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif" }}>{s.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CONTENT ── */}
          <div style={{ padding: "0 32px 60px" }}>

            {/* Error */}
            {error && (
              <div style={{ padding: "24px 28px", borderRadius: "14px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)", maxWidth: "520px", marginBottom: "24px" }}>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, color: "#f87171", marginBottom: "6px", fontSize: "15px" }}>⚠️ Failed to load</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "14px", wordBreak: "break-all" }}>{error}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.2)", marginBottom: "14px" }}>
                  Make sure both Google Sheets are &quot;Anyone with link → Viewer&quot; and the Alerts tab GID is correct in lib/sheets.ts
                </div>
                <button className="btn-green" onClick={() => fetchData(true)}>Retry</button>
              </div>
            )}

            {data && (
              <>
                {/* ── OVERALL ALERT CHART — centered ── */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: "40px",
                  padding: "28px 24px 20px",
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "20px",
                }}>
                  <AlertCards
                    alerts={data.overallAlerts}
                    title="Overall Monthly Alert Summary"
                    titleCenter={true}
                  />
                </div>

                {/* ── VIEW TOGGLE + SEARCH ── */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px", flexWrap: "wrap" }}>
                  <div style={{
                    display: "flex",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    padding: "3px",
                    gap: "2px",
                  }}>
                    {(["client", "vehicle"] as ViewMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => { setViewMode(mode); setSearch(""); }}
                        style={{
                          background: viewMode === mode ? "rgba(74,222,128,0.15)" : "transparent",
                          border: viewMode === mode ? "1px solid rgba(74,222,128,0.35)" : "1px solid transparent",
                          borderRadius: "8px",
                          padding: "6px 16px",
                          color: viewMode === mode ? "#4ade80" : "rgba(255,255,255,0.4)",
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          letterSpacing: "0.04em",
                          textTransform: "capitalize",
                        }}
                      >
                        {mode === "client" ? "🏢 Client View" : "🚌 Vehicle View"}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
                    <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }}
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder={viewMode === "client" ? "Search sub-clients..." : "Search vehicles or clients..."}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "9px",
                        padding: "8px 14px 8px 36px",
                        color: "#f0f7f0",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "13px",
                        transition: "border-color 0.2s",
                      }}
                    />
                  </div>

                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif" }}>
                    {viewMode === "client"
                      ? `${filteredClients?.length ?? 0} sub-clients`
                      : `${filteredVehicles?.length ?? 0} vehicles`}
                  </span>
                </div>

                {/* ── CLIENT VIEW ── */}
                {viewMode === "client" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px", alignItems: "stretch" }}>
                    {filteredClients?.map((client, i) => (
                      <ClientCard key={client.name} client={client} index={i} onClick={() => setSelectedClient(client)} />
                    ))}
                  </div>
                )}

                {/* ── VEHICLE VIEW ── */}
                {viewMode === "vehicle" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px", alignItems: "stretch" }}>
                    {filteredVehicles?.map((vehicle, i) => (
                      <VehicleCard key={vehicle.vehicleNumber} vehicle={vehicle} index={i} onClick={() => setSelectedVehicle(vehicle)} />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {((viewMode === "client" && filteredClients?.length === 0) ||
                  (viewMode === "vehicle" && filteredVehicles?.length === 0)) && (
                  <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>
                    No results for &quot;{search}&quot;
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.18)" }}>
              © {new Date().getFullYear()} Cautio · Fleet Intelligence Platform
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(74,222,128,0.35)" }}>
              cautio.com
            </span>
          </footer>
        </div>
      </div>

      {/* Modals */}
      {selectedClient && <VehicleModal client={selectedClient} onClose={() => setSelectedClient(null)} />}
      {selectedVehicle && <VehicleDetailModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />}
    </>
  );
}
