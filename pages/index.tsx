import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import ClientCard from "@/components/ClientCard";
import VehicleModal from "@/components/VehicleModal";
import LoadingScreen from "@/components/LoadingScreen";
import { ClientData, DashboardData } from "@/lib/sheets";

export default function Dashboard() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [selected, setSelected] = useState<ClientData | null>(null);
  const [search, setSearch]   = useState("");
  const [showUI, setShowUI]   = useState(false);
  const [updated, setUpdated] = useState("");

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
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
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      if (!isRefresh) {
        // Show loading screen for at least 2s (so animation plays fully)
        setTimeout(() => { setLoading(false); setShowUI(true); }, 2000);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data?.clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const overall = data?.clients.length
    ? Math.round(data.clients.reduce((s, c) => s + c.averageScore, 0) / data.clients.length)
    : 0;

  const isRefreshing = !loading && data === null;

  // Show loading screen on first load
  if (loading) return <LoadingScreen />;

  return (
    <>
      <Head>
        <title>Cautio — Fleet Score Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/cautio_shield.webp" />
        <meta name="theme-color" content="#0a0f0a" />
      </Head>

      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

        {/* Ambient background */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 40% at 15% 0%, rgba(74,222,128,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 85% 100%, rgba(74,222,128,0.04) 0%, transparent 60%)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>

          {/* ── HEADER ── */}
          <header style={{
            position: "sticky", top: 0, zIndex: 100,
            height: "60px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(10,15,10,0.85)",
            backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 36px",
          }}>
            {/* Logo + brand */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/cautio_shield.webp" alt="Cautio" style={{ width: "30px", height: "30px", objectFit: "contain" }} />
              <div>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "17px", color: "#f0f7f0", letterSpacing: "-0.01em", lineHeight: 1 }}>
                  Cautio
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", color: "rgba(74,222,128,0.55)", letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1, marginTop: "2px" }}>
                  Fleet Intelligence
                </div>
              </div>
            </div>

            {/* Right */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {updated && (
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif" }}>
                  {updated}
                </span>
              )}
              <button
                className="btn-green"
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }}>
                  <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.14" />
                </svg>
                Refresh
              </button>
            </div>
          </header>

          {/* ── HERO ── */}
          <div style={{ padding: "52px 36px 36px", maxWidth: "760px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(74,222,128,0.55)", fontFamily: "'Inter', sans-serif", marginBottom: "10px", fontWeight: 600 }}>
              Client · Infants
            </div>
            {/* Big headline like cautio.com */}
            <h1 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(32px, 5vw, 52px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: "#f0f7f0",
              marginBottom: "14px",
            }}>
              Fleet Safety{" "}
              <span style={{ color: "#4ade80", fontStyle: "italic" }}>Scores,</span>
              <br />At a Glance
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px", color: "rgba(240,247,240,0.45)", lineHeight: 1.6, maxWidth: "500px" }}>
              Real-time safety performance across all sub-clients and vehicles — powered by Cautio.
            </p>
          </div>

          {/* ── STATS BAR ── */}
          {data && (
            <div style={{ padding: "0 36px 32px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Overall Score", val: `${overall}`, unit: "/ 100", green: true },
                { label: "Total Vehicles", val: `${data.totalVehicles}` },
                { label: "Sub-Clients", val: `${data.clients.filter(c => c.name !== "Other").length}` },
                { label: "Unmatched", val: `${data.clients.find(c => c.name === "Other")?.totalVehicles ?? 0}` },
              ].map(s => (
                <div key={s.label} style={{
                  background: s.green ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.02)",
                  border: s.green ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  padding: "14px 22px",
                  minWidth: "130px",
                }}>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif", marginBottom: "5px" }}>
                    {s.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: "26px", color: s.green ? "#4ade80" : "#f0f7f0" }}>
                      {s.val}
                    </span>
                    {s.unit && <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif" }}>{s.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── MAIN CONTENT ── */}
          <div style={{ padding: "0 36px 60px" }}>

            {/* Error */}
            {error && (
              <div style={{ padding: "28px 32px", borderRadius: "16px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)", maxWidth: "560px", marginBottom: "28px" }}>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, color: "#f87171", marginBottom: "6px", fontSize: "16px" }}>⚠️ Failed to load</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "16px", wordBreak: "break-all" }}>{error}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.2)", marginBottom: "16px" }}>
                  Make sure both Google Sheets are set to &quot;Anyone with link → Viewer&quot;
                </div>
                <button className="btn-green" onClick={() => fetchData(true)}>Retry</button>
              </div>
            )}

            {/* Search */}
            {data && (
              <div style={{ position: "relative", maxWidth: "340px", marginBottom: "24px" }}>
                <svg style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }}
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search sub-clients..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    padding: "9px 14px 9px 38px",
                    color: "#f0f7f0",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                    transition: "border-color 0.2s",
                  }}
                />
              </div>
            )}

            {/* Cards grid */}
            {data && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "18px",
              }}>
                {filtered?.map((client, i) => (
                  <ClientCard
                    key={client.name}
                    client={client}
                    index={i}
                    onClick={() => setSelected(client)}
                  />
                ))}
              </div>
            )}

            {filtered?.length === 0 && (
              <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>
                No results for &quot;{search}&quot;
              </div>
            )}
          </div>

          {/* Footer */}
          <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "18px 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.18)" }}>
              © {new Date().getFullYear()} Cautio · Fleet Intelligence Platform
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(74,222,128,0.35)" }}>
              cautio.com
            </span>
          </footer>
        </div>
      </div>

      {/* Vehicle Modal */}
      {selected && <VehicleModal client={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
