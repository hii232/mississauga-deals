'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../layout';

function sourceLabel(src) {
  const map = { registration: 'Sign Up', quiz: 'Quiz', 'google-signin': 'Google', 'deal-alert': 'Alert' };
  return map[src] || src || 'Unknown';
}

function trafficLabel(src) {
  const map = {
    Direct: 'Direct',
    'google.com': 'Google Search',
    'facebook.com': 'Facebook',
    'm.facebook.com': 'Facebook (Mobile)',
    'l.facebook.com': 'Facebook (Link)',
    'instagram.com': 'Instagram',
    'linkedin.com': 'LinkedIn',
    'twitter.com': 'Twitter / X',
    'x.com': 'Twitter / X',
    'tiktok.com': 'TikTok',
    'youtube.com': 'YouTube',
    'reddit.com': 'Reddit',
    'bing.com': 'Bing',
  };
  return map[src] || src || 'Unknown';
}

function trafficColor(src) {
  if (src === 'Direct') return '#3B82F6';
  if (src.includes('google')) return '#34D399';
  if (src.includes('facebook') || src.includes('fb')) return '#818CF8';
  if (src.includes('instagram')) return '#F472B6';
  if (src.includes('linkedin')) return '#38BDF8';
  if (src.includes('twitter') || src.includes('x.com')) return '#94A3B8';
  if (src.includes('tiktok')) return '#F87171';
  if (src.includes('youtube')) return '#EF4444';
  if (src.includes('reddit')) return '#FB923C';
  return '#A78BFA';
}

