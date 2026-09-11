"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, Copy, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

export default function LimpiadorPage() {
  const [linkInput, setLinkInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<{ link_directo: string; headers: Record<string, string> } | null>(null);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  const limpiarLink = async () => {
    if (!linkInput.trim()) {
      setError("Pega un link de DoodStream");
      return;
    }

    setCargando(true);
    setError("");
    setResultado(null);
    setCopiado(false);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo limpiar el link");
        return;
      }

      setResultado({
        link_directo: data.link_directo,
        headers: data.headers || {},
      });
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const copiarLink = () => {
    if (resultado?.link_directo) {
      navigator.clipboard.writeText(resultado.link_directo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

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
          🧹 Limpiador de <span className="text-purple-400">DoodStream</span>
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Pega un link de DoodStream y el sistema te devolverá el link directo para el reproductor.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <label className="block text-sm text-gray-400 mb-2">
            Link de DoodStream
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && limpiarLink()}
              placeholder="https://dood.wf/e/xxxxx"
              className="flex-1 bg-black/30 border border-white/15 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
            />
            <button
              onClick={limpiarLink}
              disabled={cargando}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {cargando ? "Limpiando..." : "Limpiar link"}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Ejemplo: https://dood.wf/e/abc123xyz
          </p>
        </div>

        {error && (
          <div className="rounded-xl p-4 mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {cargando && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Extrayendo link directo...</p>
          </div>
        )}

        {resultado && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold text-green-400">¡Link limpio!</h3>
            </div>

            <div className="mb-4">
              <p className="text-xs text-purple-400 mb-2">🎬 Link directo para el reproductor:</p>
              <div className="bg-black/50 rounded-lg p-3 border border-purple-500/30">
                <p className="text-sm text-white break-all font-mono">
                  {resultado.link_directo}
                </p>
              </div>
            </div>

            {resultado.headers && Object.keys(resultado.headers).length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-purple-400 mb-2">📋 Headers necesarios (guardar por si acaso):</p>
                <div className="bg-black/50 rounded-lg p-3 border border-purple-500/30 text-xs font-mono">
                  {Object.entries(resultado.headers).map(([key, value]) => (
                    <div key={key} className="text-gray-300">
                      <span className="text-purple-400">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={copiarLink}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                {copiado ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiado ? "¡Copiado!" : "Copiar link"}
              </button>

              <a
                href={resultado.link_directo}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Probar
              </a>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              💡 Copia el link y pégalo en el campo "Link de reproducción" de la película en el panel de admin.
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">📖 ¿Cómo usar esto?</h3>
          <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
            <li>Ve a la página de la película en Cinecalidad o CineHDPlus</li>
            <li>Busca el iframe de DoodStream (click derecho → Inspeccionar)</li>
            <li>Copia el link del iframe (empieza con https://dood.xxx/e/xxxxx)</li>
            <li>Pégalo aquí y haz clic en "Limpiar link"</li>
            <li>Copia el link directo que te da</li>
            <li>Pégalo en el campo "Link de reproducción" de la película en el admin</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
