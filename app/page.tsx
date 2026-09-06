"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [mensaje, setMensaje] = useState("Cargando...");

  useEffect(() => {
    fetch("/api/peliculas")
      .then((res) => res.json())
      .then((data) => {
        const cantidad = Array.isArray(data) ? data.length : data.peliculas?.length || 0;
        setMensaje(`✅ ${cantidad} películas cargadas`);
      })
      .catch((err) => {
        setMensaje(`❌ Error: ${err.message}`);
      });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#141414",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: "20px",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
        <span style={{ color: "white" }}>ONYX</span>
        <span style={{ color: "#E50914" }}>FLIX</span>
      </h1>
      <p style={{ fontSize: "1.2rem", color: "#888" }}>Tu cine premium</p>
      <div style={{
        marginTop: "2rem",
        padding: "1rem 2rem",
        background: "#1a1a1a",
        borderRadius: "8px",
        border: "1px solid #333"
      }}>
        <p style={{ fontSize: "1rem", color: "#aaa" }}>{mensaje}</p>
      </div>
    </div>
  );
}