/* SVG line chart for visitor data */
function LineChart({ data, height = 160 }) {
  if (!data || !data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const padding = { top: 10, right: 10, bottom: 25, left: 35 };
  const chartW = 600;
  const chartH = height;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * innerW,
    y: padding.top + innerH - (d.count / maxVal) * innerH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

  // Y-axis labels
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  // X-axis labels (show ~5 dates)
  const xStep = Math.max(1, Math.floor(data.length / 5));
  const xLabels = data.filter((_, i) => i % xStep === 0 || i === data.length - 1);

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTicks.map((tick) => {
        const y = padding.top + innerH - (tick / maxVal) * innerH;
        return (
          <g key={tick}>
            <line x1={padding.left} y1={y} x2={chartW - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <text x={padding.left - 6} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace">{tick}</text>
          </g>
        );
      })}

      {/* Area fill */}
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#3B82F6" stroke="#141B2D" strokeWidth="1.5" opacity={p.count > 0 ? 1 : 0.3} />
          <title>{`${p.date}: ${p.count} visitors`}</title>
        </g>
      ))}

      {/* X-axis date labels */}
      {xLabels.map((d) => {
        const idx = data.indexOf(d);
        const x = padding.left + (idx / (data.length - 1)) * innerW;
        const label = d.date.slice(5); // "MM-DD"
        return (
          <text key={d.date} x={x} y={chartH - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">{label}</text>
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
  const { adminKey } = useAdmin();
  const [leads, setLeads] = useState([]);
  const [visitorData, setVisitorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminKey) return;

    Promise.all([
      fetch('/api/admin/leads', { headers: { 'x-admin-key': adminKey } }).then((r) => r.json()),
      fetch('/api/admin/analytics', { headers: { 'x-admin-key': adminKey } }).then((r) => r.json()).catch(() => null),
    ])
      .then(([leadsData, analyticsData]) => {
        setLeads(leadsData.leads || []);
        setVisitorData(analyticsData);
      })
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

    // Response time
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
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  const maxSource = analytics ? Math.max(...Object.values(analytics.bySource), 1) : 1;
  const visitorTotal = visitorData?.visitors?.total || 0;
  const visitorToday = visitorData?.visitors?.today || 0;
  const visitorDaily = visitorData?.visitors?.daily || [];
  const trafficSources = visitorData?.sources || [];
  const topPages = visitorData?.topPages || [];
  const needsSetup = visitorData?.needsSetup;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-white/40">Visitor & lead performance metrics</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Visitors Today</p>
          <p className="font-mono text-2xl font-bold text-blue-400">{visitorToday}</p>
          <p className="text-[10px] text-white/30">page views</p>
        </div>
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Total Visitors</p>
          <p className="font-mono text-2xl font-bold text-white">{visitorTotal}</p>
          <p className="text-[10px] text-white/30">last 30 days</p>
        </div>
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Total Leads</p>
          <p className="font-mono text-2xl font-bold text-accent">{leads.length}</p>
          <p className="text-[10px] text-white/30">all time</p>
        </div>
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Conversion Rate</p>
          <p className="font-mono text-2xl font-bold text-green-400">
            {visitorTotal > 0 ? ((leads.length / visitorTotal) * 100).toFixed(1) : '—'}%
          </p>
          <p className="text-[10px] text-white/30">visitors to leads</p>
        </div>
      </div>

      {/* Visitor line graph */}
      <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-4">Visitors (30 days)</h2>
        {needsSetup ? (
          <div className="text-center py-8">
            <p className="text-sm text-white/40 mb-2">Visitor tracking not set up yet</p>
            <p className="text-xs text-white/20">Create the <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-300">page_views</code> table in Supabase to start tracking</p>
          </div>
        ) : visitorDaily.length > 0 ? (
          <LineChart data={visitorDaily} height={180} />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-white/40">No visitor data yet — views will appear as visitors arrive</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traffic sources */}
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">Traffic Sources</h2>
          {trafficSources.length > 0 ? (
            <div className="space-y-3">
              {trafficSources.map(({ source, count }) => {
                const pct = visitorTotal > 0 ? ((count / visitorTotal) * 100).toFixed(0) : 0;
                const color = trafficColor(source);
                return (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/70">{trafficLabel(source)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30">{pct}%</span>
                        <span className="text-sm font-mono font-bold text-white">{count}</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(count / trafficSources[0].count) * 100}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/30 text-center py-6">No traffic source data yet</p>
          )}
        </div>

        {/* Top pages */}
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">Top Pages</h2>
          {topPages.length > 0 ? (
            <div className="space-y-1">
              {topPages.map(({ page, count }, i) => (
                <div
                  key={page}
                  className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-white/20 w-5 shrink-0">{i + 1}.</span>
                    <span className="text-sm text-white/60 truncate">{page}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-blue-400 shrink-0 ml-3">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30 text-center py-6">No page data yet</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Lead performance section */}
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Lead Performance</h2>
        <p className="text-sm text-white/40 mb-4">Call tracking & engagement metrics</p>
      </div>

      {/* Lead metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Contact Rate</p>
          <p className="font-mono text-2xl font-bold text-accent">{analytics?.contactedPct || 0}%</p>
          <p className="text-[10px] text-white/30">of leads contacted</p>
        </div>
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Avg Calls/Lead</p>
          <p className="font-mono text-2xl font-bold text-green-400">{analytics?.avgCalls || '0'}</p>
          <p className="text-[10px] text-white/30">per contacted lead</p>
        </div>
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Avg Response</p>
          <p className="font-mono text-2xl font-bold text-amber-400">{analytics?.avgResponseHrs || '—'}</p>
          <p className="text-[10px] text-white/30">to first contact</p>
        </div>
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[9px] uppercase text-white/20 mb-1">Lead Sources</p>
          <p className="font-mono text-2xl font-bold text-white">{analytics ? Object.keys(analytics.bySource).length : 0}</p>
          <p className="text-[10px] text-white/30">active channels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead volume chart */}
        {analytics && (
          <div className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-5">
            <h2 className="text-sm font-bold text-white mb-4">Lead Volume (30 days)</h2>
            <div className="flex items-end gap-[3px] h-32">
              {analytics.daily.map((d) => (
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
        )}

        {/* Lead source breakdown */}
        {analytics && (
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
        )}
      </div>

      {/* Top property interests */}
      {analytics?.topProperties?.length > 0 && (
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
