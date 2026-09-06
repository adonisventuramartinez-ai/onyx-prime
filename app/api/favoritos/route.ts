import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = crearClienteServidor();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("favoritos")
      .select("pelicula_id")
      .eq("usuario_id", user.id);

    if (error) {
      console.error("Error en GET favoritos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data.map((f) => f.pelicula_id));
  } catch (error) {
    console.error("Error en GET favoritos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = crearClienteServidor();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { pelicula_id } = await req.json();
    if (!pelicula_id) {
      return NextResponse.json({ error: "Falta pelicula_id" }, { status: 400 });
    }

    // Verificar que la película existe
    const { data: pelicula, error: peliculaError } = await supabase
      .from("peliculas")
      .select("id")
      .eq("id", pelicula_id)
      .single();

    if (peliculaError || !pelicula) {
      return NextResponse.json({ error: "Película no encontrada" }, { status: 404 });
    }

    const { error } = await supabase
      .from("favoritos")
      .insert([{ usuario_id: user.id, pelicula_id }]);

    if (error) {
      console.error("Error en POST favoritos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST favoritos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = crearClienteServidor();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pelicula_id = searchParams.get("pelicula_id");
    if (!pelicula_id) {
      return NextResponse.json({ error: "Falta pelicula_id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("favoritos")
      .delete()
      .eq("usuario_id", user.id)
      .eq("pelicula_id", pelicula_id);

    if (error) {
      console.error("Error en DELETE favoritos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en DELETE favoritos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
