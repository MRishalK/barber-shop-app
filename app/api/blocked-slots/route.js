// app/api/blocked-slots/route.js
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await db
    .from("blocked_slots")
    .select("id, barber_id, date, start_time, end_time, note, barbers(name)")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ blocked: data });
}

export async function POST(req) {
  const { date, startTime, endTime, note, barberId } = await req.json();
  if (!date || !startTime) {
    return Response.json({ error: "date and startTime are required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("blocked_slots")
    .insert({
      date,
      start_time: startTime,
      end_time: endTime || startTime,
      note: note || null,
      barber_id: barberId || null,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ blocked: data }, { status: 201 });
}