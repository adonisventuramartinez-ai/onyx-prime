"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    fetch("/api/peliculas")
      .then((res) => res.json())
      .then((data) => {
        const pelis = data.peliculas || data || [];
        setPeliculas(pelis);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <span className="text-[#E50914] font-black text-2xl">ONYXFLIX</span>
          <div className="flex gap-4 text-sm">
            <span className="text-white">Inicio</span>
            <span className="text-gray-400">Telenovela</span>
            <span className="text-gray-400">Películas</span>
            <span className="text-gray-400">Series</span>
            <span className="text-gray-400">Mi lista</span>
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
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {peliculas.slice(0, 20).map((p) => (
              <Link href={`/pelicula/${p.id}`} key={p.id}>
                <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={p.caratula || CARATULA_FALLBACK}
                      alt={p.titulo}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-xs font-medium">▶ Reproducir</span>
                    </div>
                  </div>
                  <h4 className="mt-2 text-sm font-medium truncate">{p.titulo}</h4>
                  <p className="text-xs text-gray-500">{p.genero}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
