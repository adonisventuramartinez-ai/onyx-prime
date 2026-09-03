"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import Link from "next/link";
import PeliculaForm, { type DatosPelicula } from "@/components/PeliculaForm";

export default function AgregarPage() {
  const router = useRouter();

  const guardar = async (datos: DatosPelicula) => {
    const res = await fetch("/api/peliculas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...datos, fuente: "manual" }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al guardar");
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-nf-dark px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Agregar película manualmente</h1>
          <Link href="/admin" className="text-nf-gray-light hover:text-white text-sm">
            ← Volver al panel
          </Link>
        </div>
        <PeliculaForm onGuardar={guardar} textoBoton="Guardar película" />
      </div>
    </main>
  );
}
