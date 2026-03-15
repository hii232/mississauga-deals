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
