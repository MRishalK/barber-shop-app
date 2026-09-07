// app/api/blocked-slots/[id]/route.js
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const db = supabaseAdmin();
  const { error } = await db.from("blocked_slots").delete().eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}