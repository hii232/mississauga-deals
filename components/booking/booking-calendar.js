'use client';

import { useState, useEffect, useCallback } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ALL_SLOTS = [];
for (let h = 9; h <= 18; h++) {
  ALL_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 19) ALL_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getToday() {
  // Approximate ET by using the locale string approach
  const etStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
  return new Date(etStr + 'T00:00:00');
}

export function BookingCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const t = getToday();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(null);

  const today = getToday();
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  // Fetch booked slots when date selected
  const fetchSlots = useCallback(async (dateStr) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings?date=${dateStr}`);
      const data = await res.json();
      setBookedSlots(data.slots || []);
    } catch {
      setBookedSlots([]);
    }
    setLoadingSlots(false);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(toDateStr(selectedDate));
      setSelectedTime(null);
    }
  }, [selectedDate, fetchSlots]);

  // Calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const canGoBack = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoForward = currentMonth < maxMonth;

  function handleDateClick(day) {
    const d = new Date(year, month, day);
    if (d.getDay() === 0) return; // Sunday
    if (d < today) return;
    setSelectedDate(d);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time.');
      return;
    }
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.email.includes('@')) { setError('Valid email is required.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          notes: form.notes,
          date: toDateStr(selectedDate),
          time: selectedTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to book. Please try again.');
        if (res.status === 409) {
          fetchSlots(toDateStr(selectedDate));
        }
      } else {
        setConfirmed({
          date: selectedDate.toLocaleDateString('en-CA', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          }),
          time: formatTime(selectedTime),
          name: form.name,
        });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  // Confirmation screen
  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="card p-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-heading font-bold text-2xl text-navy mb-2">
            You're Booked!
          </h2>
          <p className="text-sm text-muted mb-6">
            Your call with Hamza is confirmed.
          </p>
          <div className="rounded-xl bg-cloud p-5 mb-6">
            <p className="text-sm font-semibold text-navy">{confirmed.date}</p>
            <p className="text-lg font-bold text-accent">{confirmed.time} ET</p>
          </div>
          <p className="text-xs text-muted mb-4">
            Hamza will call you at the scheduled time. Check your email for a confirmation.
          </p>
          <a href="/listings" className="btn-primary !px-8 !py-3 no-underline inline-block">
            Browse Listings While You Wait
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left: Calendar + Time */}
      <div className="space-y-5">
        {/* Month nav */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              disabled={!canGoBack}
              className="p-1.5 rounded-lg hover:bg-cloud transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="font-heading font-semibold text-lg text-navy">
              {currentMonth.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              disabled={!canGoForward}
              className="p-1.5 rounded-lg hover:bg-cloud transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold uppercase text-muted py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const d = new Date(year, month, day);
              const isSunday = d.getDay() === 0;
              const isPast = d < today;
              const isSelected = selectedDate && toDateStr(d) === toDateStr(selectedDate);
              const isToday = toDateStr(d) === toDateStr(today);
              const disabled = isSunday || isPast;

              return (
                <button
                  key={day}
                  onClick={() => !disabled && handleDateClick(day)}
                  disabled={disabled}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-accent text-white font-bold shadow-md'
                      : disabled
                        ? 'text-slate-300 cursor-not-allowed'
                        : isToday
                          ? 'bg-accent/10 text-accent font-bold hover:bg-accent/20'
                          : 'text-navy hover:bg-cloud'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-sm text-navy mb-3">
              Available Times — {selectedDate.toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {ALL_SLOTS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedTime === slot;

                  // If it's today, disable past time slots
                  let isPastSlot = false;
                  if (toDateStr(selectedDate) === toDateStr(today)) {
                    const etNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
                    const [sh, sm] = slot.split(':').map(Number);
                    if (sh < etNow.getHours() || (sh === etNow.getHours() && sm <= etNow.getMinutes())) {
                      isPastSlot = true;
                    }
                  }

                  const disabled = isBooked || isPastSlot;

                  return (
                    <button
                      key={slot}
                      onClick={() => !disabled && setSelectedTime(slot)}
                      disabled={disabled}
                      className={`rounded-lg py-2 px-2 text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-accent text-white font-bold shadow-md'
                          : disabled
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                            : 'bg-cloud text-navy hover:bg-accent/10 hover:text-accent'
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-muted mt-3">All times are Eastern Time (ET). Calls are 30 minutes.</p>
          </div>
        )}
      </div>

      {/* Right: Form */}
      <div className="card p-6 lg:sticky lg:top-24">
        <h2 className="font-heading font-semibold text-lg text-navy mb-1">Your Details</h2>
        <p className="text-xs text-muted mb-5">
          {selectedDate && selectedTime
            ? `Booking for ${selectedDate.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })} at ${formatTime(selectedTime)} ET`
            : 'Select a date and time to continue'}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bk-name" className="mb-1 block text-sm font-medium text-navy">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="bk-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label htmlFor="bk-email" className="mb-1 block text-sm font-medium text-navy">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="bk-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label htmlFor="bk-phone" className="mb-1 block text-sm font-medium text-navy">
              Phone <span className="text-xs text-muted">(recommended)</span>
            </label>
            <input
              id="bk-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="647-XXX-XXXX"
              className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label htmlFor="bk-notes" className="mb-1 block text-sm font-medium text-navy">
              What would you like to discuss?
            </label>
            <textarea
              id="bk-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Looking for cash-flowing properties in Cooksville, first-time investor, pre-construction..."
              rows={3}
              className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedDate || !selectedTime}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>

          <p className="text-[10px] text-muted text-center">
            Free 30-minute consultation. No obligation.
          </p>
        </form>
      </div>
    </div>
  );
}
