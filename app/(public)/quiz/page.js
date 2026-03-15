'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUIZ, QUIZ_RESULTS } from '@/lib/constants';

const RESULT_MAP = {
  'Monthly cash flow': 'cashflow',
  'Long-term appreciation': 'appreciation',
  'BRRR': 'brrr',
  'House hack': 'househack',
  'Pre-construction flip': 'precon',
};


export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = QUIZ.length; // 5 questions

  function handleAnswer(label) {
    const updated = [...answers, label];
    setAnswers(updated);

    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setStep(totalSteps); // email gate
    }
  }

  function determineResult(ans) {
    return RESULT_MAP[ans[0]] || 'cashflow';
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email to see your results.');
      return;
    }

    setLoading(true);
    try {
      const key = determineResult(answers);

      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          source: 'quiz',
          notes: `Strategy: ${key} | Budget: ${answers[1]} | Type: ${answers[2]} | Timeline: ${answers[3]} | Priority: ${answers[4]}`,
        }),
      });

      localStorage.setItem('user_registered', 'true');
      localStorage.setItem('quiz_result', key);
      if (email) localStorage.setItem('user_email', email);
      if (name) localStorage.setItem('user_name', name);

      // Store result for display
      setStep(totalSteps + 1);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() {
    setStep(0);
    setAnswers([]);
    setEmail('');
    setName('');
    setPhone('');
    setError('');
  }

  const resultKey = answers.length > 0 ? determineResult(answers) : null;
  const result = resultKey ? QUIZ_RESULTS[resultKey] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="section-title mb-2">Find Your Investment Strategy</h1>
        <p className="section-subtitle">
          Answer 5 quick questions to get personalized deal recommendations
        </p>
      </div>

      {/* Progress bar */}
      {step <= totalSteps && (
        <div className="mb-8">
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>Question {Math.min(step + 1, totalSteps)} of {totalSteps}</span>
            <span>{Math.round((Math.min(step, totalSteps) / totalSteps) * 100)}% complete</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Question Steps */}
      {step < totalSteps && (
        <div className="card p-8">
          <h2 className="font-heading font-semibold text-xl text-navy mb-6 text-center">
            {QUIZ[step].q}
          </h2>
          <div className="space-y-3">
            {QUIZ[step].opts.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleAnswer(opt.label)}
                className="w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 transition-all hover:border-accent hover:bg-accent/5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <span className="text-sm font-medium text-navy">{opt.label}</span>
                {opt.sub && (
                  <span className="block text-xs text-muted mt-0.5">{opt.sub}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Email Gate */}
      {step === totalSteps && (
        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎯</div>
            <h2 className="font-heading font-semibold text-xl text-navy mb-2">
              Your investment profile is ready
            </h2>
            <p className="text-sm text-muted">
              Enter your details below and we&apos;ll send you a curated list of properties tailored to your goals within 24 hours.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="quiz-name" className="mb-1 block text-sm font-medium text-navy">
                Name
              </label>
              <input
                id="quiz-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label htmlFor="quiz-phone" className="mb-1 block text-sm font-medium text-navy">
                Phone
              </label>
              <input
                id="quiz-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(647) 000-0000"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label htmlFor="quiz-email" className="mb-1 block text-sm font-medium text-navy">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="quiz-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
            >
              {loading ? 'Submitting...' : 'Get My Curated Deals'}
            </button>
          </form>

          <p className="text-[11px] text-muted text-center mt-4">
            We respect your privacy. No spam, unsubscribe anytime.
          </p>
        </div>
      )}

      {/* Result */}
      {step > totalSteps && result && (
        <div className="space-y-6">
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">{result.emoji}</div>
            <h2 className="font-heading font-bold text-2xl text-navy mb-3">
              {result.title}
            </h2>
            <p className="text-sm text-muted leading-relaxed max-w-md mx-auto mb-6">
              {result.desc}
            </p>

            {/* Answer summary */}
            <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto mb-8">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">Budget</p>
                <p className="text-sm font-semibold text-navy">{answers[1]}</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">Property</p>
                <p className="text-sm font-semibold text-navy">{answers[2]}</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">Timeline</p>
                <p className="text-sm font-semibold text-navy">{answers[3]}</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted">Priority</p>
                <p className="text-sm font-semibold text-navy">{answers[4]}</p>
              </div>
            </div>

            <p className="text-sm text-muted mb-4">
              Let&apos;s find the right deals for you. Reach out and I&apos;ll send you personalized listings that match your criteria.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:6476091289"
                className="btn-primary !px-8 !py-3 no-underline inline-flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call 647-609-1289
              </a>
              <a
                href="mailto:hamza@nouman.ca?subject=Investment%20Inquiry%20-%20Quiz%20Result&body=Hi%20Hamza%2C%0A%0AI%20just%20took%20the%20investment%20quiz%20on%20MississaugaInvestor.ca.%0A%0AMy%20strategy%3A%20${encodeURIComponent(result.title)}%0ABudget%3A%20${encodeURIComponent(answers[1])}%0AProperty%3A%20${encodeURIComponent(answers[2])}%0ATimeline%3A%20${encodeURIComponent(answers[3])}%0APriority%3A%20${encodeURIComponent(answers[4])}%0A%0AI%27d%20love%20to%20see%20matching%20deals.%20Thanks!"
                className="rounded-lg border-2 border-accent bg-white px-8 py-3 text-sm font-semibold text-accent transition hover:bg-accent/5 no-underline inline-flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Hamza
              </a>
            </div>

            <button
              onClick={handleRestart}
              className="mt-6 text-xs text-muted hover:text-accent transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
