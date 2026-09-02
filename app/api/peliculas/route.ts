import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = crearClienteServidor();

  const { searchParams } = new URL(req.url);
  const busqueda = searchParams.get("q");
  const genero = searchParams.get("genero");
  const pagina = Number(searchParams.get("pagina") || "1");
  const porPagina = Number(searchParams.get("porPagina") || "0");

  let query = supabase
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

  return NextResponse.json({ peliculas: data, total: count ?? data.length });
}

export async function POST(req: NextRequest) {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { titulo, anio, genero, sinopsis, caratula, link_directo, fuente, destacada } = body;

    if (!titulo || !anio || !genero) {
      return NextResponse.json({ error: "Título, año y género son obligatorios" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("peliculas")
      .insert([{
        titulo, anio, genero,
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
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }
}
