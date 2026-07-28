'use client';

import { useState, useMemo } from 'react';

// ─── Math helpers (self-contained — no server-side import) ────────────────────

/**
 * Canadian fixed-rate mortgages compound semi-annually.
 * Effective monthly rate = (1 + annualRate/200)^(1/6) - 1
 */
function calcMortgagePayment(loanAmount, annualRate, amortYears) {
  if (annualRate === 0) return loanAmount / (amortYears * 12);
  const em = Math.pow(1 + annualRate / 200, 1 / 6) - 1;
  const n = amortYears * 12;
  return loanAmount * (em * Math.pow(1 + em, n)) / (Math.pow(1 + em, n) - 1);
}

/** Ontario LTT — marginal brackets as of 2025 */
function calcOntarioLTT(price) {
  let ltt = 0;
  if (price > 2000000) {
    ltt += (price - 2000000) * 0.025;
    ltt += (2000000 - 400000) * 0.02;
    ltt += (400000 - 250000) * 0.015;
    ltt += (250000 - 55000) * 0.01;
    ltt += 55000 * 0.005;
  } else if (price > 400000) {
    ltt += (price - 400000) * 0.02;
    ltt += (400000 - 250000) * 0.015;
    ltt += (250000 - 55000) * 0.01;
    ltt += 55000 * 0.005;
  } else if (price > 250000) {
    ltt += (price - 250000) * 0.015;
    ltt += (250000 - 55000) * 0.01;
    ltt += 55000 * 0.005;
  } else if (price > 55000) {
    ltt += (price - 55000) * 0.01;
    ltt += 55000 * 0.005;
  } else {
    ltt += price * 0.005;
  }
  return Math.round(ltt);
}

// ─── Constants (match cash-flow-engine.js) ────────────────────────────────────
const PROP_TAX_RATE = 0.0084; // Mississauga 2025-26 (0.84%)
const INSURANCE_MO  = 225;    // flat monthly homeowner insurance

// ─── Small presentational helpers ─────────────────────────────────────────────

function fmt(n) {
  return Math.round(n).toLocaleString('en-CA');
}

function SliderInput({ label, value, onChange, min, max, step, prefix, suffix, note }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <span className="text-xs font-mono font-semibold text-navy">
          {prefix}{typeof value === 'number' && Number.isInteger(value / step) ? value.toLocaleString('en-CA') : value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-navy"
      />
      {note && <p className="text-[10px] text-slate-400 mt-0.5">{note}</p>}
    </div>
  );
}

