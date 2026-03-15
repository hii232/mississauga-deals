'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleSignIn } from '@/components/ui/google-signin';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem('user_registered', 'true');
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
          Log in to access deal analysis tools
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
          <span className="bg-white px-3 text-xs text-muted">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-accent hover:text-accent-dark">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
