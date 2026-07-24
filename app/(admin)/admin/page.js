'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from './layout';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function sourceLabel(src) {
  const map = {
    registration: 'Sign Up',
    quiz: 'Quiz',
    'google-signin': 'Google',
    'deal-alert': 'Alert',
  };
  return map[src] || src || 'Unknown';
}

function sourceColor(src) {
  const map = {
    registration: 'bg-accent/10 text-accent border-accent/20',
    quiz: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'google-signin': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'deal-alert': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return map[src] || 'bg-white/5 text-white/50 border-white/10';
}

export default function AdminDashboard() {
  const { adminKey } = useAdmin();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminKey) return;
    fetch('/api/admin/leads', { headers: { 'x-admin-key': adminKey } })
      .then((r) => r.json())
      .then((data) => {
        setLeads(data.leads || []);
        setStats(data.stats || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const recentLeads = leads.slice(0, 6);
  const sourceCounts = stats?.bySource || {};
  const maxSourceCount = Math.max(...Object.values(sourceCounts), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/40">Lead management overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="👥" label="Total Leads" value={stats?.total || 0} color="accent" />
        <StatCard icon="🆕" label="New This Week" value={stats?.newThisWeek || 0} color="green" />
        <StatCard icon="📞" label="Needs Follow-Up" value={stats?.needsFollowUp || 0} color="amber" />
        <StatCard icon="🚨" label="Overdue" value={stats?.overdue || 0} color="red" />
      </div>

      {/* Import subscribers — CSV upload into the leads database */}
      <ImportSubscribers />

      {/* Announcement broadcast — one-click send of the platform-launch email */}
      <AnnouncementBroadcast />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-[#141B2D] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-bold text-white">Recent Leads</h2>
            <Link
              href="/admin/leads"
              className="text-xs font-medium text-accent hover:text-accent-dark no-underline"
            >
              View all →
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">No leads yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-white truncate">{lead.name || '—'}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sourceColor(lead.source)}`}>
                        {sourceLabel(lead.source)}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 truncate">
                      {lead.email}{lead.phone ? ` · ${lead.phone}` : ''} · {timeAgo(lead.created_at)}
                    </p>
                    {lead.notes && (
                      <p className="text-[11px] text-white/30 italic mt-0.5 truncate max-w-md">
                        {lead.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-colors no-underline text-sm"
                        title="Call"
                      >
                        📞
                      </a>
                    )}
                    <a
                      href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.name || ''}, this is Hamza from MississaugaInvestor.ca!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-colors no-underline text-sm"
                      title="WhatsApp"
                    >
                      💬
                    </a>
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}?subject=${encodeURIComponent('Re: MississaugaInvestor.ca Inquiry')}`}
                        className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors no-underline text-sm"
                        title="Email"
                      >
                        ✉️
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Source Breakdown */}
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">Leads by Source</h2>
          <div className="space-y-3">
            {Object.entries(sourceCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => (
                <div key={source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/50">{sourceLabel(source)}</span>
                    <span className="text-xs font-mono font-bold text-white">{count}</span>
                  </div>
                  <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxSourceCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            {Object.keys(sourceCounts).length === 0 && (
              <p className="text-xs text-white/30 text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// One-click send of the platform-launch announcement email to the whole
// database. Uses the admin key already in context (same x-admin-key the rest of
// the dashboard uses), so there's no URL/secret fiddling. Clicking only emails
// Hamza a DRAFT — the actual send to contacts still requires the token button
// inside that draft, so this button can never blast the list by itself.
function AnnouncementBroadcast() {
  const { adminKey } = useAdmin();
  const [count, setCount] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!adminKey) return;
    fetch('/api/broadcast/announcement?count=1', { headers: { 'x-admin-key': adminKey } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && typeof d.recipients === 'number') setCount(d.recipients); })
      .catch(() => {});
  }, [adminKey]);

  async function sendDraft() {
    if (!adminKey || status === 'sending' || status === 'sent') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/broadcast/announcement', { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      if (res.ok && data.success) { setStatus('sent'); setResult(data); }
      else { setStatus('error'); setResult(data); }
    } catch {
      setStatus('error'); setResult({ error: 'Network error — try again.' });
    }
  }

  const n = result?.recipients ?? count;
  const btnLabel = status === 'sending' ? 'Sending draft…' : status === 'sent' ? 'Draft sent ✓' : 'Email me the draft';

  return (
    <div className="bg-[#141B2D] border border-accent/20 rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white">📣 Announcement Broadcast</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/50">
            Send the platform-launch email to your whole database
            {count != null ? ` — ${count.toLocaleString()} contact${count === 1 ? '' : 's'}` : ''}.
            It emails <span className="text-white/80">you</span> a draft first — nothing reaches your
            contacts until you open it and click <span className="text-white/80">&ldquo;Review &amp; Send&rdquo;</span>.
          </p>
        </div>
        <button
          onClick={sendDraft}
          disabled={!adminKey || status === 'sending' || status === 'sent'}
          className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
        >
          {btnLabel}
        </button>
      </div>

      {status === 'sent' && (
        <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-xs leading-relaxed text-green-300">
          ✅ Draft sent to <span className="font-semibold">{result?.draftSentTo || 'your inbox'}</span>
          {n != null ? ` (${Number(n).toLocaleString()} contacts)` : ''}. Open it and click
          <span className="font-semibold"> &ldquo;Review &amp; Send{n != null ? ` to ${Number(n).toLocaleString()}` : ''}&rdquo; </span>
          to send. Every email carries a one-click unsubscribe.
        </div>
      )}
      {status === 'error' && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs leading-relaxed text-red-300">
          Couldn&rsquo;t send the draft{result?.error ? `: ${result.error}` : ''}. Check that your admin key is entered and email (Resend) is configured.
        </div>
      )}
    </div>
  );
}

// Upload a subscriber CSV export (MailerLite, Mailchimp, etc.) straight into the
// leads database via /api/admin/newsletter-import, using the admin key already in
// context. The endpoint validates emails, dedupes, and skips anyone already in
// the database or unsubscribed — so re-uploading the same file is safe.
function ImportSubscribers() {
  const { adminKey } = useAdmin();
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !adminKey) return;
    setFileName(file.name);
    setStatus('uploading');
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch('/api/admin/newsletter-import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv', 'x-admin-key': adminKey },
        body: text,
      });
      const data = await res.json();
      if (res.ok && data.ok) { setStatus('done'); setResult(data); }
      else { setStatus('error'); setResult(data); }
    } catch {
      setStatus('error');
      setResult({ error: 'Upload failed — try again.' });
    }
    e.target.value = ''; // let the same file be re-selected
  }

  return (
    <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-5">
      <h2 className="text-sm font-bold text-white">📥 Import Subscribers</h2>
      <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/50">
        Upload a CSV export (MailerLite, Mailchimp, etc.) to add contacts to your database.
        Emails already in your database — and anyone unsubscribed — are skipped automatically, so it&rsquo;s safe to re-upload.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <label className={`inline-flex items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark ${status === 'uploading' || !adminKey ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          {status === 'uploading' ? 'Uploading…' : 'Choose CSV file'}
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFile}
            disabled={status === 'uploading' || !adminKey}
            className="hidden"
          />
        </label>
        {fileName && <span className="text-xs text-white/40 truncate max-w-[180px]">{fileName}</span>}
      </div>

      {status === 'done' && (
        <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-xs leading-relaxed text-green-300">
          ✅ Imported <span className="font-semibold">{result.imported}</span> new contact{result.imported === 1 ? '' : 's'}.
          {result.skippedExisting ? ` ${result.skippedExisting} already in your database (skipped).` : ''}
          {result.invalid ? ` ${result.invalid} row${result.invalid === 1 ? '' : 's'} had no valid email.` : ''}
          {typeof result.totalNowEligible === 'number' ? ` Your database now has ${result.totalNowEligible.toLocaleString()} eligible contacts.` : ''}
        </div>
      )}
      {status === 'error' && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs leading-relaxed text-red-300">
          Import failed{result?.error ? `: ${result.error}` : ''}. Check that the file is a CSV with an email column.
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    accent: 'border-accent/20 text-accent',
    green: 'border-green-500/20 text-green-400',
    amber: 'border-amber-500/20 text-amber-400',
    red: 'border-red-500/20 text-red-400',
  };
  const c = colorMap[color] || colorMap.accent;

  return (
    <div className={`bg-[#141B2D] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-colors`}>
      <div className="text-xl mb-2">{icon}</div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1">{label}</p>
      <p className={`font-mono text-2xl font-bold ${c.split(' ').pop()}`}>{value}</p>
    </div>
  );
}
