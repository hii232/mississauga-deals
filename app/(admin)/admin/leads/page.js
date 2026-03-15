'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../layout';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sourceLabel(src) {
  const map = { registration: 'Sign Up', quiz: 'Quiz', 'google-signin': 'Google', 'deal-alert': 'Alert' };
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

function urgencyColor(lead) {
  const created = new Date(lead.created_at);
  const now = Date.now();
  const hoursSince = (now - created.getTime()) / (1000 * 60 * 60);
  const lastContact = lead.last_called_at ? new Date(lead.last_called_at) : created;
  const daysSinceContact = (now - lastContact.getTime()) / (1000 * 60 * 60 * 24);

  if (hoursSince < 24 && !lead.call_count) return { label: 'New', cls: 'bg-green-500/10 text-green-400 border-green-500/20' };
  if (daysSinceContact > 7) return { label: 'Overdue', cls: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (daysSinceContact > 3) return { label: 'Follow Up', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  return { label: 'Active', cls: 'bg-white/5 text-white/40 border-white/10' };
}

function statusFromCalls(count) {
  if (!count) return 'New';
  if (count === 1) return 'Contacted';
  if (count <= 3) return 'Following Up';
  return 'Completed';
}

const SOURCES = ['All', 'registration', 'quiz', 'google-signin', 'deal-alert'];

export default function LeadsCRM() {
  const { adminKey } = useAdmin();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  async function fetchLeads() {
    if (!adminKey) return;
    try {
      const res = await fetch('/api/admin/leads', { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      setLeads(data.leads || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeads(); }, [adminKey]);

  const filtered = useMemo(() => {
    let list = leads;
    if (sourceFilter !== 'All') {
      list = list.filter((l) => l.source === sourceFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (l) =>
          (l.name || '').toLowerCase().includes(q) ||
          (l.email || '').toLowerCase().includes(q) ||
          (l.phone || '').includes(q)
      );
    }
    return list;
  }, [leads, sourceFilter, search]);

  async function logCall(id) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/leads?id=${id}`, {
        method: 'PATCH',
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (data.deleted) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        setExpandedId(null);
      } else {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === id ? { ...l, call_count: data.call_count, last_called_at: data.last_called_at } : l
          )
        );
      }
    } catch {} finally {
      setActionLoading(null);
    }
  }

  async function archiveLead(id) {
    if (!confirm('Archive this lead? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/leads?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setExpandedId(null);
    } catch {} finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-white">Leads</h1>
          <p className="text-sm text-white/40">{leads.length} total leads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Source pills */}
        <div className="flex flex-wrap gap-1.5">
          {SOURCES.map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sourceFilter === src
                  ? 'bg-accent text-white'
                  : 'bg-white/[0.04] text-white/40 hover:text-white/60 border border-white/[0.06]'
              }`}
            >
              {src === 'All' ? 'All' : sourceLabel(src)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/30"
          />
        </div>
      </div>

      {/* Leads list */}
      {filtered.length === 0 ? (
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-12 text-center">
          <p className="text-xl mb-2">📭</p>
          <p className="text-sm text-white/40">No leads found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => {
            const expanded = expandedId === lead.id;
            const urgency = urgencyColor(lead);
            const status = statusFromCalls(lead.call_count);
            const isLoading = actionLoading === lead.id;

            return (
              <div
                key={lead.id}
                className={`bg-[#141B2D] border rounded-xl overflow-hidden transition-colors ${
                  expanded ? 'border-accent/20' : 'border-white/[0.06] hover:border-white/10'
                }`}
              >
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : lead.id)}
                >
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold shrink-0">
                    {(lead.name || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-white truncate">{lead.name || '—'}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${sourceColor(lead.source)}`}>
                        {sourceLabel(lead.source)}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${urgency.cls}`}>
                        {urgency.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 truncate">
                      {lead.email || 'No email'}{lead.phone ? ` · ${lead.phone}` : ''} · {timeAgo(lead.created_at)}
                    </p>
                  </div>

                  {/* Call count */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <p className="text-[9px] text-white/20 uppercase">Calls</p>
                      <p className="text-sm font-mono font-bold text-white">{lead.call_count || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-white/20 uppercase">Status</p>
                      <p className="text-xs font-medium text-white/50">{status}</p>
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg
                    className={`h-4 w-4 text-white/20 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>

                {/* Expanded */}
                {expanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-3">
                    {/* Contact details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <p className="text-[9px] uppercase text-white/20 mb-1">Email</p>
                        <p className="text-sm text-white font-medium truncate">{lead.email || '—'}</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <p className="text-[9px] uppercase text-white/20 mb-1">Phone</p>
                        <p className="text-sm text-white font-medium">{lead.phone || '—'}</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <p className="text-[9px] uppercase text-white/20 mb-1">Signed Up</p>
                        <p className="text-sm text-white font-medium">{formatDate(lead.created_at)}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {lead.notes && (
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <p className="text-[9px] uppercase text-white/20 mb-1">Notes / Quiz Answers</p>
                        <p className="text-sm text-white/70 whitespace-pre-wrap">{lead.notes}</p>
                      </div>
                    )}

                    {/* Listing interest */}
                    {lead.listing_address && (
                      <div className="bg-accent/[0.04] border border-accent/10 rounded-lg p-3">
                        <p className="text-[9px] uppercase text-accent/50 mb-1">Property Interest</p>
                        <p className="text-sm text-white font-medium">{lead.listing_address}</p>
                        {lead.listing_price && (
                          <p className="text-xs text-white/40">
                            ${(lead.listing_price / 1000).toFixed(0)}K
                          </p>
                        )}
                      </div>
                    )}

                    {/* Call tracking */}
                    <div className="bg-white/[0.02] rounded-lg p-3">
                      <p className="text-[9px] uppercase text-white/20 mb-1">Call History</p>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-lg font-mono font-bold text-white">{lead.call_count || 0}</span>
                          <span className="text-xs text-white/30 ml-1">/ 4 calls</span>
                        </div>
                        {/* Progress bar */}
                        <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all"
                            style={{ width: `${((lead.call_count || 0) / 4) * 100}%` }}
                          />
                        </div>
                        {lead.last_called_at && (
                          <p className="text-xs text-white/30 shrink-0">
                            Last: {timeAgo(lead.last_called_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors no-underline"
                        >
                          📞 Call
                        </a>
                      )}
                      <a
                        href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.name || ''}, this is Hamza from MississaugaInvestor.ca!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors no-underline"
                      >
                        💬 WhatsApp
                      </a>
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}?subject=${encodeURIComponent('Re: MississaugaInvestor.ca')}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/20 transition-colors no-underline"
                        >
                          ✉️ Email
                        </a>
                      )}
                      <button
                        onClick={() => logCall(lead.id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/60 text-xs font-medium hover:bg-white/[0.08] transition-colors disabled:opacity-50"
                      >
                        {isLoading ? '...' : '✅ Log Call'}
                      </button>
                      <button
                        onClick={() => archiveLead(lead.id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/[0.06] border border-red-500/10 text-red-400/70 text-xs font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50 ml-auto"
                      >
                        🗑 Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
