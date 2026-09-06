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
  X,
} from "lucide-react";
import { useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const INITIAL_SERVICES = [
  { id: "cut", name: "Haircut", duration: 30, price: 150 },
  { id: "shave", name: "Shave", duration: 20, price: 100 },
  { id: "combo", name: "Cut + Shave", duration: 45, price: 220 },
  { id: "beard", name: "Beard trim", duration: 15, price: 80 },
];

const INITIAL_HOURS = WEEKDAYS.reduce((acc, day) => {
  acc[day] = day === "Sun" ? { open: false, from: "09:00", to: "19:00" } : { open: true, from: "09:00", to: "19:00" };
  return acc;
}, {});

const INITIAL_BOOKINGS = [
  { id: 1, name: "Anand Menon", phone: "98470xxxxx", service: "Haircut", date: "2026-09-06", time: "10:30", barber: "Raj" },
  { id: 2, name: "Kiran S", phone: "94470xxxxx", service: "Cut + Shave", date: "2026-09-06", time: "11:15", barber: "Vinu" },
  { id: 3, name: "Fahad P", phone: "96330xxxxx", service: "Beard trim", date: "2026-09-07", time: "16:00", barber: "Any" },
];

const TABS = ["Bookings", "Services", "Hours", "Block slots"];

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
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [hours, setHours] = useState(INITIAL_HOURS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [blocked, setBlocked] = useState([{ date: "2026-09-08", time: "13:00", note: "Lunch with supplier" }]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", duration: 30, price: 0 });
  const [blockForm, setBlockForm] = useState({ date: "", time: "", note: "" });

  function cancelBooking(id) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  function startEdit(service) {
    setEditingId(service.id);
    setDraft({ name: service.name, duration: service.duration, price: service.price });
  }

  function saveEdit(id) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...draft, duration: Number(draft.duration), price: Number(draft.price) } : s))
    );
    setEditingId(null);
  }

  function addService() {
    const id = `svc_${Date.now()}`;
    setServices((prev) => [...prev, { id, name: "New service", duration: 30, price: 0 }]);
    startEdit({ id, name: "New service", duration: 30, price: 0 });
  }

  function removeService(id) {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleDay(day) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], open: !prev[day].open } }));
  }

  function setDayTime(day, field, value) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function addBlock(e) {
    e.preventDefault();
    if (!blockForm.date || !blockForm.time) return;
    setBlocked((prev) => [...prev, blockForm]);
    setBlockForm({ date: "", time: "", note: "" });
  }

  function removeBlock(idx) {
    setBlocked((prev) => prev.filter((_, i) => i !== idx));
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
            {bookings.length === 0 ? (
              <p className="text-sm text-[#8A8375]">No bookings scheduled.</p>
            ) : (
              <div className="divide-y divide-[#EDE7D9]">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-[#8A8375]">
                        {b.service} · {b.date} · {b.time} · {b.barber}
                      </p>
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
            <div className="divide-y divide-[#EDE7D9]">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3 gap-3">
                  {editingId === s.id ? (
                    <>
                      <div className="flex gap-2 flex-1 flex-wrap">
                        <input
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          className="border border-[#D8D0C0] rounded-md px-2 py-1 text-sm flex-1 min-w-[120px]"
                          placeholder="Service name"
                        />
                        <input
                          type="number"
                          value={draft.duration}
                          onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                          className="border border-[#D8D0C0] rounded-md px-2 py-1 text-sm w-20"
                          placeholder="Mins"
                        />
                        <input
                          type="number"
                          value={draft.price}
                          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                          className="border border-[#D8D0C0] rounded-md px-2 py-1 text-sm w-20"
                          placeholder="₹"
                        />
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => saveEdit(s.id)} className="p-1.5 rounded-md hover:bg-[#EAF3DE] text-[#3B6D11]">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md hover:bg-[#F7E7E7] text-[#8A8375]">
                          <X size={15} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-[#8A8375]">
                          {s.duration} min · ₹{s.price}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEdit(s)} className="p-1.5 rounded-md hover:bg-[#EDE7D9]">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => removeService(s.id)}
                          className="p-1.5 rounded-md hover:bg-[#F7E7E7] text-[#A33025]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Hours */}
        {tab === "Hours" && (
          <Section title="Working hours">
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
            {blocked.length === 0 ? (
              <p className="text-sm text-[#8A8375]">No blocked slots.</p>
            ) : (
              <div className="divide-y divide-[#EDE7D9]">
                {blocked.map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-[#8A8375]" />
                      {b.date}
                      <Clock size={14} className="text-[#8A8375] ml-2" />
                      {b.time}
                      {b.note && <span className="text-xs text-[#8A8375] ml-2">— {b.note}</span>}
                    </div>
                    <button onClick={() => removeBlock(i)} className="p-1.5 rounded-md hover:bg-[#F7E7E7] text-[#A33025]">
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
