import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { obtenerPeliculasPorAnio, buscarEnCinecalidad, buscarEnCineHDPlus, extraerIframeDoodstream, extraerLinkDoodstream } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 60;

const LIMITE_POR_EJECUCION = 5;

export async function GET() {
  try {
    // Buscar tarea pendiente
    const { data: tarea } = await supabaseAdmin
      .from("tareas_scraping")
      .select("*")
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!tarea) {
      return NextResponse.json({ mensaje: "No hay tareas pendientes" });
    }

    await supabaseAdmin
      .from("tareas_scraping")
      .update({ estado: "procesando" })
      .eq("id", tarea.id);

    // Obtener películas de TMDB
    const peliculas = await obtenerPeliculasPorAnio(2026, 3);
    const estrenos2026 = peliculas.filter(
      (p) => p.release_date && new Date(p.release_date).getFullYear() === 2026
    );

    let nuevas = 0;
    let yaExisten = 0;
    let errores = 0;

    const totalAProcesar = Math.min(estrenos2026.length, LIMITE_POR_EJECUCION);

    for (let i = 0; i < totalAProcesar; i++) {
      const p = estrenos2026[i];
      try {
        const { data: existente } = await supabaseAdmin
          .from("peliculas")
          .select("id")
          .eq("titulo", p.title)
          .maybeSingle();

        if (existente) {
          yaExisten++;
          continue;
        }

        // Buscar link en ambas fuentes
        const [linkCinecalidad, linkCineHD] = await Promise.all([
          buscarEnCinecalidad(p.title),
          buscarEnCineHDPlus(p.title),
        ]);

        const linkPagina = linkCinecalidad || linkCineHD;
        let linkDirecto = "";

        if (linkPagina) {
          const iframeUrl = await extraerIframeDoodstream(linkPagina);
          if (iframeUrl) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://onyx-prime.vercel.app";
            const extract = await extraerLinkDoodstream(iframeUrl, baseUrl);
            if (extract) linkDirecto = extract.link_directo;
          }
        }

        const { error } = await supabaseAdmin
          .from("peliculas")
          .insert({
            titulo: p.title,
            anio: p.release_date ? p.release_date.split("-")[0] : "2026",
            genero: "Desconocido",
            sinopsis: p.overview || "Sin sinopsis disponible",
            caratula: p.poster_path
              ? `https://image.tmdb.org/t/p/original${p.poster_path}`
              : "",
            link_directo: linkDirecto,
            fuente: "auto",
            creado_en: new Date().toISOString(),
          });

        if (error) errores++;
        else nuevas++;

        await new Promise((r) => setTimeout(r, 300));
      } catch {
        errores++;
      }
    }

    await supabaseAdmin
      .from("tareas_scraping")
      .update({
        estado: errores > 0 && nuevas === 0 ? "error" : "completado",
        fecha_fin: new Date().toISOString(),
        total_encontradas: estrenos2026.length,
        nuevas,
        ya_existentes: yaExisten,
        errores,
        mensaje: `Procesadas ${nuevas + yaExisten + errores} películas`,
      })
      .eq("id", tarea.id);

    return NextResponse.json({
      mensaje: "Completado",
      nuevas,
      ya_existentes: yaExisten,
      errores,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error en worker" }, { status: 500 });
  }
}
