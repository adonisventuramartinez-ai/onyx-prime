"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CARATULA_FALLBACK } from "@/lib/db";

interface Pelicula {
  id: string;
  tmdb_id: number | null;
  titulo: string;
  anio: number | string;
  genero: string;
  sinopsis: string;
  caratula: string;
  link_directo: string;
}

// Proveedores ordenados por prioridad (el primero es el que funciona)
const PROVEEDORES = [
  {
    nombre: "VidLink",
    url: (id: number) => `https://vidlink.pro/movie/${id}?primaryColor=E50914&autoplay=true&title=true`,
    idioma: "es",
  },
  {
    nombre: "VidSrc XYZ",
    url: (id: number) => `https://vidsrc.xyz/embed/movie/${id}?ds_lang=es`,
    idioma: "es",
  },
  {
    nombre: "VidSrc.to",
    url: (id: number) => `https://vidsrc.to/embed/movie/${id}`,
    idioma: "es",
  },
  {
    nombre: "2Embed",
    url: (id: number) => `https://www.2embed.cc/embed/${id}`,
    idioma: "es",
  },
  {
    nombre: "SuperEmbed",
    url: (id: number) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    idioma: "es",
  },
];

export default function VerPeliculaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [proveedorIndex, setProveedorIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/peliculas/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("No encontrada");
        return res.json();
      })
      .then((data) => {
        setPelicula(data);
        setCargando(false);
      })
      .catch(() => {
        setError("No pudimos encontrar esta película.");
        setCargando(false);
      });
  }, [id]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !pelicula) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl font-semibold text-white">{error || "Película no disponible"}</p>
        <button
          onClick={() => router.push("/")}
          className="bg-[#E50914] hover:bg-[#b20710] transition-colors px-6 py-2.5 rounded font-semibold text-white"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const tmdbId = pelicula.tmdb_id;

  // Si no hay tmdb_id, mostrar aviso
  if (!tmdbId) {
    return (
      <main className="min-h-screen bg-black flex flex-col">
        <button
          onClick={() => router.push(`/pelicula/${id}`)}
          className="fixed top-4 left-4 z-30 bg-black/60 hover:bg-black/80 transition-colors rounded-full w-9 h-9 flex items-center justify-center text-lg text-white"
        >
          ←
        </button>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <img
            src={pelicula.caratula || CARATULA_FALLBACK}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="relative z-10">
            <p className="text-xl font-semibold text-white">
              Esta película no tiene un ID de TMDB asignado
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Edítala en el panel de admin para agregarlo.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const proveedorActual = PROVEEDORES[proveedorIndex];
  const embedUrl = proveedorActual.url(tmdbId);

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <button
        onClick={() => router.push(`/pelicula/${id}`)}
        className="fixed top-4 left-4 z-30 bg-black/60 hover:bg-black/80 transition-colors rounded-full w-9 h-9 flex items-center justify-center text-lg text-white"
        aria-label="Volver"
      >
        ←
      </button>

      <div className="relative w-full flex-1 bg-black flex items-center justify-center">
        <iframe
          key={embedUrl}
          src={embedUrl}
          className="w-full h-full max-h-screen border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title={pelicula.titulo}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Info + Botón de cambiar servidor */}
      <div className="absolute bottom-4 right-4 z-30 flex gap-2">
        <span className="bg-black/70 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm">
          📺 {proveedorActual.nombre}
        </span>
        <button
          onClick={() => setProveedorIndex((i) => (i + 1) % PROVEEDORES.length)}
          className="bg-[#E50914]/80 hover:bg-[#E50914] text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm transition-colors font-semibold"
        >
          🔄 Cambiar servidor
        </button>
      </div>
    </main>
  );
}
