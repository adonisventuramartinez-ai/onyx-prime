"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Film } from "lucide-react";
import { CARATULA_FALLBACK } from "@/lib/db";

type ItemHistorial = {
  pelicula_id: string;
  visto_en: string;
  peliculas: {
    id: string;
    titulo: string;
    caratula: string;
    anio: number;
    genero: string;
  } | null;
};

export default function HistorialPage() {
  const [items, setItems] = useState<ItemHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/historial")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError("No pudimos cargar tu historial."))
      .finally(() => setCargando(false));
  }, []);

  return (
    <main className="min-h-screen bg-nf-dark px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display italic text-2xl text-nf-cream">Historial</h1>
          <Link href="/" className="text-nf-gray-light hover:text-nf-cream text-sm">
            ← Volver al catálogo
          </Link>
        </div>

        {cargando ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-nf-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-nf-garnet-hover text-center py-16">{error}</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-nf-gray">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-nf-gray-light">Todavía no has visto nada por aquí.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const p = item.peliculas;
              if (!p) return null;
              return (
                <Link
                  key={item.pelicula_id}
                  href={`/pelicula/${p.id}`}
                  className="flex items-center gap-4 bg-nf-surface/60 hover:bg-nf-surface border border-white/5 rounded-sm p-3 transition-colors"
                >
                  <div className="w-12 h-[72px] flex-shrink-0 rounded-sm overflow-hidden bg-nf-surface">
                    <img
                      src={p.caratula || CARATULA_FALLBACK}
                      alt={p.titulo}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-nf-cream truncate">{p.titulo}</p>
                    <p className="text-xs text-nf-gray">{p.anio} · {p.genero}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-nf-gray shrink-0">
                    <Film className="w-3.5 h-3.5" />
                    {new Date(item.visto_en).toLocaleDateString("es", { day: "numeric", month: "short" })}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
