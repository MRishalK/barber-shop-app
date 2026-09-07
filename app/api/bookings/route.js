// app/api/bookings/route.js
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) {
    return Response.json({ error: "date query param is required" }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: bookings, error: bookingsErr } = await db
    .from("bookings")
    .select("barber_id, start_time")
    .eq("date", date)
    .eq("status", "confirmed");

  if (bookingsErr) return Response.json({ error: bookingsErr.message }, { status: 500 });

  const { data: blocked, error: blockedErr } = await db
    .from("blocked_slots")
    .select("barber_id, start_time")
    .eq("date", date);

  if (blockedErr) return Response.json({ error: blockedErr.message }, { status: 500 });

  return Response.json({ bookings, blocked });
}

export async function POST(req) {
  const body = await req.json();
  const { barberId, serviceId, customerName, customerPhone, date, startTime } = body;

  if (!barberId || !serviceId || !customerName || !customerPhone || !date || !startTime) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: service, error: serviceErr } = await db
    .from("services")
    .select("id, name, duration_minutes, price")
    .eq("id", serviceId)
    .single();

  if (serviceErr || !service) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  const [h, m] = startTime.split(":").map(Number);
  const endMinutes = h * 60 + m + service.duration_minutes;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(
    endMinutes % 60
  ).padStart(2, "0")}`;

  let resolvedBarberId = barberId;
  if (barberId === "any") {
    const { data: barbers } = await db.from("barbers").select("id").eq("active", true);
    const { data: taken } = await db
      .from("bookings")
      .select("barber_id")
      .eq("date", date)
      .eq("start_time", startTime)
      .eq("status", "confirmed");
    const takenIds = new Set((taken || []).map((t) => t.barber_id));
    const free = (barbers || []).find((b) => !takenIds.has(b.id));
    if (!free) {
      return Response.json({ error: "That time is fully booked" }, { status: 409 });
    }
    resolvedBarberId = free.id;
  }

  const { data: booking, error: insertErr } = await db
    .from("bookings")
    .insert({
      barber_id: resolvedBarberId,
      service_id: serviceId,
      customer_name: customerName,
      customer_phone: customerPhone,
      date,
      start_time: startTime,
      end_time: endTime,
    })
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return Response.json({ error: "That slot was just taken. Pick another." }, { status: 409 });
    }
    return Response.json({ error: insertErr.message }, { status: 500 });
  }

  if (process.env.TWILIO_ACCOUNT_SID) {
    fetch(`${process.env.APP_URL}/api/send-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    }).catch((err) => console.error("WhatsApp send failed", err));
  }

  return Response.json({ booking }, { status: 201 });
}