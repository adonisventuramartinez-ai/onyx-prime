"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function AgregarPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    titulo: "",
    anio: new Date().getFullYear(),
    genero: "Acción",
    sinopsis: "",
    caratula: "",
    link_directo: "",
    destacada: false,
  });

  const generos = [
    "Acción", "Comedia", "Drama", "Terror", "Ciencia Ficción",
    "Romance", "Animación", "Documental", "Serie", "Telenovela",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    try {
      const res = await fetch("/api/peliculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fuente: "manual" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#141414] text-white p-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </Link>

        <h1 className="text-2xl font-bold mb-6">
          Agregar <span className="text-[#E50914]">Película</span>
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Título *</label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: El origen"
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 focus:border-[#E50914] focus:outline-none text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Año</label>
              <input
                type="number"
                value={form.anio}
                onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 focus:border-[#E50914] focus:outline-none text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Género</label>
              <select
                value={form.genero}
                onChange={(e) => setForm({ ...form, genero: e.target.value })}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 focus:border-[#E50914] focus:outline-none text-white"
              >
                {generos.map((g) => (
                  <option key={g} value={g} className="bg-[#141414]">{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Sinopsis</label>
            <textarea
              value={form.sinopsis}
              onChange={(e) => setForm({ ...form, sinopsis: e.target.value })}
              rows={3}
              placeholder="De qué trata la película..."
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 focus:border-[#E50914] focus:outline-none text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">URL de la carátula</label>
            <input
              type="url"
              value={form.caratula}
              onChange={(e) => setForm({ ...form, caratula: e.target.value })}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 focus:border-[#E50914] focus:outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Link de reproducción</label>
            <input
              type="url"
              value={form.link_directo}
              onChange={(e) => setForm({ ...form, link_directo: e.target.value })}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 focus:border-[#E50914] focus:outline-none text-white"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={form.destacada}
              onChange={(e) => setForm({ ...form, destacada: e.target.checked })}
              className="accent-[#E50914]"
            />
            Marcar como destacada en el home
          </label>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#E50914] hover:bg-[#b20710] text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {cargando ? "Guardando..." : "Guardar película"}
          </button>
        </form>
      </div>
    </main>
  );
}
