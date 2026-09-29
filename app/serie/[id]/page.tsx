"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Clock, Calendar, Tv, ChevronDown } from "lucide-react";

const CARATULA_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23181818'/%3E%3Crect x='0' y='0' width='300' height='450' fill='none' stroke='%233a3a3a' stroke-width='2'/%3E%3Ctext x='50%25' y='225' font-family='Arial' font-size='18' font-weight='bold' letter-spacing='1' fill='%238a8a8a' text-anchor='middle'%3ESIN IMAGEN%3C/text%3E%3C/svg%3E";

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
  tmdb_id: number | null;
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

export default function SerieDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [serie, setSerie] = useState<Serie | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [temporadaActiva, setTemporadaActiva] = useState(1);
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  useEffect(() => {
    fetch(`/api/series/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("No encontrada");
        return res.json();
      })
      .then((data) => {
        setSerie(data);
        // Activar primera temporada disponible
        const temporadas = [...new Set((data.episodios || []).map((e: Episodio) => e.temporada))];
        if (temporadas.length > 0) setTemporadaActiva(temporadas[0] as number);
        setCargando(false);
      })
      .catch(() => {
        setError("No pudimos encontrar esta serie.");
        setCargando(false);
      });
  }, [id]);

  const temporadasDisponibles = useMemo(() => {
    if (!serie?.episodios) return [];
    return [...new Set(serie.episodios.map((e) => e.temporada))].sort((a, b) => a - b);
  }, [serie]);

  const episodiosTemporada = useMemo(() => {
    if (!serie?.episodios) return [];
    return serie.episodios
      .filter((e) => e.temporada === temporadaActiva)
      .sort((a, b) => a.numero - b.numero);
  }, [serie, temporadaActiva]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-nf-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-nf-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !serie) {
    return (
      <div className="min-h-screen bg-nf-dark flex flex-col items-center justify-center text-center p-4">
        <p className="text-nf-red text-xl font-semibold mb-4">{error || "Serie no encontrada"}</p>
        <Link
          href="/series"
          className="text-nf-cream hover:text-nf-red transition-colors text-sm"
        >
          ← Volver a series
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-nf-dark text-nf-cream pb-16">
      {/* ======================================== */}
      {/* HERO con backdrop */}
      {/* ======================================== */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          {serie.backdrop ? (
            <img
              src={serie.backdrop}
              alt=""
              className="w-full h-full object-cover opacity-30 blur-sm"
            />
          ) : (
            <img
              src={serie.caratula || CARATULA_FALLBACK}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-2xl scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-nf-dark/40 via-nf-dark/80 to-nf-dark" />
        </div>

        <button
          onClick={() => router.push("/series")}
          className="absolute top-6 left-4 md:left-10 z-30 bg-black/60 hover:bg-black/80 rounded-full w-9 h-9 flex items-center justify-center text-white transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="pt-24 md:pt-32 pb-10 md:pb-14 px-4 md:px-10">
          <div className="max-w-6xl mx-auto grid md:grid-cols-[220px,1fr] gap-8 md:gap-12 items-end">
            <div className="w-40 sm:w-56 md:w-full mx-auto md:mx-0">
              <div className="aspect-[2/3] rounded overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={serie.caratula || CARATULA_FALLBACK}
                  alt={serie.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; }}
                />
              </div>
            </div>

            <div className="order-1 md:order-2">
              <p className="text-nf-red text-xs font-extrabold uppercase tracking-[0.2em] mb-2">
                ● Serie · {serie.estado}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl mb-3 text-white">
                {serie.titulo}
              </h1>
              {serie.titulo_original && serie.titulo_original !== serie.titulo && (
                <p className="text-nf-gray-light italic mb-3">
                  {serie.titulo_original}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-nf-gray-light mb-5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {serie.anio}
                </span>
                <span className="w-1 h-1 rounded-full bg-nf-gray" />
                <span className="flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5" /> {serie.num_temporadas} temporadas
                </span>
                <span className="w-1 h-1 rounded-full bg-nf-gray" />
                <span>{serie.genero}</span>
              </div>
              <p className="text-nf-gray-light leading-relaxed mb-7 max-w-2xl line-clamp-4">
                {serie.sinopsis || "Sin sinopsis disponible."}
              </p>

              {episodiosTemporada.length > 0 && (
                <Link
                  href={`/ver-serie/${serie.id}/${temporadaActiva}/1`}
                  className="inline-flex items-center gap-2 bg-nf-red hover:bg-nf-red-hover text-white px-7 py-3 rounded font-extrabold uppercase tracking-wide text-[13px] transition-colors"
                >
                  <Play className="w-4 h-4 fill-white" /> Reproducir T{temporadaActiva} E1
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="sprocket-rule text-nf-gray max-w-6xl mx-auto mb-8" />

      {/* ======================================== */}
      {/* SELECTOR DE TEMPORADA + EPISODIOS */}
      {/* ======================================== */}
      <section className="max-w-6xl mx-auto px-4 md:px-10">
        {temporadasDisponibles.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-2xl text-nf-cream">Episodios</h2>

              {temporadasDisponibles.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setSelectorAbierto((v) => !v)}
                    className="flex items-center gap-2 bg-black/40 border border-white/15 hover:border-white/30 px-4 py-2 rounded text-sm text-nf-cream transition-colors"
                  >
                    Temporada {temporadaActiva}
                    <ChevronDown className={`w-4 h-4 transition-transform ${selectorAbierto ? "rotate-180" : ""}`} />
                  </button>

                  {selectorAbierto && (
                    <div className="absolute right-0 mt-2 w-40 bg-nf-surface border border-white/10 rounded shadow-2xl py-1 z-40 max-h-64 overflow-y-auto">
                      {temporadasDisponibles.map((temp) => (
                        <button
                          key={temp}
                          onClick={() => {
                            setTemporadaActiva(temp);
                            setSelectorAbierto(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                            temp === temporadaActiva
                              ? "bg-nf-red/20 text-nf-red"
                              : "text-nf-cream hover:bg-white/5"
                          }`}
                        >
                          Temporada {temp}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodiosTemporada.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/ver-serie/${serie.id}/${ep.temporada}/${ep.numero}`}
                  className="group bg-nf-surface/60 hover:bg-nf-surface border border-white/5 hover:border-nf-red/50 rounded overflow-hidden transition-all"
                >
                  <div className="relative aspect-video bg-nf-surface overflow-hidden">
                    <img
                      src={ep.caratula || EPISODIO_FALLBACK}
                      alt={ep.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).src = EPISODIO_FALLBACK; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
                      T{ep.temporada} · E{ep.numero}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-nf-red flex items-center justify-center">
                        <Play className="w-5 h-5 fill-white text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-nf-cream text-sm truncate mb-1">
                      {ep.titulo}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-nf-gray mb-2">
                      {ep.duracion && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {ep.duracion} min
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-nf-gray line-clamp-2">
                      {ep.sinopsis}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {temporadasDisponibles.length === 0 && (
          <div className="text-center py-20 text-nf-gray">
            <Tv className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="text-lg text-nf-gray-light">
              Esta serie no tiene episodios cargados
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
