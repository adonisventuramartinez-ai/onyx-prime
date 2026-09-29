"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, List, X } from "lucide-react";

const EPISODIO_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%23181818'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%23555' text-anchor='middle' dominant-baseline='middle'%3ESIN IMAGEN%3C/text%3E%3C/svg%3E";

type Episodio = {
  id: string;
  serie_id: string;
  tmdb_id: number | null;
  temporada: number;
  numero: number;
  titulo: string;
  sinopsis: string;
  duracion: number | null;
  caratula: string;
  link_directo: string;
};

type Serie = {
  id: string;
  titulo: string;
  titulo_original: string;
  anio: number | string;
  genero: string;
  sinopsis: string;
  caratula: string;
  backdrop: string;
  num_temporadas: number;
  num_episodios: number;
  estado: string;
  episodios: Episodio[];
};

export default function VerSeriePage() {
  const params = useParams<{ id: string; temp: string; ep: string }>();
  const router = useRouter();

  const id = params?.id;
  const tempActual = parseInt(params?.temp || "1");
  const epActual = parseInt(params?.ep || "1");

  const [serie, setSerie] = useState<Serie | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [reproduciendo, setReproduciendo] = useState(false);
  const [listaAbierta, setListaAbierta] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/series/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("No encontrada");
        return res.json();
      })
      .then((data) => {
        setSerie(data);
        setCargando(false);
      })
      .catch(() => {
        setError("No pudimos cargar la serie.");
        setCargando(false);
      });
  }, [id]);

  // Resetear reproducción al cambiar de episodio
  useEffect(() => {
    setReproduciendo(false);
    setListaAbierta(false);
  }, [tempActual, epActual]);

  const episodiosOrdenados = useMemo(() => {
    if (!serie?.episodios) return [];
    return [...serie.episodios].sort((a, b) => {
      if (a.temporada !== b.temporada) return a.temporada - b.temporada;
      return a.numero - b.numero;
    });
  }, [serie]);

  const episodioActual = useMemo(() => {
    return episodiosOrdenados.find(
      (e) => e.temporada === tempActual && e.numero === epActual
    );
  }, [episodiosOrdenados, tempActual, epActual]);

  const indiceActual = useMemo(() => {
    return episodiosOrdenados.findIndex(
      (e) => e.temporada === tempActual && e.numero === epActual
    );
  }, [episodiosOrdenados, tempActual, epActual]);

  const anterior = indiceActual > 0 ? episodiosOrdenados[indiceActual - 1] : null;
  const siguiente =
    indiceActual >= 0 && indiceActual < episodiosOrdenados.length - 1
      ? episodiosOrdenados[indiceActual + 1]
      : null;

  const temporadasDisponibles = useMemo(() => {
    if (!serie?.episodios) return [];
    return [...new Set(serie.episodios.map((e) => e.temporada))].sort((a, b) => a - b);
  }, [serie]);

  const irA = (ep: Episodio) => {
    router.push(`/ver-serie/${serie?.id}/${ep.temporada}/${ep.numero}`);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-nf-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !serie || !episodioActual) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4">
        <p className="text-nf-red text-xl font-semibold mb-4">
          {error || "Episodio no encontrado"}
        </p>
        <Link
          href={serie ? `/serie/${serie.id}` : "/series"}
          className="text-nf-cream hover:text-nf-red transition-colors text-sm"
        >
          ← Volver a la serie
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* ======================================== */}
      {/* Barra superior */}
      {/* ======================================== */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/5 z-30">
        <button
          onClick={() => router.push(`/serie/${serie.id}`)}
          className="flex items-center gap-2 text-nf-cream hover:text-nf-red transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{serie.titulo}</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-nf-gray">
            T{episodioActual.temporada} · E{episodioActual.numero}
          </span>
          <button
            onClick={() => setListaAbierta((v) => !v)}
            className="flex items-center gap-1.5 text-nf-cream hover:text-nf-red transition-colors text-sm border border-white/15 hover:border-nf-red/50 px-3 py-1.5 rounded"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Episodios</span>
          </button>
        </div>
      </div>

      {/* ======================================== */}
      {/* Reproductor */}
      {/* ======================================== */}
      <div className="relative w-full flex-1 bg-black flex items-center justify-center min-h-[50vh]">
        {!reproduciendo ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={episodioActual.caratula || serie.backdrop || serie.caratula}
              alt={episodioActual.titulo}
              className="w-full h-full object-cover opacity-30"
              onError={(e) => { (e.target as HTMLImageElement).src = EPISODIO_FALLBACK; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />

            <button
              onClick={() => setReproduciendo(true)}
              className="absolute inset-0 m-auto w-20 h-20 md:w-24 md:h-24 bg-nf-red hover:bg-nf-red-hover rounded-full flex items-center justify-center transition-all hover:scale-110 z-20"
              aria-label="Reproducir"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <div className="absolute bottom-8 md:bottom-12 left-0 right-0 text-center z-10 px-4">
              <p className="text-nf-red text-xs font-extrabold uppercase tracking-[0.2em] mb-2">
                T{episodioActual.temporada} · E{episodioActual.numero}
              </p>
              <h1 className="text-2xl md:text-4xl font-black text-white mb-2">
                {episodioActual.titulo}
              </h1>
              {episodioActual.duracion && (
                <p className="text-gray-400 text-sm">
                  {episodioActual.duracion} min
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video max-h-screen">
            <iframe
              src={episodioActual.link_directo}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              frameBorder={0}
              title={episodioActual.titulo}
            />
          </div>
        )}
      </div>

      {/* ======================================== */}
      {/* Info + Navegación */}
      {/* ======================================== */}
      <div className="bg-nf-dark border-t border-white/5 px-4 md:px-10 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <h2 className="font-display text-xl md:text-2xl text-white mb-1">
                {episodioActual.titulo}
              </h2>
              <p className="text-nf-gray-light text-sm line-clamp-2">
                {episodioActual.sinopsis}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => anterior && irA(anterior)}
                disabled={!anterior}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-nf-cream px-4 py-2 rounded text-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                onClick={() => siguiente && irA(siguiente)}
                disabled={!siguiente}
                className="flex items-center gap-1.5 bg-nf-red hover:bg-nf-red-hover disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* Panel lateral de episodios */}
      {/* ======================================== */}
      {listaAbierta && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setListaAbierta(false)}
          />
          <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-nf-dark border-l border-white/10 z-50 flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <h3 className="font-display text-lg text-white">Episodios</h3>
              <button
                onClick={() => setListaAbierta(false)}
                className="text-nf-gray hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {temporadasDisponibles.map((temp) => {
                const eps = episodiosOrdenados.filter((e) => e.temporada === temp);
                return (
                  <div key={temp} className="border-b border-white/5">
                    <div className="px-4 py-3 bg-black/30 sticky top-0 z-10">
                      <p className="text-xs text-nf-gray uppercase tracking-wide font-bold">
                        Temporada {temp}
                      </p>
                    </div>
                    {eps.map((ep) => {
                      const activo =
                        ep.temporada === tempActual && ep.numero === epActual;
                      return (
                        <button
                          key={ep.id}
                          onClick={() => irA(ep)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                            activo
                              ? "bg-nf-red/20 border-l-4 border-nf-red"
                              : "hover:bg-white/5 border-l-4 border-transparent"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                              activo ? "bg-nf-red text-white" : "bg-white/10 text-nf-gray"
                            }`}
                          >
                            {ep.numero}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium truncate ${
                                activo ? "text-white" : "text-nf-cream"
                              }`}
                            >
                              {ep.titulo}
                            </p>
                            {ep.duracion && (
                              <p className="text-xs text-nf-gray">
                                {ep.duracion} min
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </aside>
        </>
      )}
    </main>
  );
}