function Row({ label, value, highlight, sub }) {
  return (
    <div className={`flex items-start justify-between py-1 ${highlight ? 'font-semibold' : ''}`}>
      <span className={`text-xs ${highlight ? 'text-navy' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-xs font-mono ${highlight ? 'text-navy font-bold' : 'text-slate-700'} text-right`}>
        {value}
        {sub && <span className="block text-[10px] font-normal text-slate-400">{sub}</span>}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function RentVsBuyCalculator() {
  const [price, setPrice]           = useState(900000);
  const [downPct, setDownPct]       = useState(20);
  const [rate, setRate]             = useState(4.89);
  const [amort, setAmort]           = useState(25);
  const [monthlyRent, setMonthlyRent] = useState(2800);

  const calc = useMemo(() => {
    const downPayment  = price * (downPct / 100);
    const loan         = price - downPayment;

    // Canadian semi-annual compounding payment
    const payment      = calcMortgagePayment(loan, rate, amort);
    const em           = Math.pow(1 + rate / 200, 1 / 6) - 1;

    // First-month interest & principal
    const interestMo   = Math.round(loan * em);
    const principalMo  = Math.round(payment - interestMo);

    // Fixed monthly carrying costs
    const propTaxMo    = Math.round(price * PROP_TAX_RATE / 12);
    const maintMo      = Math.round(price * 0.01 / 12);  // 1% of value / yr

    // What you actually write a cheque for each month (all cash out):
    const totalOwning  = Math.round(payment) + propTaxMo + maintMo + INSURANCE_MO;

    // The portion of owning cost you never get back (pure expenses, no equity):
    const pureExpense  = interestMo + propTaxMo + maintMo + INSURANCE_MO;

    // One-time buying costs (Ontario LTT + legal/title/misc)
    const ltt          = calcOntarioLTT(price);
    const closingCosts = ltt + 3000;  // $3k = legal + title + inspection

    // Monthly net advantage of buying over renting (in total-wealth terms):
    //   Buying: you gain `principalMo` equity but spend `pureExpense` on non-recoverable costs
    //   Renting: you spend `monthlyRent` and gain zero equity
    //   net = principalMo - pureExpense - (-monthlyRent) = principalMo + monthlyRent - pureExpense
    const netMoGain    = principalMo + monthlyRent - pureExpense;

    // Break-even: how many years until the monthly wealth advantage recoups closing costs?
    // Only meaningful when buying already wins month-over-month.
    const breakEvenYrs = netMoGain > 0
      ? Math.round((closingCosts / netMoGain / 12) * 10) / 10
      : null;

    return {
      downPayment,
      loan,
      payment: Math.round(payment),
      interestMo,
      principalMo,
      propTaxMo,
      maintMo,
      totalOwning,
      pureExpense,
      ltt,
      closingCosts,
      netMoGain: Math.round(netMoGain),
      breakEvenYrs,
    };
  }, [price, downPct, rate, amort, monthlyRent]);

  const winsBuying    = calc.netMoGain > 0;
  const costDiff      = Math.abs(calc.totalOwning - monthlyRent);
  const owningCheaper = calc.totalOwning < monthlyRent;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden my-10">
      {/* Header */}
      <div className="bg-navy px-6 py-4">
        <h2 className="font-heading font-bold text-white text-base">Rent vs Buy Break-Even Calculator</h2>
        <p className="text-white/60 text-xs mt-0.5">
          Canadian semi-annual compounding · Mississauga property tax (0.84%) · Ontario LTT
        </p>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Inputs ── */}
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Your Scenario</p>

          <SliderInput
            label="Purchase Price"
            value={price}
            onChange={setPrice}
            min={300000} max={3000000} step={25000}
            prefix="$"
          />
          <SliderInput
            label="Down Payment"
            value={downPct}
            onChange={setDownPct}
            min={5} max={50} step={5}
            suffix="%"
            note={`$${fmt(calc.downPayment)} down · $${fmt(calc.loan)} mortgage`}
          />
          <SliderInput
            label="Mortgage Rate"
            value={rate}
            onChange={setRate}
            min={2} max={9} step={0.25}
            suffix="%"
          />
          <SliderInput
            label="Amortization"
            value={amort}
            onChange={setAmort}
            min={15} max={30} step={5}
            suffix=" yrs"
          />
          <SliderInput
            label="Comparable Monthly Rent"
            value={monthlyRent}
            onChange={setMonthlyRent}
            min={1000} max={8000} step={100}
            prefix="$"
            note="What you'd pay for an equivalent rental"
          />
        </div>

        {/* ── Results ── */}
        <div className="space-y-4">
          {/* Monthly comparison */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Monthly Cost Comparison</p>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-0.5">
              <Row label="Renting" value={`$${fmt(monthlyRent)}/mo`} />
              <div className="border-t border-slate-200 my-2" />
              <Row label="Mortgage payment" value={`$${fmt(calc.payment)}/mo`} />
              <Row label="  · Interest (first month)" value={`$${fmt(calc.interestMo)}`} />
              <Row label="  · Principal (equity)" value={`$${fmt(calc.principalMo)}`} />
              <Row label="Property tax (0.84%)" value={`$${fmt(calc.propTaxMo)}/mo`} />
              <Row label="Maintenance (1%/yr)" value={`$${fmt(calc.maintMo)}/mo`} />
              <Row label="Home insurance" value={`$${INSURANCE_MO}/mo`} />
              <div className="border-t border-slate-200 my-2" />
              <Row label="Total owning cost" value={`$${fmt(calc.totalOwning)}/mo`} highlight />
              <p className="text-[10px] text-slate-400 mt-1">
                Owning costs {owningCheaper ? 'less' : 'more'} than renting by{' '}
                <strong className={owningCheaper ? 'text-emerald-700' : 'text-red-600'}>
                  ${fmt(costDiff)}/mo
                </strong>{' '}
                before counting the equity you build.
              </p>
            </div>
          </div>

          {/* Closing costs */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">One-Time Buying Costs</p>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-0.5">
              <Row label="Ontario Land Transfer Tax" value={`$${fmt(calc.ltt)}`} />
              <Row label="Legal, title & misc" value="$3,000" />
              <div className="border-t border-slate-200 my-2" />
              <Row label="Total closing costs" value={`$${fmt(calc.closingCosts)}`} highlight />
            </div>
          </div>

          {/* Verdict */}
          <div className={`rounded-xl p-4 border ${winsBuying ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`text-xs font-bold mb-1 ${winsBuying ? 'text-emerald-800' : 'text-amber-800'}`}>
              Break-Even Analysis
            </p>

            {winsBuying ? (
              <>
                <p className="text-xs text-emerald-800">
                  Buying builds <strong>${fmt(calc.principalMo)}/mo</strong> in equity and your monthly wealth
                  advantage over renting is <strong>${fmt(calc.netMoGain)}/mo</strong>. At that rate,
                  the <strong>${fmt(calc.closingCosts)}</strong> in closing costs are recouped in roughly{' '}
                  <strong>{calc.breakEvenYrs} years</strong> — after that, buying is clearly ahead.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-amber-800">
                  At these numbers, buying&apos;s non-recoverable costs (<strong>${fmt(calc.pureExpense)}/mo</strong> in
                  interest, tax, maintenance, and insurance) exceed the comparable rent plus equity built
                  (<strong>${fmt(calc.principalMo)}/mo</strong>). The gap is{' '}
                  <strong>${fmt(Math.abs(calc.netMoGain))}/mo</strong> in renting&apos;s favour — buying only pulls
                  ahead through <strong>price appreciation</strong>. Adjust the inputs or scroll up for guidance on
                  what changes the math.
                </p>
              </>
            )}

            <p className="text-[10px] text-slate-500 mt-2">
              Equity built = first-month principal only; amortizes over time. Closing costs = Ontario LTT + $3,000 legal/title/misc.
              Excludes condo fees, utility differentials, and appreciation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
