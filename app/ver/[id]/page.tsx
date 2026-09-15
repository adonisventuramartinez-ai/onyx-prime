"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [reproduciendo, setReproduciendo] = useState(false);
  const [linkVideo, setLinkVideo] = useState("");
  const [extrayendo, setExtrayendo] = useState(false);

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
    if (!pelicula?.link_directo) {
      setError("Esta película no tiene un link configurado.");
      return;
    }

    setExtrayendo(true);
    setError("");

    try {
      const res = await fetch("/api/extraer-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pelicula.link_directo }),
      });

      const data = await res.json();

      if (!res.ok || !data.link_directo) {
        setError(data.error || "No se pudo extraer el video");
        setExtrayendo(false);
        return;
      }

      setLinkVideo(data.link_directo);
      setReproduciendo(true);
    } catch (err) {
      setError("Error al extraer el video");
    } finally {
      setExtrayendo(false);
    }
  };

  useEffect(() => {
    if (!linkVideo || !reproduciendo) return;
    const video = videoRef.current;
    if (!video) return;

    const cargarHLS = async () => {
      if (!(window as any).Hls) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js";
        document.head.appendChild(script);
        await new Promise((r) => { script.onload = r; });
      }

      const Hls = (window as any).Hls;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(linkVideo);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e: any, d: any) => {
          if (d.fatal) console.error("HLS error:", d);
        });
        return () => hls.destroy();
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = linkVideo;
      }
    };

    cargarHLS();
  }, [linkVideo, reproduciendo]);

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
              disabled={extrayendo}
              className="absolute inset-0 m-auto w-24 h-24 bg-[#E50914] hover:bg-[#b20710] rounded-full flex items-center justify-center transition-all hover:scale-110 z-20 disabled:opacity-50"
            >
              {extrayendo ? (
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="absolute bottom-12 text-center z-10 px-4">
              <h1 className="text-3xl md:text-5xl font-black text-white">{pelicula?.titulo}</h1>
              <p className="text-gray-300 text-sm mt-2">{pelicula?.anio} · {pelicula?.genero}</p>
              <p className="text-white text-sm mt-4 bg-black/60 px-4 py-2 rounded-full inline-block">
                {extrayendo ? "⏳ Extrayendo video..." : "▶ Haz clic para reproducir"}
              </p>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-full h-full max-h-screen"
            poster={pelicula?.caratula || CARATULA_FALLBACK}
          />
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
