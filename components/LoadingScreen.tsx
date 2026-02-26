import React from "react";

export default function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0f0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      {/* Radial glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div className="logo-anim" style={{ marginBottom: "32px", position: "relative" }}>
        <img
          src="/cautio_shield.webp"
          alt="Cautio"
          style={{ width: "80px", height: "80px", objectFit: "contain" }}
        />
      </div>

      {/* Brand name */}
      <div
        className="logo-anim"
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800,
          fontSize: "28px",
          color: "#f0f7f0",
          letterSpacing: "-0.02em",
          marginBottom: "6px",
          animationDelay: "0.1s",
          opacity: 0,
        }}
      >
        Cautio
      </div>
      <div
        className="logo-anim"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "12px",
          color: "rgba(74,222,128,0.6)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: "48px",
          animationDelay: "0.2s",
          opacity: 0,
        }}
      >
        Fleet Intelligence
      </div>

      {/* Loading bar */}
      <div
        style={{
          width: "180px",
          height: "2px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          className="loading-bar"
          style={{
            height: "100%",
            background: "linear-gradient(90deg, rgba(74,222,128,0.3), #4ade80)",
            borderRadius: "2px",
            width: "0%",
          }}
        />
      </div>

      <div
        style={{
          marginTop: "16px",
          fontFamily: "'Inter', sans-serif",
          fontSize: "12px",
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.05em",
        }}
        className="logo-pulse"
      >
        Loading dashboard...
      </div>
    </div>
  );
}
