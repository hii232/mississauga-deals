'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

function fmt(n) {
  return n.toLocaleString('en-CA', { maximumFractionDigits: 0 });
}

function fmtPct(n) {
  return n.toFixed(2) + '%';
}

export default function MortgageCalculatorPage() {
  const [price, setPrice] = useState(800000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(4.99);
  const [amort, setAmort] = useState(25);
  const [rent, setRent] = useState(2800);
  const [propertyTax, setPropertyTax] = useState(4000);
  const [insurance, setInsurance] = useState(150);
  const [maintenance, setMaintenance] = useState(5);

  const calc = useMemo(() => {
    const downPayment = price * (downPct / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    const numPayments = amort * 12;

    // Monthly mortgage payment
    let monthlyMortgage = 0;
    if (monthlyRate > 0) {
      monthlyMortgage =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    } else {
      monthlyMortgage = loanAmount / numPayments;
    }

    const monthlyTax = propertyTax / 12;
    const monthlyMaint = rent * (maintenance / 100);
    const vacancy = rent * 0.04;

    const totalMonthlyExpenses = monthlyMortgage + monthlyTax + insurance + monthlyMaint + vacancy;
    const monthlyCashFlow = rent - totalMonthlyExpenses;

    // Annual metrics
    const annualNOI = (rent - monthlyTax - insurance - monthlyMaint - vacancy) * 12;
    const capRate = (annualNOI / price) * 100;
    const cashOnCash = ((monthlyCashFlow * 12) / downPayment) * 100;
    const totalInterest = monthlyMortgage * numPayments - loanAmount;

    return {
      downPayment,
      loanAmount,
      monthlyMortgage,
      monthlyTax,
      monthlyMaint,
      vacancy,
      totalMonthlyExpenses,
      monthlyCashFlow,
      annualNOI,
      capRate,
      cashOnCash,
      totalInterest,
    };
  }, [price, downPct, rate, amort, rent, propertyTax, insurance, maintenance]);

  const cashFlowColor =
    calc.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-500';

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-accent/20 py-14 md:py-18">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
            Mortgage & Cash Flow Calculator
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
            Calculate your monthly payments, estimated cash flow, and key investment metrics for any Mississauga property
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-3 space-y-5">
            {/* Property */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-heading text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <span className="h-1 w-5 bg-accent rounded-full" />
                Property Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InputSlider label="Purchase Price" value={price} onChange={setPrice} min={100000} max={5000000} step={25000} prefix="$" format={fmt} />
                <InputSlider label="Down Payment" value={downPct} onChange={setDownPct} min={5} max={50} step={1} suffix="%" />
                <InputSlider label="Interest Rate" value={rate} onChange={setRate} min={1} max={12} step={0.05} suffix="%" decimal />
                <InputSlider label="Amortization" value={amort} onChange={setAmort} min={5} max={30} step={5} suffix=" yrs" />
              </div>
            </div>

            {/* Income & Expenses */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-heading text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <span className="h-1 w-5 bg-green-500 rounded-full" />
                Income & Expenses
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InputSlider label="Monthly Rent" value={rent} onChange={setRent} min={500} max={8000} step={100} prefix="$" format={fmt} />
                <InputSlider label="Annual Property Tax" value={propertyTax} onChange={setPropertyTax} min={1000} max={15000} step={250} prefix="$" format={fmt} />
                <InputSlider label="Monthly Insurance" value={insurance} onChange={setInsurance} min={50} max={500} step={10} prefix="$" />
                <InputSlider label="Maintenance Reserve" value={maintenance} onChange={setMaintenance} min={0} max={15} step={1} suffix="%" />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Monthly Cash Flow */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted mb-1">Monthly Cash Flow</p>
              <p className={`font-mono text-3xl font-bold ${cashFlowColor}`}>
                ${fmt(Math.round(calc.monthlyCashFlow))}
              </p>
              <p className="text-[10px] text-muted mt-1">
                {calc.monthlyCashFlow >= 0 ? 'Positive — this property covers its costs' : 'Negative — you\'d need to cover the shortfall'}
              </p>
            </div>

            {/* Key Metrics */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Key Metrics</h3>
              <div className="space-y-3">
                <MetricRow label="Cap Rate" value={fmtPct(calc.capRate)} good={calc.capRate >= 4} />
                <MetricRow label="Cash-on-Cash Return" value={fmtPct(calc.cashOnCash)} good={calc.cashOnCash >= 5} />
                <MetricRow label="Down Payment" value={`$${fmt(calc.downPayment)}`} />
                <MetricRow label="Loan Amount" value={`$${fmt(calc.loanAmount)}`} />
                <MetricRow label="Annual NOI" value={`$${fmt(Math.round(calc.annualNOI))}`} />
                <MetricRow label="Total Interest Paid" value={`$${fmt(Math.round(calc.totalInterest))}`} />
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Monthly Breakdown</h3>
              <div className="space-y-2">
                <BreakdownRow label="Rental Income" value={rent} positive />
                <div className="border-t border-gray-50 my-2" />
                <BreakdownRow label="Mortgage Payment" value={-Math.round(calc.monthlyMortgage)} />
                <BreakdownRow label="Property Tax" value={-Math.round(calc.monthlyTax)} />
                <BreakdownRow label="Insurance" value={-insurance} />
                <BreakdownRow label="Maintenance" value={-Math.round(calc.monthlyMaint)} />
                <BreakdownRow label="Vacancy (4%)" value={-Math.round(calc.vacancy)} />
                <div className="border-t border-gray-100 my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-navy">Cash Flow</span>
                  <span className={`text-sm font-mono font-bold ${cashFlowColor}`}>
                    ${fmt(Math.round(calc.monthlyCashFlow))}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 text-center">
              <p className="text-sm font-semibold text-navy mb-1">Found something interesting?</p>
              <p className="text-xs text-muted mb-3">Browse real listings with built-in investment analysis</p>
              <Link href="/listings" className="btn-primary !px-5 !py-2.5 !text-sm no-underline inline-block">
                Browse Deals →
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted/50 mt-8 leading-relaxed max-w-3xl">
          This calculator provides estimates for informational purposes only. Actual mortgage payments depend on your
          lender, credit score, and specific terms. Rental income estimates, cap rates, and cash flow projections are not
          guaranteed. Consult a licensed mortgage broker and financial advisor before making investment decisions.
        </p>
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
