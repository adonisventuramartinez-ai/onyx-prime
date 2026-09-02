"use client";

import { useState } from "react";
import { CARATULA_FALLBACK } from "@/lib/db";
import type { Pelicula } from "@/lib/db";

const GENEROS = [
  "Acción", "Comedia", "Drama", "Terror", "Ciencia ficción",
  "Romance", "Animación", "Documental", "Serie", "Telenovela",
];

export type DatosPelicula = {
  titulo: string;
  anio: number;
  genero: string;
  sinopsis: string;
  caratula: string;
  link_directo: string;
  destacada: boolean;
};

export default function PeliculaForm({
  inicial,
  onGuardar,
  textoBoton = "Guardar película",
}: {
  inicial?: Partial<Pelicula>;
  onGuardar: (datos: DatosPelicula) => Promise<void>;
  textoBoton?: string;
}) {
  const [form, setForm] = useState<DatosPelicula>({
    titulo: inicial?.titulo ?? "",
    anio: inicial?.anio ?? new Date().getFullYear(),
    genero: inicial?.genero ?? GENEROS[0],
    sinopsis: inicial?.sinopsis ?? "",
    caratula: inicial?.caratula ?? "",
    link_directo: inicial?.link_directo ?? "",
    destacada: inicial?.destacada ?? false,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const actualizar = <K extends keyof DatosPelicula>(campo: K, valor: DatosPelicula[K]) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.titulo.trim()) {
      setError("El título es obligatorio");
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(form);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr,220px] gap-8">
      <form onSubmit={submit} className="space-y-5">
        <Campo label="Título *">
          <input
            value={form.titulo}
            onChange={(e) => actualizar("titulo", e.target.value)}
            className="input"
            placeholder="Ej: El origen"
          />
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Año">
            <input
              type="number"
              value={form.anio}
              onChange={(e) => actualizar("anio", Number(e.target.value))}
              className="input"
            />
          </Campo>
          <Campo label="Género">
            <select
              value={form.genero}
              onChange={(e) => actualizar("genero", e.target.value)}
              className="input"
            >
              {GENEROS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo label="Sinopsis">
          <textarea
            value={form.sinopsis}
            onChange={(e) => actualizar("sinopsis", e.target.value)}
            className="input min-h-[100px] resize-none"
            placeholder="De qué trata la película..."
          />
        </Campo>

        <Campo label="URL de la carátula">
          <input
            value={form.caratula}
            onChange={(e) => actualizar("caratula", e.target.value)}
            className="input"
            placeholder="https://..."
          />
        </Campo>

        <Campo label="Link directo de reproducción (MP4, M3U8...)">
          <input
            value={form.link_directo}
            onChange={(e) => actualizar("link_directo", e.target.value)}
            className="input"
            placeholder="https://..."
          />
        </Campo>

        <label className="flex items-center gap-2 text-sm text-nf-gray-light">
          <input
            type="checkbox"
            checked={form.destacada}
            onChange={(e) => actualizar("destacada", e.target.checked)}
            className="accent-nf-red"
          />
          Mostrar como destacada en el hero de la página principal
        </label>

        {error && <p className="text-nf-red text-sm">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="w-full md:w-auto bg-nf-red hover:bg-nf-red-hover transition-colors px-8 py-3 rounded font-semibold disabled:opacity-50"
        >
          {guardando ? "Guardando..." : textoBoton}
        </button>
      </form>

      <div>
        <p className="text-xs text-nf-gray-light mb-2 uppercase tracking-wide">Vista previa</p>
        <div className="aspect-[2/3] rounded overflow-hidden bg-neutral-800 border border-white/10">
          <img
            src={form.caratula || CARATULA_FALLBACK}
            onError={(e) => {
              (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
            }}
            alt="Vista previa"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          padding: 10px 14px;
          color: white;
          outline: none;
          transition: border-color 0.2s;
        }
        .input:focus {
          border-color: white;
        }
      `}</style>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-nf-gray-light">{label}</span>
      {children}
    </label>
  );
}
