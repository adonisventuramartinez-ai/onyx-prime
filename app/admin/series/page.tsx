"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  CheckCircle,
  AlertCircle,
  Tv,
  Loader2,
} from "lucide-react";

const CARATULA_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23181818'/%3E%3Ctext x='50%25' y='225' font-family='Arial' font-size='18' font-weight='bold' fill='%238a8a8a' text-anchor='middle'%3ESIN IMAGEN%3C/text%3E%3C/svg%3E";

type Serie = {
  id: string;
  tmdb_id: number | null;
  titulo: string;
  titulo_original: string;
  anio: number;
  genero: string;
  sinopsis: string;
  caratula: string;
  backdrop: string;
  num_temporadas: number;
  num_episodios: number;
  estado: string;
  destacada: boolean;
  creado_en: string;
};

export default function AdminSeriesPage() {
  const router = useRouter();
  const [series, setSeries] = useState<Serie[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Serie | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  const cargarSeries = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/series");
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setSeries(data.series || data || []);
    } catch (err) {
      setError("No se pudieron cargar las series");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSeries();
  }, []);

  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return series;
    return series.filter((s) =>
      s.titulo?.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [series, busqueda]);

  const confirmarBorrado = async (id: string) => {
    setBorrando(id);
    try {
      const res = await fetch(`/api/series/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al borrar");
      setSeries((prev) => prev.filter((s) => s.id !== id));
      setMensajeExito("Serie eliminada correctamente");
      setTimeout(() => setMensajeExito(""), 2500);
    } catch (err) {
      setError("No se pudo borrar la serie");
    } finally {
      setBorrando(null);
    }
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/series/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: editando.titulo,
          titulo_original: editando.titulo_original,
          anio: editando.anio,
          genero: editando.genero,
          sinopsis: editando.sinopsis,
          caratula: editando.caratula,
          estado: editando.estado,
          destacada: editando.destacada,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      const actualizada = await res.json();
      setSeries((prev) =>
        prev.map((s) => (s.id === actualizada.id ? actualizada : s))
      );
      setEditando(null);
      setMensajeExito("Serie actualizada");
      setTimeout(() => setMensajeExito(""), 2500);
    } catch (err) {
      setError("No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#141414] text-white p-4 pb-16">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Series<span className="text-purple-400">.</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {series.length} series en el catálogo
            </p>
          </div>

          <Link
            href="/agregar-serie"
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar Serie
          </Link>
        </div>

        <div className="relative mb-6 max-w-md">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar series..."
            className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 pl-10 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
        </div>

        {mensajeExito && (
          <div className="rounded-lg p-3 mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" /> {mensajeExito}
          </div>
        )}

        {error && (
          <div className="rounded-lg p-3 mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {cargando ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Tv className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-4">
              {busqueda ? "No hay resultados" : "Aún no hay series"}
            </p>
            {!busqueda && (
              <Link
                href="/agregar-serie"
                className="text-purple-400 hover:underline text-sm"
              >
                Agregar la primera serie
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map((s) => (
              <div
                key={s.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3 flex gap-4 hover:border-white/20 transition-colors"
              >
                <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                  <img
                    src={s.caratula || CARATULA_FALLBACK}
                    alt={s.titulo}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{s.titulo}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1">
                        <span>{s.anio}</span>
                        <span>·</span>
                        <span>{s.num_temporadas} temporadas</span>
                        <span>·</span>
                        <span>{s.num_episodios} episodios</span>
                        <span>·</span>
                        <span className="text-green-400">{s.estado}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {s.genero}
                      </p>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditando(s)}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                        aria-label="Editar"
                      >
                        <Edit3 className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `¿Borrar "${s.titulo}"? Se borrarán también todos sus episodios.`
                            )
                          ) {
                            confirmarBorrado(s.id);
                          }
                        }}
                        disabled={borrando === s.id}
                        className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                        aria-label="Borrar"
                      >
                        {borrando === s.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================== */}
      {/* Modal de edición */}
      {/* ======================================== */}
      {editando && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setEditando(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold">Editar Serie</h2>
                <button
                  onClick={() => setEditando(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={editando.titulo}
                    onChange={(e) =>
                      setEditando({ ...editando, titulo: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/15 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Año
                    </label>
                    <input
                      type="number"
                      value={editando.anio}
                      onChange={(e) =>
                        setEditando({
                          ...editando,
                          anio: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-black/40 border border-white/15 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={editando.estado}
                      onChange={(e) =>
                        setEditando({ ...editando, estado: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/15 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Género
                  </label>
                  <input
                    type="text"
                    value={editando.genero}
                    onChange={(e) =>
                      setEditando({ ...editando, genero: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/15 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Sinopsis
                  </label>
                  <textarea
                    value={editando.sinopsis}
                    onChange={(e) =>
                      setEditando({ ...editando, sinopsis: e.target.value })
                    }
                    rows={4}
                    className="w-full bg-black/40 border border-white/15 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Carátula (URL)
                  </label>
                  <input
                    type="text"
                    value={editando.caratula}
                    onChange={(e) =>
                      setEditando({ ...editando, caratula: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/15 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="destacada"
                    checked={editando.destacada}
                    onChange={(e) =>
                      setEditando({ ...editando, destacada: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="destacada" className="text-sm text-gray-300">
                    Destacar en la home
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
                <button
                  onClick={() => setEditando(null)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEdicion}
                  disabled={guardando}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
