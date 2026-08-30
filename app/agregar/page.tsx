"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function AgregarPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    anio: "",
    genero: "",
    sinopsis: "",
    caratula: "",
    link_directo: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      const res = await fetch("/api/peliculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fuente: "manual" }),
      });
      if (res.ok) {
        router.push("/admin");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Volver al panel
        </Link>

        <h1 className="text-3xl font-bold mb-2">
          <span className="text-white">Agregar</span>
          <span className="text-[#d4af37]"> Película</span>
        </h1>
        <p className="text-gray-400 text-sm mb-6">Añade una nueva película al catálogo</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Título *"
            required
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-[#d4af37] focus:outline-none transition-colors text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Año"
              value={form.anio}
              onChange={(e) => setForm({ ...form, anio: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-[#d4af37] focus:outline-none transition-colors text-white"
            />
            <input
              type="text"
              placeholder="Género"
              value={form.genero}
              onChange={(e) => setForm({ ...form, genero: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-[#d4af37] focus:outline-none transition-colors text-white"
            />
          </div>
          <textarea
            placeholder="Sinopsis"
            rows={3}
            value={form.sinopsis}
            onChange={(e) => setForm({ ...form, sinopsis: e.target.value })}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-[#d4af37] focus:outline-none transition-colors text-white resize-none"
          />
          <input
            type="url"
            placeholder="URL de la carátula"
            value={form.caratula}
            onChange={(e) => setForm({ ...form, caratula: e.target.value })}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-[#d4af37] focus:outline-none transition-colors text-white"
          />
          <input
            type="url"
            placeholder="Link directo para reproducir *"
            required
            value={form.link_directo}
            onChange={(e) => setForm({ ...form, link_directo: e.target.value })}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-[#d4af37] focus:outline-none transition-colors text-white"
          />

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#d4af37] hover:bg-[#c19b2e] text-black py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {cargando ? "Guardando..." : "Guardar Película"}
          </button>
        </form>
      </div>
    </div>
  );
}
