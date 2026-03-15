'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../layout';

function sourceLabel(src) {
  const map = { registration: 'Sign Up', quiz: 'Quiz', 'google-signin': 'Google', 'deal-alert': 'Alert' };
  return map[src] || src || 'Unknown';
}

export default function AnalyticsPage() {
  const { adminKey } = useAdmin();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminKey) return;
    fetch('/api/admin/leads', { headers: { 'x-admin-key': adminKey } })
      .then((r) => r.json())
      .then((data) => setLeads(data.leads || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminKey]);

  const analytics = useMemo(() => {
    if (!leads.length) return null;

    // Source breakdown
    const bySource = {};
    leads.forEach((l) => {
      const src = l.source || 'unknown';
      bySource[src] = (bySource[src] || 0) + 1;
    });

    // Daily volume (last 30 days)
    const now = new Date();
    const dailyMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    leads.forEach((l) => {
      const key = (l.created_at || '').split('T')[0];
      if (key in dailyMap) dailyMap[key]++;
    });
    const daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));
    const maxDaily = Math.max(...daily.map((d) => d.count), 1);

    // Call stats
    const contacted = leads.filter((l) => l.call_count > 0);
    const avgCalls = contacted.length
      ? (contacted.reduce((s, l) => s + (l.call_count || 0), 0) / contacted.length).toFixed(1)
      : '0';

    // Response time (avg hours between created_at and last_called_at)
    const withCalls = leads.filter((l) => l.last_called_at && l.created_at);
    let avgResponseHrs = '—';
    if (withCalls.length) {
      const totalHrs = withCalls.reduce((s, l) => {
        return s + (new Date(l.last_called_at) - new Date(l.created_at)) / (1000 * 60 * 60);
      }, 0);
      const hrs = totalHrs / withCalls.length;
      avgResponseHrs = hrs < 24 ? `${hrs.toFixed(0)}h` : `${(hrs / 24).toFixed(1)}d`;
    }

    // Top property interests
    const properties = {};
    leads.forEach((l) => {
      if (l.listing_address) {
        properties[l.listing_address] = (properties[l.listing_address] || 0) + 1;
      }
    });
    const topProperties = Object.entries(properties)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      bySource,
      daily,
      maxDaily,
      avgCalls,
      avgResponseHrs,
      contactedPct: leads.length ? ((contacted.length / leads.length) * 100).toFixed(0) : 0,
      topProperties,
    };
  }, [leads]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16">
        <p className="text-xl mb-2">📊</p>
        <p className="text-sm text-white/40">No analytics data yet — leads will appear here</p>
      </div>
    );
  }

  const maxSource = Math.max(...Object.values(analytics.bySource), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-white/40">Lead performance metrics</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Contact Rate</p>
          <p className="font-mono text-2xl font-bold text-accent">{analytics.contactedPct}%</p>
          <p className="text-[10px] text-white/30">of leads contacted</p>
        </div>
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Avg Calls/Lead</p>
          <p className="font-mono text-2xl font-bold text-green-400">{analytics.avgCalls}</p>
          <p className="text-[10px] text-white/30">per contacted lead</p>
        </div>
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Avg Response</p>
          <p className="font-mono text-2xl font-bold text-amber-400">{analytics.avgResponseHrs}</p>
          <p className="text-[10px] text-white/30">to first contact</p>
        </div>
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Total Leads</p>
          <p className="font-mono text-2xl font-bold text-white">{leads.length}</p>
          <p className="text-[10px] text-white/30">all time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily volume chart */}
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">Lead Volume (30 days)</h2>
          <div className="flex items-end gap-[3px] h-32">
            {analytics.daily.map((d, i) => (
              <div
                key={d.date}
                className="flex-1 group relative"
                title={`${d.date}: ${d.count} leads`}
              >
                <div
                  className="w-full bg-accent/60 hover:bg-accent rounded-t transition-colors"
                  style={{
                    height: `${Math.max((d.count / analytics.maxDaily) * 100, d.count > 0 ? 8 : 2)}%`,
                    minHeight: d.count > 0 ? '4px' : '1px',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-white/20">30 days ago</span>
            <span className="text-[9px] text-white/20">Today</span>
          </div>
        </div>

        {/* Source breakdown */}
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">Leads by Source</h2>
          <div className="space-y-4">
            {Object.entries(analytics.bySource)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => {
                const pct = ((count / leads.length) * 100).toFixed(0);
                return (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white/70">{sourceLabel(source)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30">{pct}%</span>
                        <span className="text-sm font-mono font-bold text-white">{count}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent-dark rounded-full transition-all duration-700"
                        style={{ width: `${(count / maxSource) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Top property interests */}
      {analytics.topProperties.length > 0 && (
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">Top Property Interests</h2>
          <div className="space-y-2">
            {analytics.topProperties.map(([address, count], i) => (
              <div
                key={address}
                className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/20 w-5">{i + 1}.</span>
                  <span className="text-sm text-white/70">{address}</span>
                </div>
                <span className="text-sm font-mono font-bold text-accent">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
