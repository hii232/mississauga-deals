'use client';

import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { CityscapePanorama } from '@/components/art/cityscape';

// Answers mirror exactly what the calculator implements — keep in sync with calc logic
const CALC_FAQ = [
  {
    question: 'Why do Canadian mortgage payments differ from US calculator results?',
    answer:
      'Canadian fixed-rate mortgages compound semi-annually, not monthly like US mortgages. This calculator uses semi-annual compounding, so payments match what Canadian lenders actually charge.',
  },
  {
    question: 'When is CMHC mortgage insurance required and how much does it cost?',
    answer:
      'CMHC insurance is required on owner-occupied purchases with less than 20% down. The premium is 4.00% of the loan with 5-9.99% down, 3.10% with 10-14.99% down, and 2.80% with 15-19.99% down. The premium is added to the mortgage, but Ontario charges 8% PST on it, due in cash at closing.',
  },
  {
    question: 'What is the federal mortgage stress test?',
    answer:
      'To qualify, you must prove you could afford payments at the greater of your contract rate plus 2% or 5.25%. This calculator shows your stress-test payment alongside the real payment.',
  },
  {
    question: 'What is the minimum down payment in Canada?',
    answer:
      'The federal minimum is 5% of the first $500,000 plus 10% of the remainder up to $1.5 million. Homes of $1.5 million or more require 20% down.',
  },
  {
    question: 'How much is land transfer tax in Ontario?',
    answer:
      'Ontario land transfer tax is marginal: 0.5% up to $55,000, 1% to $250,000, 1.5% to $400,000, 2% to $2 million, and 2.5% above that. This calculator includes it in your cash-to-close and cash-on-cash return. Toronto properties pay an additional municipal LTT, which does not apply in Mississauga.',
  },
];

import { useState, useMemo } from 'react';
import Link from 'next/link';

function fmt(n) {
  return n.toLocaleString('en-CA', { maximumFractionDigits: 0 });
}

function fmtPct(n) {
  return n.toFixed(2) + '%';
}

/**
 * Canadian semi-annual compounding for fixed-rate mortgages.
 */
function calcMortgage(loanAmount, annualRate, amortYears) {
  if (annualRate === 0) return loanAmount / (amortYears * 12);
  const semiAnnualRate = annualRate / 100 / 2;
  const effectiveMonthlyRate = Math.pow(1 + semiAnnualRate, 1 / 6) - 1;
  const n = amortYears * 12;
  return loanAmount * (effectiveMonthlyRate * Math.pow(1 + effectiveMonthlyRate, n)) / (Math.pow(1 + effectiveMonthlyRate, n) - 1);
}

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

