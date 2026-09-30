import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

export const runtime = "nodejs";

// ========================================
// GET — Historial completo (pelis + series)
// ========================================
export async function GET() {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // 1. Historial de PELÍCULAS
  const { data: pelis, error: errorPelis } = await supabase
    .from("historial")
    .select("pelicula_id, visto_en, peliculas(id, titulo, caratula, anio, genero)")
    .eq("usuario_id", user.id)
    .order("visto_en", { ascending: false })
    .limit(20);

  if (errorPelis) {
    console.error("[historial GET] Error pelis:", errorPelis);
  }

  // 2. Historial de SERIES
  const { data: series, error: errorSeries } = await supabase
    .from("historial_series")
    .select(`
      serie_id,
      temporada,
      numero,
      visto_en,
      series(id, titulo, caratula, anio, genero, num_temporadas, num_episodios)
    `)
    .eq("usuario_id", user.id)
    .order("visto_en", { ascending: false })
    .limit(20);

  if (errorSeries) {
    console.error("[historial GET] Error series:", errorSeries);
  }

  // 3. Normalizar todo a un formato común
  const itemsPelis = (pelis || []).map((h: any) => ({
    tipo: "pelicula" as const,
    id: h.peliculas?.id,
    titulo: h.peliculas?.titulo,
    caratula: h.peliculas?.caratula,
    anio: h.peliculas?.anio,
    genero: h.peliculas?.genero,
    visto_en: h.visto_en,
    // para series
    temporada: null,
    numero: null,
    num_temporadas: null,
  }));

  const itemsSeries = (series || []).map((h: any) => ({
    tipo: "serie" as const,
    id: h.series?.id,
    titulo: h.series?.titulo,
    caratula: h.series?.caratula,
    anio: h.series?.anio,
    genero: h.series?.genero,
    visto_en: h.visto_en,
    temporada: h.temporada,
    numero: h.numero,
    num_temporadas: h.series?.num_temporadas,
  }));

  // 4. Mezclar y ordenar por visto_en desc
  const todos = [...itemsPelis, ...itemsSeries]
    .filter((x) => x.id) // filtrar si falta el objeto relacionado
    .sort((a, b) => new Date(b.visto_en).getTime() - new Date(a.visto_en).getTime())
    .slice(0, 20);

  return NextResponse.json(todos);
}

// ========================================
// POST — Guardar vista (película o serie)
// ========================================
export async function POST(req: NextRequest) {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { pelicula_id, serie_id, temporada, numero } = body;

  // --- Caso 1: Película ---
  if (pelicula_id) {
    const { error } = await supabase
      .from("historial")
      .upsert(
        [{ usuario_id: user.id, pelicula_id, visto_en: new Date().toISOString() }],
        { onConflict: "usuario_id,pelicula_id" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, tipo: "pelicula" });
  }

  // --- Caso 2: Serie ---
  if (serie_id && temporada && numero) {
    const { error } = await supabase
      .from("historial_series")
      .upsert(
        [{
          usuario_id: user.id,
          serie_id,
          temporada: parseInt(temporada),
          numero: parseInt(numero),
          visto_en: new Date().toISOString(),
        }],
        { onConflict: "usuario_id,serie_id" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, tipo: "serie" });
  }

  return NextResponse.json(
    { error: "Falta pelicula_id o (serie_id + temporada + numero)" },
    { status: 400 }
  );
}
