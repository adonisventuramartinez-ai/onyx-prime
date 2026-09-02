import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function GET() {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("favoritos")
    .select("pelicula_id")
    .eq("usuario_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data.map((f) => f.pelicula_id));
}

export async function POST(req: NextRequest) {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { pelicula_id } = await req.json();
  if (!pelicula_id) {
    return NextResponse.json({ error: "Falta pelicula_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("favoritos")
    .insert([{ usuario_id: user.id, pelicula_id }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
