import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { crearClienteServidor } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
async function esAdmin() {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes((user.email || "").toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get("q");
    const genero = searchParams.get("genero");
    const pagina = Number(searchParams.get("pagina") || "1");
    const porPagina = Number(searchParams.get("porPagina") || "0");

    let query = supabaseAdmin
      .from("peliculas")
      .select("*", { count: "exact" })
      .order("creado_en", { ascending: false });

    if (busqueda) query = query.ilike("titulo", `%${busqueda}%`);
    if (genero) query = query.eq("genero", genero);

    if (porPagina > 0) {
      const desde = (pagina - 1) * porPagina;
      query = query.range(desde, desde + porPagina - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ peliculas: data || [], total: count ?? data?.length ?? 0 });
  } catch (error) {
    console.error("Error en GET /api/peliculas:", error);
    return NextResponse.json({ error: "Error al obtener películas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await esAdmin())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { titulo, anio, genero, sinopsis, caratula, link_directo, fuente, destacada } = body;

    if (!titulo || !anio || !genero) {
      return NextResponse.json({ error: "Título, año y género son obligatorios" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("peliculas")
      .insert([{
        titulo,
        anio,
        genero,
        sinopsis: sinopsis ?? "",
        caratula: caratula ?? "",
        link_directo: link_directo ?? "",
        fuente: fuente ?? "manual",
        destacada: destacada ?? false,
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }
}
