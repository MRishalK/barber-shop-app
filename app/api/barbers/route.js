// app/api/barbers/route.js
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("barbers")
    .select("id, name, active")
    .eq("active", true)
    .order("name");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ barbers: data });
}

export async function POST(req) {
  const { name } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Name is required" }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db.from("barbers").insert({ name }).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ barber: data }, { status: 201 });
}