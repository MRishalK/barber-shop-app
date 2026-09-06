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
  X
} from "lucide-react";
import { useMemo, useState } from "react";

// --- config the owner would eventually edit from the admin dashboard ---
const SHOP = {
  name: "Bay Street Barbers",
  address: "12 MG Road, Thrissur, Kerala 680001",
  phone: "+91 90000 00000",
};

const BARBERS = [
  { id: "any", name: "Any barber" },
  { id: "raj", name: "Raj" },
  { id: "vinu", name: "Vinu" },
];

const SERVICES = [
  { id: "cut", name: "Haircut", duration: 30, price: 150 },
  { id: "shave", name: "Shave", duration: 20, price: 100 },
  { id: "combo", name: "Cut + Shave", duration: 45, price: 220 },
  { id: "beard", name: "Beard trim", duration: 15, price: 80 },
];

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

function isPreBooked(dateKey, barberId, minutes) {
  let h = 0;
  const s = `${dateKey}-${barberId}-${minutes}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 5 === 0;
}

function buildSlots(date, barberId, duration) {
  const dateKey = date.toISOString().slice(0, 10);
  const slots = [];
  for (let m = OPEN_HOUR * 60; m + duration <= CLOSE_HOUR * 60; m += duration) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    slots.push({ minutes: m, label: `${hh}:${mm}`, booked: isPreBooked(dateKey, barberId, m) });
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
    <div className="absolute left-4 right-4 bottom-24 z-20 animate-[fadeIn_0.2s_ease]">
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
  const [screen, setScreen] = useState("book"); // book | mine | location
  const [dayIndex, setDayIndex] = useState(0);
  const [barberId, setBarberId] = useState("any");
  const [serviceId, setServiceId] = useState(SERVICES[0].id);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [myBookings, setMyBookings] = useState([]);
  const [localBooked, setLocalBooked] = useState({});
  const [toast, setToast] = useState(null);

  const service = SERVICES.find((s) => s.id === serviceId);
  const date = days[dayIndex];
  const dateKey = date.toISOString().slice(0, 10);

  const slots = useMemo(() => {
    const base = buildSlots(date, barberId, service.duration);
    return base.map((s) => ({
      ...s,
      booked: s.booked || !!localBooked[`${dateKey}-${barberId}-${s.minutes}`],
    }));
  }, [date, barberId, service, localBooked, dateKey]);

  function pickSlot(slot) {
    if (slot.booked) return;
    setSelectedSlot(slot);
  }

  function submitBooking(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    const key = `${dateKey}-${barberId}-${selectedSlot.minutes}`;
    const booking = {
      id: `${key}-${Date.now()}`,
      key,
      name: form.name,
      phone: form.phone,
      service,
      barber: BARBERS.find((b) => b.id === barberId),
      date,
      time: selectedSlot.label,
    };
    setLocalBooked((prev) => ({ ...prev, [key]: true }));
    setMyBookings((prev) => [...prev, booking]);
    setSelectedSlot(null);
    setForm({ name: "", phone: "" });
    setToast(`WhatsApp confirmation sent to ${booking.phone} for ${fmtFull(date)}, ${booking.time}.`);
    setScreen("mine");
  }

  function cancelBooking(booking) {
    setLocalBooked((prev) => {
      const next = { ...prev };
      delete next[booking.key];
      return next;
    });
    setMyBookings((prev) => prev.filter((b) => b.id !== booking.id));
    setToast(`Your ${booking.service.name} on ${fmtFull(booking.date)} at ${booking.time} was cancelled.`);
  }

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(SHOP.address)}&z=15&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SHOP.address)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEAE3] py-6">
      {/* phone shell */}
      <div className="relative w-full max-w-[400px] h-[820px] bg-[#FAF8F4] rounded-[36px] shadow-xl overflow-hidden border border-[#E4E0D6] flex flex-col">
        {/* status notch */}
        <div className="h-6 flex items-center justify-center shrink-0">
          <div className="w-24 h-4 bg-[#171512] rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {screen === "book" && (
            <>
              <TopBar title={SHOP.name} subtitle="Book your chair" />
              <div className="px-5">
                {/* services */}
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#B0A99B] mb-2">Service</p>
                <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-5 px-5 no-scrollbar">
                  {SERVICES.map((s) => (
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

                {/* barber */}
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#B0A99B] mb-2">Barber</p>
                <div className="flex gap-2 mb-5">
                  {BARBERS.map((b) => (
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

                {/* date strip */}
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

                {/* slot grid */}
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#B0A99B] mb-2">Available times</p>
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

                {/* booking form */}
                {selectedSlot && (
                  <form onSubmit={submitBooking} className="bg-white rounded-2xl p-4 mb-6 border border-[#EBE6DB]">
                    <div className="flex items-center gap-2 mb-3 text-xs text-[#8A8375]">
                      <Clock size={13} />
                      {fmtFull(date)} · {selectedSlot.label} · {service.name}
                    </div>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-[#EBE6DB] rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none"
                      style={{ borderColor: form.name ? ACCENT : undefined }}
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
                      className="w-full text-white text-sm font-medium py-3 rounded-xl transition"
                      style={{ background: ACCENT }}
                    >
                      Confirm booking
                    </button>
                  </form>
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
                    <p className="text-sm text-[#8A8375]">No bookings yet</p>
                  </div>
                )}
                {myBookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl p-4 border border-[#EBE6DB]">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold">{b.service.name}</p>
                        <p className="text-xs text-[#8A8375]">{fmtFull(b.date)} · {b.time}</p>
                        <p className="text-xs text-[#8A8375]">{b.barber.name} · {b.phone}</p>
                      </div>
                      <span
                        className="text-[10px] font-medium px-2 py-1 rounded-full"
                        style={{ background: "#EAF3DE", color: "#3B6D11" }}
                      >
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
                  <iframe
                    title="shop location"
                    src={mapSrc}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
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

        {/* bottom nav */}
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
