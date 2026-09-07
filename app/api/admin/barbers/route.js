// app/api/admin/barbers/route.js
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db.from("barbers").select("id, name, active").order("name");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ barbers: data });
}