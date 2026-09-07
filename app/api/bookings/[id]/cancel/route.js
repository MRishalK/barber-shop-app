// app/api/bookings/[id]/cancel/route.js
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(_req, { params }) {
  const { id } = await params;
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "confirmed")
    .select()
    .single();

  if (error || !data) {
    return Response.json({ error: "Booking not found or already cancelled" }, { status: 404 });
  }

  return Response.json({ booking: data });
}