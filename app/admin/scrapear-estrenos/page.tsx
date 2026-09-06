"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, CheckCircle, AlertCircle, Calendar } from "lucide-react";

export default function ScrapearEstrenosPage() {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState("");

  const iniciarScraping = async () => {
    setCargando(true);
    setError("");
    setResultado(null);

    try {
      const res = await fetch("/api/scrapear-estrenos");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al scrapear");
        return;
      }

      setResultado(data);
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-nf-dark px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-nf-gray-light hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </Link>

        <h1 className="text-2xl font-bold mb-2">
          Scrapear <span className="text-purple-400">Estrenos 2026</span>
        </h1>
        <p className="text-nf-gray-light text-sm mb-6">
          Buscará automáticamente todas las películas estrenadas desde el 1 de enero de 2026 hasta hoy.
          Las encontrará en Cinecalidad, limpiará los links y las guardará en tu catálogo.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm font-semibold">Rango de fechas</p>
              <p className="text-xs text-gray-400">1 de enero de 2026 → Hoy</p>
            </div>
          </div>

          <button
            onClick={iniciarScraping}
            disabled={cargando}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {cargando ? "Buscando películas..." : "Buscar estrenos 2026"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {resultado && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold text-green-400">Scraping completado</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-white">{resultado.total_encontradas}</p>
                <p className="text-xs text-gray-400">Encontradas en TMDB</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{resultado.nuevas}</p>
                <p className="text-xs text-gray-400">Nuevas agregadas</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{resultado.ya_existentes}</p>
                <p className="text-xs text-gray-400">Ya existentes</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{resultado.errores || 0}</p>
                <p className="text-xs text-gray-400">Errores</p>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p>📅 Desde: {resultado.fecha_inicio}</p>
              <p>📅 Hasta: {resultado.fecha_fin}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
