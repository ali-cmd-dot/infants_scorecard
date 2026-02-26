import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import ClientCard from "@/components/ClientCard";
import VehicleModal from "@/components/VehicleModal";
import { ClientData, DashboardData } from "@/lib/sheets";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "Failed to fetch");
      }
      const json: DashboardData = await res.json();
      setData(json);
      setLastUpdated(
        new Date(json.lastUpdated).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredClients = data?.clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const overallScore =
    data && data.clients.length > 0
      ? Math.round(
          data.clients.reduce((sum, c) => sum + c.averageScore, 0) / data.clients.length
        )
      : 0;

  return (
    <>
      <Head>
        <title>Cautio — Fleet Score Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/cautio_shield.webp" />
        <meta name="theme-color" content="#050e06" />
      </Head>

      <div className="noise-overlay" style={{ minHeight: "100vh" }}>
        {/* Background mesh */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(46,204,113,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(46,204,113,0.05) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header */}
          <header
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              padding: "0 40px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(5,14,6,0.8)",
              backdropFilter: "blur(20px)",
              position: "sticky",
              top: 0,
              zIndex: 100,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "rgba(46,204,113,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="/cautio_shield.webp"
                  alt="Cautio"
                  style={{ width: "28px", height: "28px", objectFit: "contain" }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 800,
                    fontSize: "18px",
                    color: "#e8f5ea",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Cautio
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "rgba(46,204,113,0.6)",
                    fontFamily: "DM Sans, sans-serif",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                    marginTop: "1px",
                  }}
                >
                  Fleet Intelligence
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              {lastUpdated && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  Updated {lastUpdated}
                </span>
              )}
              <button
                onClick={fetchData}
                disabled={loading}
                style={{
                  background: "rgba(46,204,113,0.1)",
                  border: "1px solid rgba(46,204,113,0.25)",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  color: "#2ECC71",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-4.14" />
                </svg>
                Refresh
              </button>
            </div>
          </header>

          {/* Main */}
          <main style={{ padding: "40px" }}>
            <div style={{ marginBottom: "36px" }}>
              <div
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(46,204,113,0.6)",
                  fontFamily: "DM Sans, sans-serif",
                  marginBottom: "8px",
                }}
              >
                Client · Infants
              </div>
              <h1
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(28px, 4vw, 42px)",
                  color: "#e8f5ea",
                  margin: "0 0 6px 0",
                  letterSpacing: "-0.02em",
                }}
              >
                Fleet Score Dashboard
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "15px",
                  margin: 0,
                }}
              >
                Real-time safety scores across all sub-clients &amp; vehicles
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px",
                }}
              >
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="loading-pulse"
                    style={{
                      height: "280px",
                      borderRadius: "20px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div
                style={{
                  padding: "40px",
                  borderRadius: "16px",
                  background: "rgba(231,76,60,0.08)",
                  border: "1px solid rgba(231,76,60,0.2)",
                  textAlign: "center",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
                <h3
                  style={{
                    fontFamily: "Syne, sans-serif",
                    color: "#E74C3C",
                    margin: "0 0 8px 0",
                    fontSize: "18px",
                  }}
                >
                  Failed to load data
                </h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "13px",
                    margin: "0 0 8px 0",
                    wordBreak: "break-all",
                  }}
                >
                  {error}
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "12px",
                    margin: "0 0 20px 0",
                  }}
                >
                  Make sure both Google Sheets are set to &quot;Anyone with link can view&quot;
                </p>
                <button
                  onClick={fetchData}
                  style={{
                    background: "rgba(231,76,60,0.15)",
                    border: "1px solid rgba(231,76,60,0.3)",
                    borderRadius: "8px",
                    padding: "8px 20px",
                    color: "#E74C3C",
                    fontFamily: "DM Sans, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  Try again
                </button>
              </div>
            )}

            {/* Data */}
            {!loading && !error && data && (
              <>
                {/* Stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "16px",
                    marginBottom: "32px",
                  }}
                >
                  {[
                    { label: "Overall Score", value: `${overallScore}`, unit: "/ 100", highlight: true },
                    { label: "Total Vehicles", value: `${data.totalVehicles}`, unit: "" },
                    { label: "Sub-Clients", value: `${data.clients.filter((c) => c.name !== "Other").length}`, unit: "" },
                    { label: "Unmatched", value: `${data.clients.find((c) => c.name === "Other")?.totalVehicles ?? 0}`, unit: "" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        background: stat.highlight
                          ? "linear-gradient(135deg, rgba(46,204,113,0.1) 0%, rgba(46,204,113,0.05) 100%)"
                          : "rgba(255,255,255,0.02)",
                        border: stat.highlight
                          ? "1px solid rgba(46,204,113,0.25)"
                          : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "14px",
                        padding: "16px 20px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.4)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontFamily: "DM Sans, sans-serif",
                          marginBottom: "6px",
                        }}
                      >
                        {stat.label}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span
                          style={{
                            fontFamily: "Syne, sans-serif",
                            fontWeight: 800,
                            fontSize: "28px",
                            color: stat.highlight ? "#2ECC71" : "#e8f5ea",
                          }}
                        >
                          {stat.value}
                        </span>
                        {stat.unit && (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "rgba(255,255,255,0.3)",
                              fontFamily: "DM Sans, sans-serif",
                            }}
                          >
                            {stat.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div style={{ marginBottom: "24px", position: "relative", maxWidth: "360px" }}>
                  <svg
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "rgba(255,255,255,0.3)",
                    }}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search sub-clients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      padding: "10px 14px 10px 42px",
                      color: "#e8f5ea",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {filteredClients?.map((client, i) => (
                    <ClientCard
                      key={client.name}
                      client={client}
                      index={i}
                      onClick={() => setSelectedClient(client)}
                    />
                  ))}
                </div>

                {filteredClients?.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px",
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    No sub-clients match &quot;{search}&quot;
                  </div>
                )}
              </>
            )}
          </main>

          {/* Footer */}
          <footer
            style={{
              borderTop: "1px solid rgba(255,255,255,0.04)",
              padding: "20px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>
              © {new Date().getFullYear()} Cautio · Fleet Intelligence Platform
            </span>
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "rgba(46,204,113,0.4)" }}>
              cautio.com
            </span>
          </footer>
        </div>
      </div>

      {selectedClient && (
        <VehicleModal client={selectedClient} onClose={() => setSelectedClient(null)} />
      )}
    </>
  );
}
