'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../layout';

// ── Helpers ──────────────────────────────────────────────
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

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

function sourceLabel(src) {
  const map = { registration: 'Sign Up', quiz: 'Quiz', 'google-signin': 'Google', 'deal-alert': 'Alert', 'exit-intent': 'Exit Intent', 'saved-search': 'Saved Search' };
  return map[src] || src || 'Unknown';
}

function sourceColor(src) {
  const map = {
    registration: 'bg-accent/10 text-accent border-accent/20',
    quiz: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'google-signin': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'deal-alert': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'exit-intent': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    'saved-search': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  };
  return map[src] || 'bg-white/5 text-white/50 border-white/10';
}

function statusBadge(lead) {
  const status = lead.status || 'new';
  const map = {
    new: { label: 'New', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    contacted: { label: 'Contacted', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    'following-up': { label: 'Following Up', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    callback: { label: 'Callback', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    'not-interested': { label: 'Not Interested', cls: 'bg-red-500/10 text-red-300 border-red-500/20' },
    ghosted: { label: 'Ghosted', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    archived: { label: 'Archived', cls: 'bg-white/5 text-white/30 border-white/10' },
  };
  return map[status] || { label: status, cls: 'bg-white/5 text-white/40 border-white/10' };
}

function urgencyIndicator(lead) {
  if (lead.status === 'archived' || lead.status === 'not-interested') return null;

  const now = Date.now();
  const created = new Date(lead.created_at).getTime();
  const hoursSinceCreated = (now - created) / (1000 * 60 * 60);

  // Brand new lead (< 24h, never contacted)
  if (hoursSinceCreated < 24 && !lead.call_count) {
    return { label: '🔥 Hot', cls: 'text-orange-400' };
  }

  // Has a scheduled follow-up
  if (lead.next_follow_up) {
    const days = daysUntil(lead.next_follow_up);
    if (days !== null && days < 0) return { label: '⚠️ Overdue', cls: 'text-red-400' };
    if (days !== null && days <= 2) return { label: '📞 Due Soon', cls: 'text-amber-400' };
  }

  // No contact in 15+ days
  const lastContact = lead.last_called_at ? new Date(lead.last_called_at).getTime() : created;
  const daysSince = (now - lastContact) / (1000 * 60 * 60 * 24);
  if (daysSince > 15 && (lead.call_count || 0) < 4) {
    return { label: '⚠️ Overdue', cls: 'text-red-400' };
  }

  return null;
}

const ACTIVITY_ICONS = {
  call: '📞',
  whatsapp: '💬',
  email: '✉️',
  note: '📝',
};

const OUTCOME_LABELS = {
  connected: '✅ Connected',
  'no-answer': '📵 No Answer',
  voicemail: '📩 Voicemail',
  callback: '🔄 Callback Requested',
  'not-interested': '❌ Not Interested',
  ghosted: '👻 Ghosted',
};

const SOURCES = ['All', 'registration', 'quiz', 'google-signin', 'deal-alert', 'exit-intent', 'saved-search'];
const STATUS_FILTERS = ['All', 'new', 'contacted', 'following-up', 'callback', 'not-interested', 'ghosted', 'archived'];

// ── Log Activity Modal ──────────────────────────────────
function LogActivityModal({ lead, onClose, onSave, saving }) {
  const [type, setType] = useState('call');
  const [outcome, setOutcome] = useState('connected');
  const [notes, setNotes] = useState('');

  const types = [
    { value: 'call', label: '📞 Call' },
    { value: 'whatsapp', label: '💬 WhatsApp' },
    { value: 'email', label: '✉️ Email' },
    { value: 'note', label: '📝 Note' },
  ];

  const outcomes = [
    { value: 'connected', label: 'Connected' },
    { value: 'no-answer', label: 'No Answer' },
    { value: 'voicemail', label: 'Voicemail' },
    { value: 'callback', label: 'Callback Requested' },
    { value: 'not-interested', label: 'Not Interested' },
    { value: 'ghosted', label: 'Ghosted / No Reply' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#0F1629] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base font-semibold text-white">Log Activity</h3>
            <p className="text-xs text-white/40">{lead.name || lead.email}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xl">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-[10px] uppercase text-white/30 font-semibold mb-2 block">Type</label>
            <div className="flex gap-2">
              {types.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    type === t.value
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome selector (not for notes) */}
          {type !== 'note' && (
            <div>
              <label className="text-[10px] uppercase text-white/30 font-semibold mb-2 block">Outcome</label>
              <div className="grid grid-cols-2 gap-2">
                {outcomes.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setOutcome(o.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                      outcome === o.value
                        ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[10px] uppercase text-white/30 font-semibold mb-2 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? What did they say? Next steps..."
              rows={4}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-accent/30 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white/40 hover:text-white/60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ type, outcome: type === 'note' ? 'connected' : outcome, notes })}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Activity'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Activity Timeline ───────────────────────────────────
function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-white/20">No activity logged yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((a, i) => (
        <div key={a.id} className="flex gap-3 relative">
          {/* Timeline line */}
          {i < activities.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-0 w-px bg-white/[0.06]" />
          )}

          {/* Icon */}
          <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-sm shrink-0 z-10">
            {ACTIVITY_ICONS[a.type] || '📌'}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold text-white capitalize">{a.type}</span>
              {a.outcome && a.type !== 'note' && (
                <span className="text-[10px] text-white/30">
                  {OUTCOME_LABELS[a.outcome] || a.outcome}
                </span>
              )}
              <span className="text-[10px] text-white/15 ml-auto shrink-0">
                {formatDateTime(a.created_at)}
              </span>
            </div>
            {a.notes && (
              <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap">{a.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main CRM Page ───────────────────────────────────────
export default function LeadsCRM() {
  const { adminKey } = useAdmin();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [logModal, setLogModal] = useState(null); // lead object when modal is open
  const [stats, setStats] = useState(null);

  async function fetchLeads() {
    if (!adminKey) return;
    try {
      const res = await fetch('/api/admin/leads', { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      setLeads(data.leads || []);
      setStats(data.stats || null);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeads(); }, [adminKey]);

  const filtered = useMemo(() => {
    let list = leads;

    // Hide archived by default (unless specifically filtering for archived)
    if (statusFilter !== 'archived') {
      list = list.filter((l) => l.status !== 'archived');
    }

    if (sourceFilter !== 'All') {
      list = list.filter((l) => l.source === sourceFilter);
    }
    if (statusFilter !== 'All') {
      list = list.filter((l) => l.status === statusFilter);
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
  }, [leads, sourceFilter, statusFilter, search]);

  async function saveActivity(leadId, activity) {
    setActionLoading(leadId);
    try {
      const res = await fetch(`/api/admin/leads?id=${leadId}`, {
        method: 'PATCH',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      const data = await res.json();
      if (data.archived) {
        // Move to archived status
        setLeads((prev) =>
          prev.map((l) => l.id === leadId ? { ...l, status: 'archived', call_count: data.call_count } : l)
        );
      } else {
        // Refresh to get updated activities
        await fetchLeads();
      }
      setLogModal(null);
    } catch {} finally {
      setActionLoading(null);
    }
  }

  async function toggleAccess(id, currentlyRevoked) {
    const action = currentlyRevoked ? 'restore access for' : 'revoke access for';
    if (!confirm(`Are you sure you want to ${action} this lead?`)) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/leads?id=${id}`, {
        method: 'PUT',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ revoke: !currentlyRevoked }),
      });
      setLeads((prev) =>
        prev.map((l) => l.id === id ? { ...l, access_revoked: !currentlyRevoked } : l)
      );
    } catch {} finally {
      setActionLoading(null);
    }
  }

  async function archiveLead(id) {
    if (!confirm('Archive this lead? You can find them later under the Archived filter.')) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/leads?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      setLeads((prev) =>
        prev.map((l) => l.id === id ? { ...l, status: 'archived' } : l)
      );
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
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-white">Lead Management</h1>
          <p className="text-sm text-white/40">{leads.filter((l) => l.status !== 'archived').length} active leads</p>
        </div>
        {stats && (
          <div className="flex gap-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5 text-center">
              <p className="text-lg font-bold text-green-400">{stats.newThisWeek}</p>
              <p className="text-[9px] text-green-400/50 uppercase">New</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 text-center">
              <p className="text-lg font-bold text-amber-400">{stats.needsFollowUp}</p>
              <p className="text-[9px] text-amber-400/50 uppercase">Follow Up</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 text-center">
              <p className="text-lg font-bold text-red-400">{stats.overdue}</p>
              <p className="text-[9px] text-red-400/50 uppercase">Overdue</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
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
              {src === 'All' ? 'All Sources' : sourceLabel(src)}
            </button>
          ))}
        </div>

        {/* Status pills + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                  statusFilter === st
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/[0.02] text-white/25 hover:text-white/40 border border-white/[0.04]'
                }`}
              >
                {st === 'All' ? 'All Status' : st.replace('-', ' ')}
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
            const badge = statusBadge(lead);
            const urgency = urgencyIndicator(lead);
            const isLoading = actionLoading === lead.id;
            const ghostedCount = (lead.activities || []).filter((a) =>
              ['no-answer', 'ghosted', 'voicemail'].includes(a.outcome)
            ).length;

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
                    {(lead.name || lead.email || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">{lead.name || '—'}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${sourceColor(lead.source)}`}>
                        {sourceLabel(lead.source)}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {lead.access_revoked && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-red-500/15 text-red-400 border-red-500/25">
                          🚫 Revoked
                        </span>
                      )}
                      {urgency && (
                        <span className={`text-[10px] font-semibold ${urgency.cls}`}>
                          {urgency.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 truncate">
                      {lead.email || 'No email'}{lead.phone ? ` · ${lead.phone}` : ''} · {timeAgo(lead.created_at)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-[9px] text-white/20 uppercase">Contacts</p>
                      <p className="text-sm font-mono font-bold text-white">{lead.call_count || 0}</p>
                    </div>
                    {lead.next_follow_up && lead.status !== 'archived' && (
                      <div className="text-center">
                        <p className="text-[9px] text-white/20 uppercase">Follow Up</p>
                        <p className={`text-xs font-medium ${
                          daysUntil(lead.next_follow_up) < 0 ? 'text-red-400' :
                          daysUntil(lead.next_follow_up) <= 2 ? 'text-amber-400' : 'text-white/40'
                        }`}>
                          {daysUntil(lead.next_follow_up) < 0
                            ? `${Math.abs(daysUntil(lead.next_follow_up))}d overdue`
                            : daysUntil(lead.next_follow_up) === 0
                            ? 'Today'
                            : `in ${daysUntil(lead.next_follow_up)}d`}
                        </p>
                      </div>
                    )}
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
                  <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-4">
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

                    {/* Quiz notes */}
                    {lead.notes && (
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <p className="text-[9px] uppercase text-white/20 mb-1">Saved Search / Quiz</p>
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
                            ${lead.listing_price >= 1000000
                              ? (lead.listing_price / 1000000).toFixed(2) + 'M'
                              : (lead.listing_price / 1000).toFixed(0) + 'K'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Follow-up tracker */}
                    <div className="bg-white/[0.02] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] uppercase text-white/20">Contact Progress</p>
                        {lead.next_follow_up && lead.status !== 'archived' && (
                          <p className="text-[10px] text-white/30">
                            Next follow-up: <span className={
                              daysUntil(lead.next_follow_up) < 0 ? 'text-red-400 font-semibold' : 'text-white/50'
                            }>{formatDate(lead.next_follow_up)}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`w-8 h-2 rounded-full ${
                                i <= ghostedCount
                                  ? 'bg-red-500/50'
                                  : i <= (lead.call_count || 0)
                                  ? 'bg-accent'
                                  : 'bg-white/[0.06]'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-white/30">
                          {lead.call_count || 0} contacts · {ghostedCount} no-reply
                          {ghostedCount >= 4 && ' · Auto-archived'}
                        </span>
                      </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white/[0.02] rounded-lg p-3">
                      <p className="text-[9px] uppercase text-white/20 mb-3">Activity Timeline</p>
                      <ActivityTimeline activities={lead.activities || []} />
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
                        onClick={() => setLogModal(lead)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50"
                      >
                        ✏️ Log Activity
                      </button>
                      <button
                        onClick={() => toggleAccess(lead.id, lead.access_revoked)}
                        disabled={isLoading}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ml-auto ${
                          lead.access_revoked
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                            : 'bg-red-500/[0.06] border border-red-500/10 text-red-400/70 hover:bg-red-500/10'
                        }`}
                      >
                        {lead.access_revoked ? '✅ Restore Access' : '🚫 Revoke Access'}
                      </button>
                      {lead.status !== 'archived' && (
                        <button
                          onClick={() => archiveLead(lead.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/[0.06] border border-red-500/10 text-red-400/70 text-xs font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          🗑 Archive
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Log Activity Modal */}
      {logModal && (
        <LogActivityModal
          lead={logModal}
          onClose={() => setLogModal(null)}
          onSave={(activity) => saveActivity(logModal.id, activity)}
          saving={actionLoading === logModal.id}
        />
      )}
    </div>
  );
}
