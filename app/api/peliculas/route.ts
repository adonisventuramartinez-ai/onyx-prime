import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/db";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("peliculas")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("peliculas")
      .insert(body)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
