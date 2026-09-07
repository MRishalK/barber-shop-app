// app/api/admin/bookings/route.js
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await db
    .from("bookings")
    .select("id, customer_name, customer_phone, date, start_time, services(name), barbers(name)")
    .eq("status", "confirmed")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ bookings: data });
}