"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Scissors,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const SHOP = {
  name: "Bay Street Barbers",
  address: "12 MG Road, Thrissur, Kerala 680001",
  phone: "+91 90000 00000",
};

const OPEN_HOUR = 9;
const CLOSE_HOUR = 19;
const ACCENT = "#E0562E";
const INK = "#171512";

function nextDays(n) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

function buildAllSlots(duration) {
  const slots = [];
  for (let m = OPEN_HOUR * 60; m + duration <= CLOSE_HOUR * 60; m += duration) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    slots.push({ minutes: m, label: `${hh}:${mm}` });
  }
  return slots;
}

const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: "short" });
const fmtDate = (d) => d.getDate();
const fmtFull = (d) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

function TopBar({ title, subtitle }) {
  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: INK }}>
          <Scissors size={16} color="#fff" />
        </div>
        <div>
          <p className="font-semibold text-[15px] leading-tight">{title}</p>
          {subtitle && <p className="text-xs text-[#8A8375]">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="absolute left-4 right-4 bottom-24 z-20">
      <div className="bg-[#1E2B1E] text-white rounded-2xl px-4 py-3 flex items-center gap-2 shadow-lg">
        <MessageCircle size={16} className="text-[#8FD177] shrink-0" />
        <p className="text-xs leading-snug flex-1">{message}</p>
        <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function BarberApp() {
  const days = useMemo(() => nextDays(7), []);
  const [screen, setScreen] = useState("book");
  const [dayIndex, setDayIndex] = useState(0);

  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [barberId, setBarberId] = useState("any");
  const [serviceId, setServiceId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });

  const [dayBookings, setDayBookings] = useState([]);
  const [dayBlocked, setDayBlocked] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [myBookings, setMyBookings] = useState([]);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const date = days[dayIndex];
  const dateKey = date.toISOString().slice(0, 10);
  const service = services.find((s) => s.id === serviceId);

  useEffect(() => {
    async function loadConfig() {
      try {
        const [barbersRes, servicesRes] = await Promise.all([
          fetch("/api/barbers").then((r) => r.json()),
          fetch("/api/services").then((r) => r.json()),
        ]);
        setBarbers(barbersRes.barbers || []);
        setServices(servicesRes.services || []);
        if (servicesRes.services?.length) setServiceId(servicesRes.services[0].id);
      } catch (err) {
        setToast("Couldn't load shop info. Check your connection and refresh.");
      } finally {
        setLoadingConfig(false);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    async function loadAvailability() {
      setLoadingAvailability(true);
      try {
        const res = await fetch(`/api/bookings?date=${dateKey}`).then((r) => r.json());
        setDayBookings(res.bookings || []);
        setDayBlocked(res.blocked || []);
      } catch (err) {
        setToast("Couldn't load availability for that date.");
      } finally {
        setLoadingAvailability(false);
      }
    }
    loadAvailability();
  }, [dateKey]);

  const slots = useMemo(() => {
    if (!service) return [];
    const base = buildAllSlots(service.duration_minutes);
    const barbersToCheck = barberId === "any" ? barbers.map((b) => b.id) : [barberId];

    return base.map((slot) => {
      const timeStr = slot.label;
      const relevantBookings = dayBookings.filter((b) => b.start_time?.slice(0, 5) === timeStr);
      const relevantBlocks = dayBlocked.filter((b) => b.start_time?.slice(0, 5) === timeStr);

      const bookedBarberIds = new Set(relevantBookings.map((b) => b.barber_id));
      const blockedBarberIds = new Set(relevantBlocks.filter((b) => b.barber_id).map((b) => b.barber_id));
      const wholeShopBlocked = relevantBlocks.some((b) => !b.barber_id);

      const unavailableFor = new Set([...bookedBarberIds, ...blockedBarberIds]);
      const stillFree = barbersToCheck.some((id) => !unavailableFor.has(id));

      return { ...slot, booked: wholeShopBlocked || !stillFree };
    });
  }, [service, barbers, barberId, dayBookings, dayBlocked]);

  function pickSlot(slot) {
    if (slot.booked) return;
    setSelectedSlot(slot);
  }

  async function submitBooking(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId,
          serviceId,
          customerName: form.name,
          customerPhone: form.phone,
          date: dateKey,
          startTime: selectedSlot.label,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error || "Something went wrong. Try another slot.");
        const refreshed = await fetch(`/api/bookings?date=${dateKey}`).then((r) => r.json());
        setDayBookings(refreshed.bookings || []);
        setDayBlocked(refreshed.blocked || []);
        setSelectedSlot(null);
        return;
      }
      setMyBookings((prev) => [
        ...prev,
        {
          ...data.booking,
          serviceName: service.name,
          barberName: barbers.find((b) => b.id === data.booking.barber_id)?.name || "Barber",
        },
      ]);
      setDayBookings((prev) => [...prev, { barber_id: data.booking.barber_id, start_time: data.booking.start_time }]);
      setSelectedSlot(null);
      setForm({ name: "", phone: "" });
      setToast(`Booked! A WhatsApp confirmation is on its way to ${form.phone}.`);
      setScreen("mine");
    } catch (err) {
      setToast("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelBooking(booking) {
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: "POST" });
      if (!res.ok) {
        setToast("Couldn't cancel that booking. Try again.");
        return;
      }
      setMyBookings((prev) => prev.filter((b) => b.id !== booking.id));
      setDayBookings((prev) =>
        prev.filter((b) => !(b.barber_id === booking.barber_id && b.start_time === booking.start_time))
      );
      setToast(`Your ${booking.serviceName} on ${booking.date} was cancelled.`);
    } catch (err) {
      setToast("Network error while cancelling.");
    }
  }

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(SHOP.address)}&z=15&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SHOP.address)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEAE3] py-6">
      <div className="relative w-full max-w-[400px] h-[820px] bg-[#FAF8F4] rounded-[36px] shadow-xl overflow-hidden border border-[#E4E0D6] flex flex-col">
        <div className="h-6 flex items-center justify-center shrink-0">
          <div className="w-24 h-4 bg-[#171512] rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {screen === "book" && (
            <>
              <TopBar title={SHOP.name} subtitle="Book your chair" />
              <div className="px-5">
                {loadingConfig ? (
                  <p className="text-sm text-[#8A8375] py-10 text-center">Loading services…</p>
                ) : (
                  <>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#B0A99B] mb-2">Service</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-5 px-5 no-scrollbar">
                      {services.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setServiceId(s.id);
                            setSelectedSlot(null);
                          }}
                          className="shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium transition"
                          style={
                            serviceId === s.id
                              ? { background: ACCENT, color: "#fff" }
                              : { background: "#fff", color: INK, border: "1px solid #EBE6DB" }
                          }
                        >
                          {s.name}
                          <span className="opacity-70 font-normal"> · ₹{s.price}</span>
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#B0A99B] mb-2">Barber</p>
                    <div className="flex gap-2 mb-5 flex-wrap">
                      <button
                        onClick={() => {
                          setBarberId("any");
                          setSelectedSlot(null);
                        }}
                        className="flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-medium transition"
                        style={
                          barberId === "any"
                            ? { background: INK, color: "#fff" }
                            : { background: "#fff", color: INK, border: "1px solid #EBE6DB" }
                        }
                      >
                        <User size={12} /> Any barber
                      </button>
                      {barbers.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setBarberId(b.id);
                            setSelectedSlot(null);
                          }}
                          className="flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-medium transition"
                          style={
                            barberId === b.id
                              ? { background: INK, color: "#fff" }
                              : { background: "#fff", color: INK, border: "1px solid #EBE6DB" }
                          }
                        >
                          <User size={12} /> {b.name}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#B0A99B]">Date</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setDayIndex((i) => Math.max(0, i - 1))}
                          disabled={dayIndex === 0}
                          className="p-1 rounded-full disabled:opacity-30"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          onClick={() => setDayIndex((i) => Math.min(days.length - 1, i + 1))}
                          disabled={dayIndex === days.length - 1}
                          className="p-1 rounded-full disabled:opacity-30"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 mb-5">
                      {days.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setDayIndex(i);
                            setSelectedSlot(null);
                          }}
                          className="flex flex-col items-center py-2 rounded-xl text-xs transition"
                          style={
                            i === dayIndex
                              ? { background: ACCENT, color: "#fff" }
                              : { background: "#fff", color: INK, border: "1px solid #EBE6DB" }
                          }
                        >
                          <span className="text-[9px] uppercase opacity-80">{fmtDay(d)}</span>
                          <span className="font-semibold">{fmtDate(d)}</span>
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#B0A99B] mb-2">Available times</p>
                    {loadingAvailability ? (
                      <p className="text-sm text-[#8A8375] py-6 text-center">Checking availability…</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 mb-5">
                        {slots.map((slot) => {
                          const isSelected = selectedSlot && selectedSlot.minutes === slot.minutes;
                          return (
                            <button
                              key={slot.minutes}
                              onClick={() => pickSlot(slot)}
                              disabled={slot.booked}
                              className="py-2 rounded-xl text-xs font-medium transition"
                              style={
                                slot.booked
                                  ? { background: "#EDEAE3", color: "#B0A99B" }
                                  : isSelected
                                  ? { background: ACCENT, color: "#fff" }
                                  : { background: "#fff", color: INK, border: "1px solid #EBE6DB" }
                              }
                            >
                              {slot.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedSlot && (
                      <form onSubmit={submitBooking} className="bg-white rounded-2xl p-4 mb-6 border border-[#EBE6DB]">
                        <div className="flex items-center gap-2 mb-3 text-xs text-[#8A8375]">
                          <Clock size={13} />
                          {fmtFull(date)} · {selectedSlot.label} · {service?.name}
                        </div>
                        <input
                          type="text"
                          placeholder="Your name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full border border-[#fffefb] rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none"
                          required
                        />
                        <input
                          type="tel"
                          placeholder="WhatsApp number"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full border border-[#EBE6DB] rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none"
                          required
                        />
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full text-white text-sm font-medium py-3 rounded-xl transition disabled:opacity-60"
                          style={{ background: ACCENT }}
                        >
                          {submitting ? "Booking…" : "Confirm booking"}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {screen === "mine" && (
            <>
              <TopBar title="My bookings" subtitle={`${myBookings.length} upcoming`} />
              <div className="px-5 space-y-3">
                {myBookings.length === 0 && (
                  <div className="text-center py-16">
                    <ClipboardList size={28} className="mx-auto mb-2 text-[#D8D0C0]" />
                    <p className="text-sm text-[#8A8375]">No bookings yet this session</p>
                  </div>
                )}
                {myBookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl p-4 border border-[#EBE6DB]">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold">{b.serviceName}</p>
                        <p className="text-xs text-[#8A8375]">{b.date} · {b.start_time?.slice(0, 5)}</p>
                        <p className="text-xs text-[#8A8375]">{b.barberName}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: "#EAF3DE", color: "#3B6D11" }}>
                        Confirmed
                      </span>
                    </div>
                    <button
                      onClick={() => cancelBooking(b)}
                      className="w-full text-xs font-medium py-2 rounded-xl border border-[#EBE6DB] hover:border-[#E0562E] hover:text-[#E0562E] transition"
                    >
                      Cancel slot
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {screen === "location" && (
            <>
              <TopBar title="Find us" subtitle={SHOP.name} />
              <div className="px-5">
                <div className="rounded-2xl overflow-hidden border border-[#EBE6DB] mb-4 h-48">
                  <iframe title="shop location" src={mapSrc} className="w-full h-full border-0" loading="lazy" />
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#EBE6DB] mb-3">
                  <div className="flex items-start gap-2 mb-1">
                    <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
                    <p className="text-sm">{SHOP.address}</p>
                  </div>
                  <p className="text-xs text-[#8A8375] ml-[23px]">{SHOP.phone}</p>
                </div>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-white text-sm font-medium py-3 rounded-xl"
                  style={{ background: INK }}
                >
                  <Navigation size={14} /> Get directions
                </a>
              </div>
            </>
          )}
        </div>

        <Toast message={toast} onClose={() => setToast(null)} />

        <div className="shrink-0 border-t border-[#EBE6DB] bg-[#FAF8F4] px-6 py-3 flex justify-between">
          {[
            { id: "book", label: "Book", icon: CalendarDays },
            { id: "mine", label: "My bookings", icon: ClipboardList },
            { id: "location", label: "Location", icon: MapPin },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setScreen(id)}
              className="flex flex-col items-center gap-1 px-2"
              style={{ color: screen === id ? ACCENT : "#B0A99B" }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}