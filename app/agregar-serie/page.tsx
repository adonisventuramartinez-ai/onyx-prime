"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Tv,
  ListVideo,
} from "lucide-react";

interface EpisodioEncontrado {
  tmdb_id: number;
  temporada: number;
  numero: number;
  titulo: string;
  sinopsis: string;
  duracion: number | null;
  caratula: string;
  link_directo: string;
}

interface SerieEncontrada {
  tmdb_id: number;
  titulo: string;
  titulo_original: string;
  anio: string;
  genero: string;
  sinopsis: string;
  caratula: string;
  backdrop: string;
  num_temporadas: number;
  num_episodios: number;
  estado: string;
  episodios: EpisodioEncontrado[];
}

export default function AgregarSeriePage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<SerieEncontrada | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const buscarSerie = async () => {
    if (!nombre.trim()) {
      setError("Escribe el nombre de la serie");
      return;
    }

    setCargando(true);
    setError("");
    setResultado(null);
    setGuardado(false);

    try {
      const res = await fetch(
        `/api/buscar-serie?nombre=${encodeURIComponent(nombre)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se encontró la serie");
        return;
      }

      setResultado(data.serie);
    } catch (err) {
      setError("Error al buscar la serie");
    } finally {
      setCargando(false);
    }
  };

  const guardarSerie = async () => {
    if (!resultado) return;

    setGuardando(true);
    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: resultado.tmdb_id,
          titulo: resultado.titulo,
          titulo_original: resultado.titulo_original,
          anio: resultado.anio,
          genero: resultado.genero,
          sinopsis: resultado.sinopsis,
          caratula: resultado.caratula,
          backdrop: resultado.backdrop,
          num_temporadas: resultado.num_temporadas,
          num_episodios: resultado.num_episodios,
          estado: resultado.estado,
          episodios: resultado.episodios,
        }),
      });

      if (res.ok) {
        setGuardado(true);
        setTimeout(() => router.push("/admin/series"), 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Error al guardar");
      }
    } catch (err) {
      setError("Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#141414] text-white p-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin/series"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al panel de series
        </Link>

        <h1 className="text-2xl font-bold mb-2">
          Agregar <span className="text-purple-400">Serie Automática</span>
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Escribe el nombre de la serie. El sistema buscará en TMDB, traerá{" "}
          <strong className="text-white">todas las temporadas y episodios</strong>{" "}
          y generará los links automáticamente.
        </p>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Ej: Breaking Bad, The Office, Dark..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscarSerie()}
            className="flex-1 bg-white/5 border border-white/15 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
          />
          <button
            onClick={buscarSerie}
            disabled={cargando}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {cargando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Buscar
          </button>
        </div>

        {error && (
          <div className="rounded-xl p-4 mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {cargando && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-400">Buscando en TMDB...</p>
            <p className="text-gray-500 text-xs mt-2">
              Esto puede tardar unos segundos si la serie tiene muchas temporadas
            </p>
          </div>
        )}

        {resultado && !cargando && (
          <div
            className={`bg-white/5 border rounded-2xl p-6 ${
              guardado ? "border-green-500/50" : "border-white/10"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-32 flex-shrink-0 mx-auto sm:mx-0">
                {resultado.caratula ? (
                  <img
                    src={resultado.caratula}
                    alt={resultado.titulo}
                    className="w-full rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold">{resultado.titulo}</h2>
                    {resultado.titulo_original &&
                      resultado.titulo_original !== resultado.titulo && (
                        <p className="text-gray-400 text-sm italic">
                          {resultado.titulo_original}
                        </p>
                      )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-sm text-gray-400">
                        {resultado.anio}
                      </span>
                      <span className="text-sm text-gray-400">
                        {resultado.genero}
                      </span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                        {resultado.estado}
                      </span>
                    </div>
                  </div>
                  {guardado && (
                    <span className="flex items-center gap-1 text-green-400 text-sm bg-green-500/20 px-3 py-1 rounded-full flex-shrink-0">
                      <CheckCircle className="w-4 h-4" /> Guardado
                    </span>
                  )}
                </div>

                <p className="text-gray-300 text-sm mt-3 line-clamp-3">
                  {resultado.sinopsis}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-black/30 rounded-lg p-3 flex items-center gap-2">
                    <Tv className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-500">Temporadas</p>
                      <p className="text-sm font-bold">
                        {resultado.num_temporadas}
                      </p>
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 flex items-center gap-2">
                    <ListVideo className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-500">Episodios</p>
                      <p className="text-sm font-bold">
                        {resultado.num_episodios}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500 bg-black/30 rounded p-2">
                  🎬 TMDB ID: <strong className="text-gray-300">{resultado.tmdb_id}</strong> ·
                  Los {resultado.num_episodios} episodios se guardarán con su link individual.
                </div>

                {!guardado && (
                  <button
                    onClick={guardarSerie}
                    disabled={guardando}
                    className="mt-5 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {guardando ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {guardando
                      ? `Guardando ${resultado.num_episodios} episodios...`
                      : "Guardar serie completa"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