export default function MortgageCalculatorPage() {
  const [price, setPrice] = useState(800000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(4.89);
  const [amort, setAmort] = useState(25);
  const [rent, setRent] = useState(2800);
  const [propertyTax, setPropertyTax] = useState(6720);
  const [insurance, setInsurance] = useState(175);
  const [maintenance, setMaintenance] = useState(5);
  const [vacancy, setVacancy] = useState(5);
  const [management, setManagement] = useState(0);

  const calc = useMemo(() => {
    const downPayment = price * (downPct / 100);
    const baseLoan = price - downPayment;

    // CMHC insurance premium (required under 20% down, owner-occupied only)
    // 5-9.99% down: 4.00% · 10-14.99%: 3.10% · 15-19.99%: 2.80% of loan
    const cmhcRate = downPct >= 20 ? 0 : downPct >= 15 ? 0.028 : downPct >= 10 ? 0.031 : 0.04;
    const cmhcPremium = Math.round(baseLoan * cmhcRate);
    const cmhcPST = Math.round(cmhcPremium * 0.08); // Ontario PST on premium, due in cash at closing
    const loanAmount = baseLoan + cmhcPremium;

    // Federal minimum down payment: 5% of first $500K + 10% of remainder up to $1.5M; 20% at $1.5M+
    const minDownAmt = price <= 500000 ? price * 0.05 : price < 1500000 ? 25000 + (price - 500000) * 0.10 : price * 0.20;
    const minDownPct = (minDownAmt / price) * 100;

    // Canadian semi-annual compounding
    const monthlyMortgage = calcMortgage(loanAmount, rate, amort);
    const numPayments = amort * 12;

    // Stress test: qualify at the greater of contract rate + 2% or 5.25%
    const stressRate = Math.max(rate + 2, 5.25);
    const stressPayment = calcMortgage(loanAmount, stressRate, amort);

    const monthlyTax = propertyTax / 12;
    const monthlyMaint = rent * (maintenance / 100);
    const monthlyVacancy = rent * (vacancy / 100);
    const monthlyMgmt = rent * (management / 100);

    const totalMonthlyExpenses = monthlyMortgage + monthlyTax + insurance + monthlyMaint + monthlyVacancy + monthlyMgmt;
    const monthlyCashFlow = rent - totalMonthlyExpenses;

    // NOI — no mortgage
    const annualGrossRent = rent * 12;
    const annualVacancyLoss = annualGrossRent * (vacancy / 100);
    const egi = annualGrossRent - annualVacancyLoss;
    const annualNOI = egi - propertyTax - (insurance * 12) - (annualGrossRent * maintenance / 100) - (annualGrossRent * management / 100);

    const capRate = (annualNOI / price) * 100;

    // Cash-on-Cash with Ontario LTT
    const ltt = calcOntarioLTT(price);
    const closingCosts = ltt + 3000 + cmhcPST;
    const totalCashInvested = downPayment + closingCosts;
    const cashOnCash = ((monthlyCashFlow * 12) / totalCashInvested) * 100;
    const totalInterest = monthlyMortgage * numPayments - loanAmount;
    const grm = annualGrossRent > 0 ? price / annualGrossRent : 0;

    return {
      downPayment,
      loanAmount,
      cmhcPremium,
      cmhcPST,
      minDownPct,
      stressRate,
      stressPayment,
      monthlyMortgage,
      monthlyTax,
      monthlyMaint,
      monthlyVacancy,
      monthlyMgmt,
      totalMonthlyExpenses,
      monthlyCashFlow,
      annualNOI,
      capRate,
      cashOnCash,
      totalInterest,
      ltt,
      closingCosts,
      totalCashInvested,
      grm,
    };
  }, [price, downPct, rate, amort, rent, propertyTax, insurance, maintenance, vacancy, management]);

  const cashFlowColor =
    calc.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-500';

  return (
    <>
      <FAQJsonLd items={CALC_FAQ} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.mississaugainvestor.ca/' },
          { name: 'Mortgage Calculator', url: 'https://www.mississaugainvestor.ca/mortgage-calculator' },
        ]}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#141F38] via-navy to-[#2A3B63] pt-14 pb-24 md:pt-16 md:pb-32">
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
            Income Property Mortgage & Cash Flow Calculator
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
            Built for Mississauga income properties: Canadian semi-annual compounding, CMHC insurance, the federal stress test, itemized expenses, rental cash flow and Ontario land transfer tax — calculated correctly for investors.
          </p>
        </div>
        <CityscapePanorama variant="dusk" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full opacity-90 md:h-24" />
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-heading text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <span className="h-1 w-5 bg-accent rounded-full" />
                Property Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputSlider label="Purchase Price" value={price} onChange={setPrice} min={100000} max={5000000} step={25000} prefix="$" format={fmt} />
                <InputSlider label="Down Payment" value={downPct} onChange={setDownPct} min={5} max={50} step={1} suffix="%" />
                <InputSlider label="Interest Rate" value={rate} onChange={setRate} min={1} max={10} step={0.05} suffix="%" decimal />
                <InputSlider label="Amortization" value={amort} onChange={setAmort} min={15} max={30} step={5} suffix=" yrs" />
              </div>
              {downPct < calc.minDownPct - 0.01 && (
                <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  Below the federal minimum down payment for this price ({calc.minDownPct.toFixed(1)}% — 5% of the first $500K plus 10% of the rest; 20% at $1.5M+).
                </p>
              )}
              {downPct < 20 && amort > 25 && (
                <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Insured mortgages (under 20% down) are capped at 25-year amortization — 30 years is only
                  available to first-time buyers or on new builds. Numbers below assume your lender approves it.
                </p>
              )}
              {downPct < 20 && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Under 20% down requires CMHC insurance and is only available if you live in the property (e.g., house hacking).
                  Pure rental properties require 20%+ down. CMHC premium of ${fmt(calc.cmhcPremium)} is added to your mortgage.
                </p>
              )}
              {downPct < 20 && amort > 25 && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Insured mortgages are generally capped at 25-year amortization (30 for first-time buyers and new builds).
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-heading text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <span className="h-1 w-5 bg-green-500 rounded-full" />
                Income & Expenses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputSlider label="Monthly Rent" value={rent} onChange={setRent} min={500} max={8000} step={100} prefix="$" format={fmt} />
                <InputSlider label="Annual Property Tax" value={propertyTax} onChange={setPropertyTax} min={1000} max={15000} step={250} prefix="$" format={fmt} />
                <InputSlider label="Monthly Insurance" value={insurance} onChange={setInsurance} min={50} max={500} step={25} prefix="$" />
                <InputSlider label="Maintenance Reserve" value={maintenance} onChange={setMaintenance} min={1} max={15} step={1} suffix="%" />
                <InputSlider label="Vacancy Allowance" value={vacancy} onChange={setVacancy} min={0} max={15} step={1} suffix="%" />
                <InputSlider label="Management Fee" value={management} onChange={setManagement} min={0} max={12} step={1} suffix="%" />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted mb-1">Monthly Cash Flow</p>
              <p className={`font-mono text-3xl font-bold ${cashFlowColor}`}>
                {calc.monthlyCashFlow >= 0 ? '+' : '-'}${fmt(Math.abs(Math.round(calc.monthlyCashFlow)))}
              </p>
              <p className="text-[10px] text-muted mt-1">
                {calc.monthlyCashFlow >= 0 ? 'Positive — this property covers its costs' : 'Negative — you\'d need to cover the shortfall'}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Key Metrics</h3>
              <div className="space-y-3">
                <MetricRow label="Cap Rate" value={fmtPct(calc.capRate)} good={calc.capRate >= 4} />
                <MetricRow label="Cash-on-Cash Return" value={fmtPct(calc.cashOnCash)} good={calc.cashOnCash >= 5} />
                <MetricRow label="GRM" value={calc.grm.toFixed(1)} />
                <MetricRow label="Annual NOI" value={`$${fmt(Math.round(calc.annualNOI))}`} />
                <MetricRow label="Total Interest Paid" value={`$${fmt(Math.round(calc.totalInterest))}`} />
                <MetricRow label={`Stress-Test Payment (${calc.stressRate.toFixed(2)}%)`} value={`$${fmt(Math.round(calc.stressPayment))}/mo`} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Monthly Breakdown</h3>
              <div className="space-y-2">
                <BreakdownRow label="Rental Income" value={rent} positive />
                <div className="border-t border-gray-50 my-2" />
                <BreakdownRow label="Mortgage Payment" value={-Math.round(calc.monthlyMortgage)} />
                <BreakdownRow label="Property Tax" value={-Math.round(calc.monthlyTax)} />
                <BreakdownRow label="Insurance" value={-insurance} />
                <BreakdownRow label={`Maintenance (${maintenance}%)`} value={-Math.round(calc.monthlyMaint)} />
                <BreakdownRow label={`Vacancy (${vacancy}%)`} value={-Math.round(calc.monthlyVacancy)} />
                {management > 0 && <BreakdownRow label={`Management (${management}%)`} value={-Math.round(calc.monthlyMgmt)} />}
                <div className="border-t border-gray-100 my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-navy">Cash Flow</span>
                  <span className={`text-sm font-mono font-bold ${cashFlowColor}`}>
                    {calc.monthlyCashFlow >= 0 ? '+' : '-'}${fmt(Math.abs(Math.round(calc.monthlyCashFlow)))}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Total Cash Required</h3>
              <div className="space-y-2">
                <MetricRow label="Down Payment" value={`$${fmt(calc.downPayment)}`} />
                <MetricRow label="Ontario Land Transfer Tax" value={`$${fmt(calc.ltt)}`} />
                <MetricRow label="Legal, Title & Misc" value="$3,000" />
                {calc.cmhcPremium > 0 && (
                  <>
                    <MetricRow label="CMHC Premium (added to mortgage)" value={`$${fmt(calc.cmhcPremium)}`} />
                    <MetricRow label="PST on CMHC Premium (cash)" value={`$${fmt(calc.cmhcPST)}`} />
                  </>
                )}
                <div className="border-t border-gray-100 my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">Total Cash to Close</span>
                  <span className="text-sm font-mono font-bold text-navy">${fmt(Math.round(calc.totalCashInvested))}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted mt-2">Ontario LTT only. Toronto properties have additional municipal LTT.</p>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 text-center">
              <p className="text-sm font-semibold text-navy mb-1">Found something interesting?</p>
              <p className="text-xs text-muted mb-3">Browse real listings with built-in investment analysis</p>
              <Link href="/listings" className="btn-primary !px-5 !py-2.5 !text-sm no-underline inline-block">
                Browse Deals →
              </Link>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted/50 mt-8 leading-relaxed max-w-3xl">
          Canadian fixed-rate mortgage with semi-annual compounding. CMHC premiums, stress-test qualifying rates, and minimum down payment rules
          reflect current federal guidelines but may change. This calculator provides estimates for informational purposes only. Actual mortgage payments depend on your
          lender, credit score, and specific terms. Rental income estimates, cap rates, and cash flow projections are not
          guaranteed. Consult a licensed mortgage broker and financial advisor before making investment decisions.
        </p>
      </section>

      {/* FAQ — visible content backing the FAQPage JSON-LD above */}
      <section className="max-w-3xl mx-auto px-4 pb-14">
        <h2 className="font-heading font-bold text-xl text-navy mb-5">
          How This Calculator Works
        </h2>
        <div className="space-y-3">
          {CALC_FAQ.map((f) => (
            <details key={f.question} className="group bg-white rounded-xl border border-gray-100 px-5 py-4">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-semibold text-navy">
                {f.question}
                <span className="text-accent transition-transform group-open:rotate-45 text-lg leading-none" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function InputSlider({ label, value, onChange, min, max, step, prefix, suffix, format, decimal }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-muted">{label}</label>
        <span className="text-sm font-mono font-bold text-navy">
          {prefix || ''}{format ? format(value) : decimal ? value.toFixed(2) : value}{suffix || ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-accent"
      />
    </div>
  );
}

function MetricRow({ label, value, good }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-sm font-mono font-bold ${good === true ? 'text-green-600' : good === false ? 'text-red-500' : 'text-navy'}`}>
        {value}
      </span>
    </div>
  );
}

function BreakdownRow({ label, value, positive }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs font-mono ${positive ? 'text-green-600' : 'text-red-400'}`}>
        {positive ? '+' : ''}${fmt(Math.abs(value))}
      </span>
    </div>
  );
}
