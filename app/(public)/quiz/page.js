'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QUIZ, QUIZ_RESULTS } from '@/lib/constants';

const RESULT_MAP = {
  'Monthly cash flow': 'cashflow',
  'Long-term appreciation': 'appreciation',
  'BRRR strategy': 'brrr',
  'Pre-construction gains': 'precon',
};

export default function QuizPage() {
  const [step, setStep] = useState(0); // 0..3 = questions, 4 = email gate, 5 = result
  const [answers, setAnswers] = useState([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultKey, setResultKey] = useState(null);

  const totalSteps = QUIZ.length; // 4 questions

  function handleAnswer(opt) {
    const updated = [...answers, opt];
    setAnswers(updated);

    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // All questions answered, go to email gate
      setStep(totalSteps);
    }
  }

  function determineResult(ans) {
    const primary = ans[0];
    return RESULT_MAP[primary] || 'cashflow';
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email to see your result.');
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
          notes: `Quiz result: ${key}. Answers: ${answers.join(', ')}`,
        }),
      });

      // Save to localStorage
      localStorage.setItem('quiz_result', key);
      if (email) localStorage.setItem('user_email', email);
      if (name) localStorage.setItem('user_name', name);

      setResultKey(key);
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
    setResultKey(null);
  }

  const result = resultKey ? QUIZ_RESULTS[resultKey] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="section-title mb-2">Find Your Investment Strategy</h1>
        <p className="section-subtitle">
          Answer 4 quick questions to discover your ideal approach
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
                key={opt}
                onClick={() => handleAnswer(opt)}
                className="w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-navy transition-all hover:border-accent hover:bg-accent/5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {opt}
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
              Your result is ready!
            </h2>
            <p className="text-sm text-muted">
              Enter your details to see your personalized investment strategy.
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
              {loading ? 'Loading...' : 'See My Result'}
            </button>
          </form>

          <p className="text-[11px] text-muted text-center mt-4">
            We respect your privacy. No spam, unsubscribe anytime.
          </p>
        </div>
      )}

      {/* Result */}
      {step > totalSteps && result && (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">{result.emoji}</div>
          <h2 className="font-heading font-bold text-2xl text-navy mb-3">
            {result.title}
          </h2>
          <p className="text-sm text-muted leading-relaxed max-w-md mx-auto mb-8">
            {result.desc}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/listings"
              className="btn-primary !px-8 !py-3 no-underline"
            >
              Browse Matching Deals
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
      )}
    </div>
  );
}
