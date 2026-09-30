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

export default function VerPeliculaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [reproduciendo, setReproduciendo] = useState(false);

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

  const iniciarReproduccion = async () => {
    setError("");
    setReproduciendo(true);

    // Guardar en historial (silencioso)
    try {
      await fetch("/api/historial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pelicula_id: id }),
      });
    } catch (err) {
      console.warn("[ver] No se pudo guardar en historial:", err);
    }
  };

  // URL del embed de VidLink
  const embedUrl = pelicula?.tmdb_id
    ? `https://vidlink.pro/movie/${pelicula.tmdb_id}`
    : pelicula?.link_directo;

  if (cargando) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <button
        onClick={() => router.push(`/pelicula/${id}`)}
        className="fixed top-4 left-4 z-30 bg-black/60 hover:bg-black/80 rounded-full w-9 h-9 flex items-center justify-center text-lg text-white"
      >
        ←
      </button>

      <div className="relative w-full flex-1 bg-black flex items-center justify-center">
        {!reproduciendo ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={pelicula?.caratula || CARATULA_FALLBACK}
              alt={pelicula?.titulo}
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

            <button
              onClick={iniciarReproduccion}
              className="absolute inset-0 m-auto w-24 h-24 bg-[#E50914] hover:bg-[#b20710] rounded-full flex items-center justify-center transition-all hover:scale-110 z-20"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <div className="absolute bottom-12 text-center z-10 px-4">
              <h1 className="text-3xl md:text-5xl font-black text-white">
                {pelicula?.titulo}
              </h1>
              <p className="text-gray-300 text-sm mt-2">
                {pelicula?.anio} · {pelicula?.genero}
              </p>
              <p className="text-white text-sm mt-4 bg-black/60 px-4 py-2 rounded-full inline-block">
                ▶ Haz clic para reproducir
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-screen">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                frameBorder={0}
                title={pelicula?.titulo}
                referrerPolicy="origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-center p-8">
                <p className="text-gray-400">
                  Esta película no tiene TMDB ID. Agrégala con el buscador automático.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg z-30 text-sm">
          {error}
        </div>
      )}
    </main>
  );
}
