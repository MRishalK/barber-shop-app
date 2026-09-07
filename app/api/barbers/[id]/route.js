// app/api/barbers/[id]/route.js
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const updates = await req.json();
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("barbers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ barber: data });
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const db = supabaseAdmin();
  const { error } = await db.from("barbers").delete().eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}