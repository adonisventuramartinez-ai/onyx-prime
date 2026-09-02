"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Pelicula } from "@/lib/db";
import { CARATULA_FALLBACK } from "@/lib/db";

export default function VerPeliculaPage() {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const historialRegistrado = useRef(false);

  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [reproduciendo, setReproduciendo] = useState(false);
  const [mostrarControles, setMostrarControles] = useState(true);
  const [progreso, setProgreso] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [volumen, setVolumen] = useState(1);
  const [enLista, setEnLista] = useState(false);

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

    fetch("/api/favoritos")
      .then((res) => (res.ok ? res.json() : []))
      .then((ids: string[]) => setEnLista(ids.includes(id)))
      .catch(() => {});
  }, [id]);

  const toggleMiLista = async () => {
    const yaEsta = enLista;
    setEnLista(!yaEsta);
    if (yaEsta) {
      await fetch(`/api/favoritos?pelicula_id=${id}`, { method: "DELETE" }).catch(() => {});
    } else {
      await fetch("/api/favoritos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pelicula_id: id }),
      }).catch(() => {});
    }
  };

  const registrarHistorial = () => {
    if (historialRegistrado.current) return;
    historialRegistrado.current = true;
    fetch("/api/historial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pelicula_id: id }),
    }).catch(() => {});
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setReproduciendo(true);
      registrarHistorial();
    } else {
      video.pause();
      setReproduciendo(false);
    }
  };

  const formatTiempo = (segundos: number) => {
    if (!isFinite(segundos)) return "0:00";
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const compartir = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: pelicula?.titulo, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert("Enlace copiado al portapapeles");
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-nf-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !pelicula) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl font-semibold">{error || "Película no disponible"}</p>
        <Link href="/" className="bg-nf-red hover:bg-nf-red-hover transition-colors px-6 py-2.5 rounded font-semibold">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const tieneLink = Boolean(pelicula.link_directo);

  return (
    <main className="min-h-screen bg-black">
      <Link
        href="/"
        className="fixed top-4 left-4 z-30 bg-black/60 hover:bg-black/80 transition-colors rounded-full w-9 h-9 flex items-center justify-center text-lg"
        aria-label="Volver"
      >
        ←
      </Link>

      <div
        className="relative w-full aspect-video bg-black group"
        onMouseMove={() => setMostrarControles(true)}
        onMouseLeave={() => reproduciendo && setMostrarControles(false)}
      >
        {tieneLink ? (
          <>
            <video
              ref={videoRef}
              src={pelicula.link_directo}
              poster={pelicula.caratula || CARATULA_FALLBACK}
              className="w-full h-full"
              onClick={togglePlay}
              onPlay={() => { setReproduciendo(true); registrarHistorial(); }}
              onPause={() => setReproduciendo(false)}
              onTimeUpdate={(e) => setProgreso(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuracion(e.currentTarget.duration)}
              onVolumeChange={(e) => setVolumen(e.currentTarget.volume)}
            />

            <div
              className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
                mostrarControles ? "opacity-100" : "opacity-0"
              }`}
            >
              {!reproduciendo && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                  aria-label="Reproducir"
                >
                  <PlayIcon />
                </button>
              )}

              <div className="px-4 md:px-8 pb-4 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={duracion || 0}
                  value={progreso}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    if (videoRef.current) videoRef.current.currentTime = t;
                    setProgreso(t);
                  }}
                  className="w-full accent-nf-red cursor-pointer"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={togglePlay} aria-label={reproduciendo ? "Pausar" : "Reproducir"}>
                      {reproduciendo ? <PauseIcon /> : <PlayIcon small />}
                    </button>
                    <span className="text-sm text-gray-300">
                      {formatTiempo(progreso)} / {formatTiempo(duracion)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <VolumeIcon />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volumen}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (videoRef.current) videoRef.current.volume = v;
                        setVolumen(v);
                      }}
                      className="w-20 accent-nf-red cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-4">
            <img
              src={pelicula.caratula || CARATULA_FALLBACK}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
            <p className="relative text-lg font-semibold">
              Esta película todavía no tiene un enlace de reproducción
            </p>
            <p className="relative text-nf-gray-light text-sm">
              Añádelo desde el panel de administrador.
            </p>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-0 py-8 space-y-4">
        <h1 className="text-2xl md:text-4xl font-bold">{pelicula.titulo}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <span>{pelicula.anio}</span>
          <span className="border border-white/30 px-1.5 rounded text-xs">{pelicula.genero}</span>
        </div>
        <p className="text-gray-200 leading-relaxed">{pelicula.sinopsis}</p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={togglePlay}
            disabled={!tieneLink}
            className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded font-semibold hover:bg-white/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PlayIcon small /> Reproducir
          </button>
          <button
            onClick={toggleMiLista}
            className="flex items-center gap-2 bg-gray-700/60 px-5 py-2 rounded font-semibold hover:bg-gray-700 transition-colors"
          >
            {enLista ? "✓ En mi lista" : "+ Mi lista"}
          </button>
          <button
            onClick={compartir}
            className="flex items-center gap-2 bg-gray-700/60 px-5 py-2 rounded font-semibold hover:bg-gray-700 transition-colors"
          >
            Compartir
          </button>
        </div>
      </div>
    </main>
  );
}

function PlayIcon({ small }: { small?: boolean }) {
  const s = small ? 18 : 28;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 10v4h4l5 5V5L7 10H3z" />
    </svg>
  );
}
