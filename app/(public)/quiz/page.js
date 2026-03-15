'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QUIZ, QUIZ_RESULTS } from '@/lib/constants';

const RESULT_MAP = {
  'Monthly cash flow': 'cashflow',
  'Long-term appreciation': 'appreciation',
  'BRRR': 'brrr',
  'House hack': 'househack',
  'Pre-construction flip': 'precon',
};

// Map quiz answers to listing page filter query params
function buildFilterQuery(answers) {
  const params = new URLSearchParams();

  // Q2: Budget → price range
  const budget = answers[1];
  if (budget === 'Under $500K') { params.set('maxPrice', '500000'); }
  else if (budget === '$500K \u2013 $700K') { params.set('minPrice', '500000'); params.set('maxPrice', '700000'); }
  else if (budget === '$700K \u2013 $1M') { params.set('minPrice', '700000'); params.set('maxPrice', '1000000'); }
  else if (budget === '$1M \u2013 $1.5M') { params.set('minPrice', '1000000'); params.set('maxPrice', '1500000'); }
  else if (budget === '$1.5M+') { params.set('minPrice', '1500000'); }

  // Q3: Property type
  const type = answers[2];
  if (type === 'Condo') params.set('type', 'Condo');
  else if (type === 'Townhouse or semi') params.set('type', 'Town');
  else if (type === 'Detached house') params.set('type', 'Detached');
  else if (type === 'Duplex / multiplex') params.set('type', 'Duplex/Multi');

  // Q5: What matters most → strategy chip
  const priority = answers[4];
  if (priority === 'Positive cash flow from day one') params.set('strategy', 'cf');
  else if (priority === 'Below-market price') params.set('strategy', 'reduced');
  else if (priority === 'Suite potential') params.set('strategy', 'suite');
  else if (priority === 'Near transit') params.set('strategy', 'lrt');

  return params.toString();
}

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
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
          source: 'quiz',
          notes: `Strategy: ${key} | Budget: ${answers[1]} | Type: ${answers[2]} | Timeline: ${answers[3]} | Priority: ${answers[4]}`,
        }),
      });

      localStorage.setItem('user_registered', 'true');
      localStorage.setItem('quiz_result', key);
      if (email) localStorage.setItem('user_email', email);
      if (name) localStorage.setItem('user_name', name);

      // Build filter URL and redirect to results
      const query = buildFilterQuery(answers);
      const resultKey = key;
      const result = QUIZ_RESULTS[resultKey];

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
              Your personalized deals are ready!
            </h2>
            <p className="text-sm text-muted">
              Enter your email to see listings that match your criteria.
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
              {loading ? 'Finding your deals...' : 'Show My Deals'}
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

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/listings?${buildFilterQuery(answers)}`}
                className="btn-primary !px-8 !py-3 no-underline"
              >
                View {resultKey === 'precon' ? 'Pre-Construction Deals' : 'Matching Listings'}
              </Link>
              {resultKey === 'precon' && (
                <Link
                  href="/pre-construction"
                  className="btn-gold !px-8 !py-3 no-underline"
                >
                  Get Pre-Con VIP Access
                </Link>
              )}
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
