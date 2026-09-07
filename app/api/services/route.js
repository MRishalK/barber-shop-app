// app/api/services/route.js
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("services")
    .select("id, name, duration_minutes, price, active")
    .eq("active", true)
    .order("price");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ services: data });
}

export async function POST(req) {
  const { name, duration_minutes, price } = await req.json();
  if (!name?.trim() || !duration_minutes) {
    return Response.json({ error: "Name and duration are required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("services")
    .insert({ name, duration_minutes, price: price || 0 })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ service: data }, { status: 201 });
}