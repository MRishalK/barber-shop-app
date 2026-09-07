// app/api/admin/services/route.js
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("services")
    .select("id, name, duration_minutes, price, active")
    .order("price");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ services: data });
}