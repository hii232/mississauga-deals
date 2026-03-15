'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QUIZ_RESULTS } from '@/lib/constants';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    quizResult: null,
  });

  useEffect(() => {
    const name = localStorage.getItem('user_name') || '';
    const email = localStorage.getItem('user_email') || '';
    const quizResult = localStorage.getItem('quiz_result') || null;

    setProfile({ name, email, quizResult });
  }, []);

  function handleLogout() {
    localStorage.removeItem('user_registered');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    router.push('/login');
  }

  const quizData = profile.quizResult ? QUIZ_RESULTS[profile.quizResult] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="section-title mb-2">Investor Profile</h1>
        <p className="section-subtitle">Your account details and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent text-2xl font-bold font-heading">
            {profile.name ? profile.name.charAt(0).toUpperCase() : profile.email ? profile.email.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h2 className="font-heading font-semibold text-xl text-navy">
              {profile.name || 'Investor'}
            </h2>
            <p className="text-sm text-muted">{profile.email || 'No email set'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg bg-cloud p-4">
            <p className="text-xs font-medium uppercase text-slate-400 mb-1">Name</p>
            <p className="text-sm font-medium text-navy">{profile.name || 'Not provided'}</p>
          </div>
          <div className="rounded-lg bg-cloud p-4">
            <p className="text-xs font-medium uppercase text-slate-400 mb-1">Email</p>
            <p className="text-sm font-medium text-navy">{profile.email || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Quiz Results */}
      <div className="card p-6 mb-6">
        <h3 className="font-heading font-semibold text-lg text-navy mb-4">
          Investor Type
        </h3>

        {quizData ? (
          <div className="rounded-lg bg-cloud p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{quizData.emoji}</span>
              <div>
                <h4 className="font-heading font-semibold text-navy">{quizData.title}</h4>
              </div>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-4">{quizData.desc}</p>
            <Link
              href="/quiz"
              className="text-xs font-medium text-accent hover:text-accent-dark no-underline"
            >
              Retake Quiz
            </Link>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-sm text-muted mb-4">
              Take the investor quiz to discover your ideal investment strategy and get personalized recommendations.
            </p>
            <Link
              href="/quiz"
              className="btn-primary !px-6 !py-2.5 text-sm no-underline"
            >
              Take the Quiz
            </Link>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="card p-6 mb-6">
        <h3 className="font-heading font-semibold text-lg text-navy mb-4">
          Quick Links
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/saved" className="flex items-center gap-3 rounded-lg bg-cloud p-3 hover:bg-slate-100 transition-colors no-underline">
            <span className="text-xl">❤️</span>
            <span className="text-sm font-medium text-navy">Saved Deals</span>
          </Link>
          <Link href="/compare" className="flex items-center gap-3 rounded-lg bg-cloud p-3 hover:bg-slate-100 transition-colors no-underline">
            <span className="text-xl">⚖️</span>
            <span className="text-sm font-medium text-navy">Compare Properties</span>
          </Link>
          <Link href="/alerts" className="flex items-center gap-3 rounded-lg bg-cloud p-3 hover:bg-slate-100 transition-colors no-underline">
            <span className="text-xl">🔔</span>
            <span className="text-sm font-medium text-navy">Deal Alerts</span>
          </Link>
          <Link href="/recent" className="flex items-center gap-3 rounded-lg bg-cloud p-3 hover:bg-slate-100 transition-colors no-underline">
            <span className="text-xl">👀</span>
            <span className="text-sm font-medium text-navy">Recently Viewed</span>
          </Link>
        </div>
      </div>

      {/* Logout */}
      <div className="card p-6">
        <h3 className="font-heading font-semibold text-lg text-navy mb-3">
          Account
        </h3>
        <p className="text-sm text-muted mb-4">
          Logging out will clear your session. Your saved deals and alerts are stored locally in this browser.
        </p>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-red-200 bg-red-50 px-6 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
