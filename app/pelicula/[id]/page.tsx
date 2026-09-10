"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Play, Plus, Check, Share2 } from "lucide-react";
import type { Pelicula } from "@/lib/db";
import { CARATULA_FALLBACK } from "@/lib/db";

export default function FichaPeliculaPage() {
  const { id } = useParams<{ id: string }>();

  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [relacionadas, setRelacionadas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [enLista, setEnLista] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch(`/api/peliculas/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("No encontrada");
        return res.json();
      })
      .then((data: Pelicula) => {
        setPelicula(data);
        setCargando(false);

        fetch("/api/peliculas")
          .then((r) => r.json())
          .then((d) => {
            const todas: Pelicula[] = Array.isArray(d.peliculas) ? d.peliculas : [];
            setRelacionadas(
              todas.filter((p) => p.genero === data.genero && p.id !== data.id).slice(0, 10)
            );
          })
          .catch(() => {});
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

  const compartir = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: pelicula?.titulo, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-nf-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-nf-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !pelicula) {
    return (
      <div className="min-h-screen bg-nf-dark flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl font-semibold text-nf-cream">{error || "Película no disponible"}</p>
        <Link href="/" className="bg-nf-red hover:bg-nf-red-hover text-white transition-colors px-6 py-2.5 rounded-sm font-semibold">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-nf-dark">
      <Link
        href="/"
        className="fixed top-4 left-4 z-30 bg-black/60 hover:bg-black/80 transition-colors rounded-full w-9 h-9 flex items-center justify-center text-lg text-nf-cream"
        aria-label="Volver"
      >
        ←
      </Link>

      {/* ======================================== */}
      {/* HERO — póster tras un velo de humo, no un banner plano */}
      {/* ======================================== */}
      <section className="relative w-full overflow-hidden pt-20 md:pt-0">
        <div className="md:h-[60vh] md:min-h-[460px] relative">
          <img
            src={pelicula.caratula || CARATULA_FALLBACK}
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; }}
            className="hidden md:block absolute inset-0 w-full h-full object-cover opacity-25 blur-xl scale-110"
          />
          <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-nf-dark via-nf-dark/70 to-nf-dark/40" />

          <div className="relative max-w-5xl mx-auto px-4 md:px-10 md:h-full flex flex-col md:flex-row md:items-end gap-6 md:gap-10 md:pb-10">
            <div className="w-40 sm:w-52 md:w-56 flex-shrink-0 mx-auto md:mx-0 -mt-2 md:mt-0">
              <div className="aspect-[2/3] rounded-sm overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={pelicula.caratula || CARATULA_FALLBACK}
                  alt={pelicula.titulo}
                  onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; }}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="fade-in text-center md:text-left">
              <h1 className="font-display italic text-3xl md:text-5xl leading-[1.05] mb-3 text-nf-cream">
                {pelicula.titulo}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-nf-gray-light mb-5">
                <span>{pelicula.anio}</span>
                <span className="w-1 h-1 rounded-full bg-nf-gray" />
                <span className="border border-white/15 px-2 py-0.5 rounded-sm text-xs">
                  {pelicula.genero}
                </span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Link
                  href={`/ver/${pelicula.id}`}
                  className="flex items-center gap-2 bg-nf-red text-white px-6 py-2.5 rounded-sm font-semibold hover:bg-nf-red-hover transition-colors"
                >
                  <Play className="w-4 h-4 fill-white" /> Reproducir
                </Link>
                <button
                  onClick={toggleMiLista}
                  className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-nf-cream px-5 py-2.5 rounded-sm font-semibold transition-colors"
                >
                  {enLista ? <><Check className="w-4 h-4" /> En mi lista</> : <><Plus className="w-4 h-4" /> Mi lista</>}
                </button>
                <button
                  onClick={compartir}
                  className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-nf-cream px-5 py-2.5 rounded-sm font-semibold transition-colors"
                >
                  <Share2 className="w-4 h-4" /> {copiado ? "¡Copiado!" : "Compartir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sprocket-rule text-nf-gray max-w-5xl mx-auto mt-8" />

      <section className="max-w-5xl mx-auto px-4 md:px-10 py-8 space-y-3">
        <h2 className="font-display italic text-lg text-nf-cream">Sinopsis</h2>
        <p className="text-nf-gray-light leading-relaxed max-w-2xl">
          {pelicula.sinopsis || "Sin descripción disponible."}
        </p>
      </section>

      {relacionadas.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 md:px-10 pb-16">
          <h2 className="font-display italic text-lg text-nf-cream mb-4">Más de {pelicula.genero}</h2>
          <div className="row-scroll flex gap-3 overflow-x-auto pb-4">
            {relacionadas.map((p) => (
              <Link
                key={p.id}
                href={`/pelicula/${p.id}`}
                className="group relative flex-none w-[34vw] sm:w-[20vw] md:w-[15vw] lg:w-[12vw]"
              >
                <div className="rounded-sm overflow-hidden aspect-[2/3] bg-nf-surface border border-white/5 transition-colors duration-300 group-hover:border-nf-red/60">
                  <img
                    src={p.caratula || CARATULA_FALLBACK}
                    alt={p.titulo}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-nf-gray-light mt-1.5 line-clamp-1">{p.titulo}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
