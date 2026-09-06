"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [estado, setEstado] = useState("Iniciando...");
  const [error, setError] = useState("");

  useEffect(() => {
    setEstado("🔄 Cargando películas...");

    fetch("/api/peliculas")
      .then(async (res) => {
        setEstado(`📡 Respuesta HTTP: ${res.status}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
        }
        return res.json();
      })
      .then((data) => {
        const cantidad = data.peliculas?.length || 0;
        setEstado(`✅ ${cantidad} películas cargadas correctamente`);
      })
      .catch((err) => {
        setEstado(`❌ Error: ${err.message}`);
        setError(err.message);
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
      <p style={{ fontSize: "1.2rem", color: "#888", marginBottom: "2rem" }}>
        🔧 Modo diagnóstico
      </p>
      <div style={{
        padding: "1.5rem 2rem",
        background: "#1a1a1a",
        borderRadius: "8px",
        border: "1px solid #333",
        maxWidth: "600px",
        width: "100%"
      }}>
        <p style={{ fontSize: "1rem", color: "#aaa" }}>{estado}</p>
        {error && (
          <details style={{ marginTop: "1rem", textAlign: "left" }}>
            <summary style={{ color: "#E50914", cursor: "pointer" }}>Ver detalles del error</summary>
            <pre style={{ color: "#ff6b6b", fontSize: "0.8rem", marginTop: "0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {error}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
