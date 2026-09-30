"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { buildProxyUrl } from "aetherly-stream-proxy";

interface Props {
  tmdbId: number;
  tipo: "movie" | "tv";
  temporada?: number;
  episodio?: number;
  poster?: string;
}

export default function VideoPlayer({ tmdbId, tipo, temporada, episodio, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let hls: Hls | null = null;

    const init = async () => {
      try {
        const params = new URLSearchParams({ tmdbId: String(tmdbId), tipo });
        if (tipo === "tv" && temporada && episodio) {
          params.set("temporada", String(temporada));
          params.set("episodio", String(episodio));
        }

        const res = await fetch(`/api/stream?${params}`);
        const data = await res.json();

        if (!res.ok || !data.hlsUrl) {
          setError(data.error || "No se pudo cargar el video");
          setCargando(false);
          return;
        }

        const urlProxy = buildProxyUrl(data.hlsUrl, {
          Referer: "https://cloudnestra.com/",
          "User-Agent": "Mozilla/5.0",
        });

        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(urlProxy);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setCargando(false);
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal) {
              console.error("Error HLS:", data);
              setError("Error al reproducir el video");
              setCargando(false);
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = urlProxy;
          video.addEventListener("loadedmetadata", () => {
            setCargando(false);
            video.play().catch(() => {});
          });
        } else {
          setError("Tu navegador no soporta este formato");
          setCargando(false);
        }
      } catch (err) {
        console.error("[VideoPlayer] Error:", err);
        setError("Error al cargar el video");
        setCargando(false);
      }
    };

    init();

    return () => {
      if (hls) hls.destroy();
    };
  }, [tmdbId, tipo, temporada, episodio]);

  return (
    <div className="relative w-full h-full bg-black">
      {cargando && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 text-center p-4">
          <div>
            <p className="text-red-500 text-lg font-semibold mb-2">{error}</p>
            <p className="text-gray-400 text-sm">Puede que la fuente esté caída. Intenta con otra película o serie.</p>
          </div>
        </div>
      )}

      <video ref={videoRef} controls poster={poster} className="w-full h-full" playsInline />
    </div>
  );
}
