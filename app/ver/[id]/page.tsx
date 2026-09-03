"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Pelicula } from "@/lib/db";
import { CARATULA_FALLBACK } from "@/lib/db";

export default function VerPeliculaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
        <button
          onClick={() => router.push("/")}
          className="bg-nf-red hover:bg-nf-red-hover transition-colors px-6 py-2.5 rounded font-semibold"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const tieneLink = Boolean(pelicula.link_directo);

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <button
        onClick={() => router.push(`/pelicula/${id}`)}
        className="fixed top-4 left-4 z-30 bg-black/60 hover:bg-black/80 transition-colors rounded-full w-9 h-9 flex items-center justify-center text-lg"
        aria-label="Volver a la ficha"
      >
        ←
      </button>

      <div
        className="relative w-full flex-1 bg-black group flex items-center justify-center"
        onMouseMove={() => setMostrarControles(true)}
        onMouseLeave={() => reproduciendo && setMostrarControles(false)}
      >
        {tieneLink ? (
          <>
            <video
              ref={videoRef}
              src={pelicula.link_directo}
              poster={pelicula.caratula || CARATULA_FALLBACK}
              className="w-full h-full max-h-screen"
              onClick={togglePlay}
              onPlay={() => { setReproduciendo(true); registrarHistorial(); }}
              onPause={() => setReproduciendo(false)}
              onTimeUpdate={(e) => setProgreso(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuracion(e.currentTarget.duration)}
              onVolumeChange={(e) => setVolumen(e.currentTarget.volume)}
              autoPlay
            />

            <div
              className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 pointer-events-none ${
                mostrarControles ? "opacity-100" : "opacity-0"
              }`}
            >
              {!reproduciendo && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors pointer-events-auto"
                  aria-label="Reproducir"
                >
                  <PlayIcon />
                </button>
              )}

              <div className="px-4 md:px-8 pb-6 space-y-2 pointer-events-auto">
                <p className="text-sm md:text-base font-semibold mb-1">{pelicula.titulo}</p>
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
