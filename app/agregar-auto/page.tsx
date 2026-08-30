"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Sparkles, Loader2, ExternalLink, CheckCircle, AlertCircle, Link as LinkIcon } from "lucide-react";

interface PeliculaEncontrada {
  titulo: string;
  anio: string;
  genero: string;
  sinopsis: string;
  caratula: string;
  link_directo: string;
  fuente: string;
}

export default function AgregarAutoPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [link, setLink] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<PeliculaEncontrada | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [usarLink, setUsarLink] = useState(false);

  const buscarPelicula = async () => {
    setCargando(true);
    setError("");
    setResultado(null);
    setGuardado(false);

    try {
      let url = `/api/buscar-cinecalidad?`;
      
      if (usarLink && link.trim()) {
        url += `link=${encodeURIComponent(link.trim())}`;
      } else if (nombre.trim()) {
        url += `nombre=${encodeURIComponent(nombre.trim())}`;
      } else {
        setError("Escribe el nombre o pega el link de la película");
        setCargando(false);
        return;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se encontró la película");
        return;
      }

      if (data.pelicula) {
        setResultado(data.pelicula);
        if (!data.pelicula.link_directo) {
          setError("⚠️ No se encontró link directo. Se usará la página de detalle.");
        }
      } else {
        setError("No se encontró la película");
      }
    } catch (err) {
      setError("Error al buscar la película");
    } finally {
      setCargando(false);
    }
  };

  const guardarPelicula = async () => {
    if (!resultado) return;

    setGuardando(true);
    try {
      const res = await fetch("/api/peliculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: resultado.titulo,
          anio: resultado.anio,
          genero: resultado.genero,
          sinopsis: resultado.sinopsis,
          caratula: resultado.caratula,
          link_directo: resultado.link_directo || link || "",
          fuente: "cinecalidad",
        }),
      });

      if (res.ok) {
        setGuardado(true);
        setTimeout(() => router.push("/admin"), 1500);
      } else {
        setError("Error al guardar la película");
      }
    } catch (err) {
      setError("Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Volver al panel
        </Link>

        <h1 className="text-3xl font-bold mb-2">
          <span className="text-white">Buscar</span>
          <span className="text-[#d4af37]"> Automático</span>
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Escribe el nombre de la película o pega el link de Cinecalidad para obtener carátula, sinopsis, año y link directo
        </p>

        {/* Toggle */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setUsarLink(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              !usarLink ? "bg-[#d4af37] text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            🔍 Buscar por nombre
          </button>
          <button
            onClick={() => setUsarLink(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              usarLink ? "bg-[#d4af37] text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            🔗 Pegar link
          </button>
        </div>

        {/* Input y botón */}
        <div className="flex gap-3 mb-6">
          {usarLink ? (
            <input
              type="text"
              placeholder="https://www.cinecalidad.am/ver-pelicula/rent-free/"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscarPelicula()}
              className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-[#d4af37] focus:outline-none transition-colors text-white placeholder-gray-500"
            />
          ) : (
            <input
              type="text"
              placeholder="Ej: Dune, Oppenheimer, Barbie..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscarPelicula()}
              className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:border-[#d4af37] focus:outline-none transition-colors text-white placeholder-gray-500"
            />
          )}
          <button
            onClick={buscarPelicula}
            disabled={cargando}
            className="bg-[#d4af37] hover:bg-[#c19b2e] text-black px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Buscar
          </button>
        </div>

        {error && (
          <div className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${
            error.includes("⚠️") 
              ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400" 
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {cargando && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[#d4af37] mx-auto mb-4" />
            <p className="text-gray-400">Buscando en Cinecalidad...</p>
          </div>
        )}

        {resultado && !cargando && (
          <div className={`bg-gray-900/50 border rounded-2xl p-6 ${guardado ? 'border-green-500/50' : 'border-gray-700'}`}>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-32 flex-shrink-0 mx-auto sm:mx-0">
                {resultado.caratula ? (
                  <img
                    src={resultado.caratula}
                    alt={resultado.titulo}
                    className="w-full rounded-lg shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                    }}
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{resultado.titulo}</h2>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-sm text-gray-400">{resultado.anio}</span>
                      <span className="text-sm text-gray-400">{resultado.genero}</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                        📽️ Cinecalidad
                      </span>
                    </div>
                  </div>
                  {guardado && (
                    <span className="flex items-center gap-1 text-green-400 text-sm bg-green-500/20 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" /> Guardado
                    </span>
                  )}
                </div>

                <p className="text-gray-300 text-sm mt-3 line-clamp-3">{resultado.sinopsis}</p>

                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">🎬 Link directo:</p>
                  {resultado.link_directo ? (
                    <a
                      href={resultado.link_directo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#d4af37] text-sm hover:underline flex items-center gap-1 truncate"
                    >
                      {resultado.link_directo}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <p className="text-yellow-400 text-sm">⚠️ No se encontró link directo. Se usará la página de detalle.</p>
                  )}
                </div>

                {!guardado && (
                  <button
                    onClick={guardarPelicula}
                    disabled={guardando}
                    className="mt-4 bg-[#d4af37] hover:bg-[#c19b2e] text-black px-6 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {guardando ? "Guardando..." : "Guardar en catálogo"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
