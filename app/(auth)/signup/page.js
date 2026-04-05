'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CASL_TEXT } from '@/lib/constants';
import { GoogleSignIn } from '@/components/ui/google-signin';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [caslConsent, setCaslConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  /* Strip to digits only for validation */
  function cleanPhone(ph) {
    return (ph || '').replace(/\D/g, '');
  }

  function isValidPhone(ph) {
    const digits = cleanPhone(ph);
    // Must be 10 digits (Canadian) or 11 starting with 1
    if (digits.length === 10) return true;
    if (digits.length === 11 && digits.startsWith('1')) return true;
    return false;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isValidPhone(form.phone)) {
      setError('Please enter a valid phone number (e.g. 647-555-1234).');
      return;
    }

    if (!caslConsent) {
      setError('Please provide your consent to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          source: 'registration',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (data.existing) {
        setError('This email is already registered. Please log in instead.');
        setLoading(false);
        return;
      }

      localStorage.setItem('user_registered', 'true');
      localStorage.setItem('user_name', `${form.firstName} ${form.lastName}`);
      localStorage.setItem('user_email', form.email);
      router.push('/listings');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
      {/* Wordmark */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <span className="font-heading text-2xl font-bold text-navy">
            MississaugaInvestor
          </span>
          <span className="font-heading text-2xl font-bold text-accent">.ca</span>
        </Link>
        <p className="mt-2 text-sm text-muted">
          Create your free account to unlock deal analysis
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <GoogleSignIn
        onSuccess={() => router.push('/listings')}
        onError={(msg) => setError(msg)}
      />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-muted">or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-navy">
              First Name <span className="text-red-400">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="John"
              autoComplete="given-name"
              className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-navy">
              Last Name <span className="text-red-400">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Smith"
              autoComplete="family-name"
              className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-navy">
            Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => {
              // Auto-format as (XXX) XXX-XXXX
              const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
              let formatted = digits;
              if (digits.length >= 7) {
                const start = digits.length === 11 ? 1 : 0;
                formatted = `(${digits.slice(start, start + 3)}) ${digits.slice(start + 3, start + 6)}-${digits.slice(start + 6)}`;
                if (digits.length === 11) formatted = '1 ' + formatted;
              } else if (digits.length >= 4) {
                const start = digits.length === 11 ? 1 : 0;
                formatted = `(${digits.slice(start, start + 3)}) ${digits.slice(start + 3)}`;
              }
              updateField('phone', formatted);
            }}
            placeholder="(647) 555-1234"
            autoComplete="tel"
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <p className="mt-1 text-[11px] text-muted">We&apos;ll text you when new deals match your criteria</p>
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {/* CASL Consent */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={caslConsent}
              onChange={(e) => setCaslConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-accent focus:ring-accent/40"
            />
            <span className="text-xs leading-relaxed text-muted">{CASL_TEXT}</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create Free Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent hover:text-accent-dark">
          Log in
        </Link>
      </p>
    </div>
  );
}
