"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, CheckCircle, AlertCircle, Calendar } from "lucide-react";

interface Tarea {
  id: number;
  estado: "pendiente" | "procesando" | "completado" | "error";
  fecha_inicio: string;
  fecha_fin: string | null;
  total_encontradas: number;
  nuevas: number;
  ya_existentes: number;
  errores: number;
  mensaje: string;
}

export default function ScrapearEstrenosPage() {
  const [cargando, setCargando] = useState(false);
  const [tareaActual, setTareaActual] = useState<Tarea | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarEstado();
    const interval = setInterval(cargarEstado, 5000);
    return () => clearInterval(interval);
  }, []);

  const cargarEstado = async () => {
    try {
      const res = await fetch("/api/scrapear-estrenos/estado");
      const data = await res.json();
      if (data.tarea_actual) setTareaActual(data.tarea_actual);
    } catch {}
  };

  const iniciarScraping = async () => {
    setCargando(true);
    setError("");

    try {
      const res = await fetch("/api/scrapear-estrenos");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar");
        return;
      }

      await cargarEstado();
    } catch (err) {
      setError("Error al conectar");
    } finally {
      setCargando(false);
    }
  };

  const estaProcesando =
    tareaActual?.estado === "procesando" || tareaActual?.estado === "pendiente";

  return (
    <main className="min-h-screen bg-[#141414] text-white p-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </Link>

        <h1 className="text-2xl font-bold mb-2">
          Scrapear <span className="text-purple-400">Estrenos 2026</span>
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Busca en TMDB todos los estrenos de 2026, encuentra su link en Cinecalidad/CineHDPlus y extrae el link directo de DoodStream.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm font-semibold">Rango</p>
              <p className="text-xs text-gray-400">1 enero 2026 → Hoy</p>
            </div>
          </div>

          <button
            onClick={iniciarScraping}
            disabled={cargando || estaProcesando}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {cargando ? "Iniciando..." : "Buscar estrenos 2026"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 text-red-400 mb-6">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {tareaActual && (
          <div
            className={`rounded-lg p-6 ${
              tareaActual.estado === "completado"
                ? "bg-green-500/10 border border-green-500/30"
                : tareaActual.estado === "error"
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-yellow-500/10 border border-yellow-500/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {tareaActual.estado === "completado" && <CheckCircle className="w-6 h-6 text-green-400" />}
              {tareaActual.estado === "procesando" && <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />}
              {tareaActual.estado === "pendiente" && <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />}
              {tareaActual.estado === "error" && <AlertCircle className="w-6 h-6 text-red-400" />}
              <div>
                <h3 className="text-lg font-semibold">Tarea #{tareaActual.id} - {tareaActual.estado}</h3>
                <p className="text-sm text-gray-400">
                  Iniciada: {new Date(tareaActual.fecha_inicio).toLocaleString()}
                </p>
              </div>
            </div>

            {tareaActual.mensaje && (
              <p className="text-sm text-gray-300 mb-4">{tareaActual.mensaje}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{tareaActual.total_encontradas || 0}</p>
                <p className="text-xs text-gray-400">Encontradas</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{tareaActual.nuevas || 0}</p>
                <p className="text-xs text-gray-400">Nuevas</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{tareaActual.ya_existentes || 0}</p>
                <p className="text-xs text-gray-400">Existentes</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{tareaActual.errores || 0}</p>
                <p className="text-xs text-gray-400">Errores</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
