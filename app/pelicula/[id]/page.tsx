"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Pelicula } from "@/lib/db";
import { CARATULA_FALLBACK } from "@/lib/db";

export default function FichaPeliculaPage() {
  const { id } = useParams<{ id: string }>();

  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [relacionadas, setRelacionadas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [enLista, setEnLista] = useState(false);

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
      alert("Enlace copiado al portapapeles");
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
        <p className="text-xl font-semibold">{error || "Película no disponible"}</p>
        <Link href="/" className="bg-nf-red hover:bg-nf-red-hover transition-colors px-6 py-2.5 rounded font-semibold">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-nf-dark">
      <Link
        href="/"
        className="fixed top-4 left-4 z-30 bg-black/60 hover:bg-black/80 transition-colors rounded-full w-9 h-9 flex items-center justify-center text-lg"
        aria-label="Volver"
      >
        ←
      </Link>

      <section className="relative h-[70vw] max-h-[70vh] min-h-[380px] w-full overflow-hidden">
        <img
          src={pelicula.caratula || CARATULA_FALLBACK}
          alt={pelicula.titulo}
          onError={(e) => {
            (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
          }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nf-dark via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-12 pb-8 max-w-2xl fade-in">
          <h1 className="text-3xl md:text-5xl font-black mb-3 drop-shadow-lg leading-tight">
            {pelicula.titulo}
          </h1>
          <div className="flex items-center gap-3 text-sm md:text-base text-gray-200 mb-4">
            <span>{pelicula.anio}</span>
            <span className="border border-nf-gray-light px-1.5 text-xs rounded">
              {pelicula.genero}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/ver/${pelicula.id}`}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded font-semibold hover:bg-white/80 transition-colors"
            >
              <PlayIcon /> Reproducir
            </Link>
            <button
              onClick={toggleMiLista}
              className="flex items-center gap-2 bg-gray-500/40 text-white px-6 py-2.5 rounded font-semibold hover:bg-gray-500/60 transition-colors backdrop-blur-sm"
            >
              {enLista ? "✓ En mi lista" : "+ Mi lista"}
            </button>
            <button
              onClick={compartir}
              className="flex items-center gap-2 bg-gray-500/40 text-white px-6 py-2.5 rounded font-semibold hover:bg-gray-500/60 transition-colors backdrop-blur-sm"
            >
              Compartir
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-12 py-8 max-w-3xl space-y-4">
        <h2 className="text-lg font-semibold">Sinopsis</h2>
        <p className="text-gray-200 leading-relaxed">
          {pelicula.sinopsis || "Sin descripción disponible."}
        </p>
      </section>

      {relacionadas.length > 0 && (
        <section className="px-4 md:px-12 pb-16">
          <h2 className="text-lg font-semibold mb-3">Más de {pelicula.genero}</h2>
          <div className="row-scroll flex gap-2 overflow-x-auto pb-4">
            {relacionadas.map((p) => (
              <Link
                key={p.id}
                href={`/pelicula/${p.id}`}
                className="group relative flex-none w-[38vw] sm:w-[24vw] md:w-[16vw] lg:w-[13vw] transition-transform duration-300 hover:z-20 hover:scale-105"
              >
                <div className="rounded overflow-hidden aspect-[2/3] bg-neutral-800 shadow-lg">
                  <img
                    src={p.caratula || CARATULA_FALLBACK}
                    alt={p.titulo}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
                    }}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-75"
                  />
                </div>
                <p className="text-xs text-nf-gray-light mt-1 line-clamp-1">{p.titulo}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
