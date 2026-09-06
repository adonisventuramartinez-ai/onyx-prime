"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CARATULA_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23222222'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='%23808080' text-anchor='middle' dy='.3em'%3ESin imagen%3C/text%3E%3C/svg%3E";

type Pelicula = {
  id: string;
  titulo: string;
  anio: number | string;
  genero: string;
  sinopsis: string;
  caratula: string;
  link_directo: string;
  fuente: "manual" | "auto";
  destacada?: boolean;
  creado_en: string;
};

export default function Home() {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔍 Iniciando carga de películas...");
    
    fetch("/api/peliculas")
      .then((res) => {
        console.log(`📡 Respuesta HTTP: ${res.status}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("✅ Datos recibidos:", data);
        const pelis = data.peliculas || data || [];
        setPeliculas(pelis);
        setCargando(false);
      })
      .catch((err) => {
        console.error("❌ Error:", err);
        setError(err.message);
        setCargando(false);
      });
  }, []);

  // Si hay error, mostrarlo
  if (error) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-lg">
          <h2 className="text-xl font-bold text-red-400 mb-2">❌ Error</h2>
          <p className="text-gray-300">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <span className="text-[#E50914] font-black text-2xl">ONYXFLIX</span>
          <div className="flex gap-4 text-sm">
            <span className="text-white">Inicio</span>
            <span className="text-gray-400">Películas</span>
            <span className="text-gray-400">Series</span>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="pt-20 px-4 max-w-7xl mx-auto">
        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E50914]" />
          </div>
        ) : peliculas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No hay películas en el catálogo</p>
            <p className="text-sm mt-2">Total: {peliculas.length} películas</p>
          </div>
        ) : (
          <>
            <p className="text-green-400 text-sm mb-4">✅ {peliculas.length} películas cargadas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {peliculas.slice(0, 12).map((p, index) => (
                <div key={p.id || index} className="group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={p.caratula || CARATULA_FALLBACK}
                      alt={p.titulo || "Sin título"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
                      }}
                    />
                  </div>
                  <h4 className="mt-2 text-sm font-medium truncate">{p.titulo || "Sin título"}</h4>
                  <p className="text-xs text-gray-500 truncate">{p.genero || "Sin género"}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
