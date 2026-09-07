"use client";

import {
  Ban,
  Calendar,
  Check,
  Clock,
  Pencil,
  Plus,
  Scissors,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const INITIAL_HOURS = WEEKDAYS.reduce((acc, day) => {
  acc[day] = day === "Sun" ? { open: false, from: "09:00", to: "19:00" } : { open: true, from: "09:00", to: "19:00" };
  return acc;
}, {});

const TABS = ["Bookings", "Barbers", "Services", "Hours", "Block slots"];

function Section({ title, children, action }) {
  return (
    <div className="bg-white border border-[#EDE7D9] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("Bookings");

  // bookings
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // barbers
  const [barbers, setBarbers] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [editingBarberId, setEditingBarberId] = useState(null);
  const [barberDraft, setBarberDraft] = useState({ name: "" });

  // services
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceDraft, setServiceDraft] = useState({ name: "", duration: 30, price: 0 });

  // hours (still local — not yet enforced by the booking system)
  const [hours, setHours] = useState(INITIAL_HOURS);

  // blocked slots
  const [blocked, setBlocked] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [blockForm, setBlockForm] = useState({ date: "", time: "", note: "" });

  useEffect(() => {
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then((res) => setBookings(res.bookings || []))
      .finally(() => setLoadingBookings(false));

    fetch("/api/admin/barbers")
      .then((r) => r.json())
      .then((res) => setBarbers(res.barbers || []))
      .finally(() => setLoadingBarbers(false));

    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((res) => setServices(res.services || []))
      .finally(() => setLoadingServices(false));

    fetch("/api/blocked-slots")
      .then((r) => r.json())
      .then((res) => setBlocked(res.blocked || []))
      .finally(() => setLoadingBlocked(false));
  }, []);

  async function cancelBooking(id) {
    const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
    if (res.ok) setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  // --- barber CRUD ---
  function startEditBarber(barber) {
    setEditingBarberId(barber.id);
    setBarberDraft({ name: barber.name });
  }

  async function saveEditBarber(id) {
    if (!barberDraft.name.trim()) return;
    const res = await fetch(`/api/barbers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: barberDraft.name }),
    });
    if (res.ok) {
      setBarbers((prev) => prev.map((b) => (b.id === id ? { ...b, name: barberDraft.name } : b)));
      setEditingBarberId(null);
    }
  }

  async function addBarber() {
    const res = await fetch("/api/barbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New barber" }),
    });
    const data = await res.json();
    if (res.ok) {
      setBarbers((prev) => [...prev, data.barber]);
      startEditBarber(data.barber);
    }
  }

  async function removeBarber(id) {
    const res = await fetch(`/api/barbers/${id}`, { method: "DELETE" });
    if (res.ok) setBarbers((prev) => prev.filter((b) => b.id !== id));
  }

  async function toggleBarberActive(barber) {
    const res = await fetch(`/api/barbers/${barber.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !barber.active }),
    });
    if (res.ok) {
      setBarbers((prev) => prev.map((b) => (b.id === barber.id ? { ...b, active: !b.active } : b)));
    }
  }

  // --- service CRUD ---
  function startEditService(service) {
    setEditingServiceId(service.id);
    setServiceDraft({ name: service.name, duration: service.duration_minutes, price: service.price });
  }

  async function saveEditService(id) {
    const payload = {
      name: serviceDraft.name,
      duration_minutes: Number(serviceDraft.duration),
      price: Number(serviceDraft.price),
    };
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...payload } : s)));
      setEditingServiceId(null);
    }
  }

  async function addService() {
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New service", duration_minutes: 30, price: 0 }),
    });
    const data = await res.json();
    if (res.ok) {
      setServices((prev) => [...prev, data.service]);
      startEditService(data.service);
    }
  }

  async function removeService(id) {
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) setServices((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleDay(day) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], open: !prev[day].open } }));
  }

  function setDayTime(day, field, value) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  // --- blocked slots ---
  async function addBlock(e) {
    e.preventDefault();
    if (!blockForm.date || !blockForm.time) return;
    const res = await fetch("/api/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: blockForm.date, startTime: blockForm.time, note: blockForm.note }),
    });
    const data = await res.json();
    if (res.ok) {
      setBlocked((prev) => [...prev, data.blocked]);
      setBlockForm({ date: "", time: "", note: "" });
    }
  }

  async function removeBlock(id) {
    const res = await fetch(`/api/blocked-slots/${id}`, { method: "DELETE" });
    if (res.ok) setBlocked((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#231F1C]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-full bg-[#231F1C] flex items-center justify-center shrink-0">
            <Scissors size={18} className="text-[#F7F3EA]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl leading-tight">Bay Street Barbers</h1>
            <p className="text-sm text-[#6B6459]">Owner dashboard</p>
          </div>
        </div>

        {/* tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full border text-sm transition ${
                tab === t
                  ? "bg-[#231F1C] border-[#231F1C] text-white"
                  : "border-[#D8D0C0] hover:border-[#231F1C]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Bookings */}
        {tab === "Bookings" && (
          <Section title="Upcoming bookings">
            {loadingBookings ? (
              <p className="text-sm text-[#8A8375]">Loading…</p>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-[#8A8375]">No bookings scheduled.</p>
            ) : (
              <div className="divide-y divide-[#EDE7D9]">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{b.customer_name}</p>
                      <p className="text-xs text-[#8A8375]">
                        {b.services?.name} · {b.date} · {b.start_time?.slice(0, 5)} · {b.barbers?.name}
                      </p>
                      <p className="text-xs text-[#8A8375]">{b.customer_phone}</p>
                    </div>
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="text-xs px-3 py-1.5 rounded-md border border-[#D8D0C0] hover:border-[#A33025] hover:text-[#A33025] transition"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Barbers */}
        {tab === "Barbers" && (
          <Section
            title="Barbers"
            action={
              <button
                onClick={addBarber}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#A33025] text-white hover:bg-[#8A2A1F] transition"
              >
                <Plus size={13} /> Add barber
              </button>
            }
          >
            {loadingBarbers ? (
              <p className="text-sm text-[#8A8375]">Loading…</p>
            ) : (
              <div className="divide-y divide-[#EDE7D9]">
                {barbers.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3 gap-3">
                    {editingBarberId === b.id ? (
                      <>
                        <input
                          value={barberDraft.name}
                          onChange={(e) => setBarberDraft({ name: e.target.value })}
                          className="border border-[#D8D0C0] rounded-md px-2 py-1 text-sm flex-1"
                          placeholder="Barber name"
                          autoFocus
                        />
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => saveEditBarber(b.id)} className="p-1.5 rounded-md hover:bg-[#EAF3DE] text-[#3B6D11]">
                            <Check size={15} />
                          </button>
                          <button onClick={() => setEditingBarberId(null)} className="p-1.5 rounded-md hover:bg-[#F7E7E7] text-[#8A8375]">
                            <X size={15} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#F1EFE8] flex items-center justify-center shrink-0">
                            <User size={14} className="text-[#8A8375]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{b.name}</p>
                            <button
                              onClick={() => toggleBarberActive(b)}
                              className={`text-xs ${b.active ? "text-[#3B6D11]" : "text-[#8A8375]"}`}
                            >
                              {b.active ? "Active — taking bookings" : "Inactive — hidden from customers"}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEditBarber(b)} className="p-1.5 rounded-md hover:bg-[#EDE7D9]">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => removeBarber(b.id)} className="p-1.5 rounded-md hover:bg-[#F7E7E7] text-[#A33025]">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Services */}
        {tab === "Services" && (
          <Section
            title="Services"
            action={
              <button
                onClick={addService}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#A33025] text-white hover:bg-[#8A2A1F] transition"
              >
                <Plus size={13} /> Add service
              </button>
            }
          >
            {loadingServices ? (
              <p className="text-sm text-[#8A8375]">Loading…</p>
            ) : (
              <div className="divide-y divide-[#EDE7D9]">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3 gap-3">
                    {editingServiceId === s.id ? (
                      <>
                        <div className="flex gap-2 flex-1 flex-wrap">
                          <input
                            value={serviceDraft.name}
                            onChange={(e) => setServiceDraft({ ...serviceDraft, name: e.target.value })}
                            className="border border-[#D8D0C0] rounded-md px-2 py-1 text-sm flex-1 min-w-[120px]"
                            placeholder="Service name"
                          />
                          <input
                            type="number"
                            value={serviceDraft.duration}
                            onChange={(e) => setServiceDraft({ ...serviceDraft, duration: e.target.value })}
                            className="border border-[#D8D0C0] rounded-md px-2 py-1 text-sm w-20"
                            placeholder="Mins"
                          />
                          <input
                            type="number"
                            value={serviceDraft.price}
                            onChange={(e) => setServiceDraft({ ...serviceDraft, price: e.target.value })}
                            className="border border-[#D8D0C0] rounded-md px-2 py-1 text-sm w-20"
                            placeholder="₹"
                          />
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => saveEditService(s.id)} className="p-1.5 rounded-md hover:bg-[#EAF3DE] text-[#3B6D11]">
                            <Check size={15} />
                          </button>
                          <button onClick={() => setEditingServiceId(null)} className="p-1.5 rounded-md hover:bg-[#F7E7E7] text-[#8A8375]">
                            <X size={15} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-[#8A8375]">
                            {s.duration_minutes} min · ₹{s.price}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEditService(s)} className="p-1.5 rounded-md hover:bg-[#EDE7D9]">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => removeService(s.id)} className="p-1.5 rounded-md hover:bg-[#F7E7E7] text-[#A33025]">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Hours */}
        {tab === "Hours" && (
          <Section title="Working hours">
            <p className="text-xs text-[#8A8375] mb-3">
              Not yet enforced by bookings — this is a preview of the hours UI, coming next.
            </p>
            <div className="space-y-2">
              {WEEKDAYS.map((day) => (
                <div key={day} className="flex items-center gap-3 py-1.5">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`w-16 shrink-0 text-xs px-2 py-1.5 rounded-md border transition ${
                      hours[day].open
                        ? "bg-[#EAF3DE] border-[#C0DD97] text-[#3B6D11]"
                        : "bg-[#F1EFE8] border-[#D8D0C0] text-[#8A8375]"
                    }`}
                  >
                    {day}
                  </button>
                  {hours[day].open ? (
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="time"
                        value={hours[day].from}
                        onChange={(e) => setDayTime(day, "from", e.target.value)}
                        className="border border-[#D8D0C0] rounded-md px-2 py-1 text-sm"
                      />
                      <span className="text-[#8A8375]">to</span>
                      <input
                        type="time"
                        value={hours[day].to}
                        onChange={(e) => setDayTime(day, "to", e.target.value)}
                        className="border border-[#D8D0C0] rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-[#8A8375]">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Block slots */}
        {tab === "Block slots" && (
          <Section title="Blocked times">
            <form onSubmit={addBlock} className="flex flex-wrap gap-2 mb-4">
              <input
                type="date"
                value={blockForm.date}
                onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                className="border border-[#D8D0C0] rounded-md px-2 py-1.5 text-sm"
                required
              />
              <input
                type="time"
                value={blockForm.time}
                onChange={(e) => setBlockForm({ ...blockForm, time: e.target.value })}
                className="border border-[#D8D0C0] rounded-md px-2 py-1.5 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Reason (optional)"
                value={blockForm.note}
                onChange={(e) => setBlockForm({ ...blockForm, note: e.target.value })}
                className="border border-[#D8D0C0] rounded-md px-2 py-1.5 text-sm flex-1 min-w-[140px]"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-[#231F1C] text-white hover:bg-[#3A342D] transition"
              >
                <Ban size={14} /> Block
              </button>
            </form>
            {loadingBlocked ? (
              <p className="text-sm text-[#8A8375]">Loading…</p>
            ) : blocked.length === 0 ? (
              <p className="text-sm text-[#8A8375]">No blocked slots.</p>
            ) : (
              <div className="divide-y divide-[#EDE7D9]">
                {blocked.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-[#8A8375]" />
                      {b.date}
                      <Clock size={14} className="text-[#8A8375] ml-2" />
                      {b.start_time?.slice(0, 5)}
                      {b.barbers?.name && <span className="text-xs text-[#8A8375] ml-2">({b.barbers.name})</span>}
                      {b.note && <span className="text-xs text-[#8A8375] ml-2">— {b.note}</span>}
                    </div>
                    <button onClick={() => removeBlock(b.id)} className="p-1.5 rounded-md hover:bg-[#F7E7E7] text-[#A33025]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}