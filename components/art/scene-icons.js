// Illustrated mini-scenes for "How It Works" and feature panels.
// Original artwork in the site palette; server components, inline SVG.

const NAVY = '#1B2A4A';
const ACCENT = '#2563EB';
const GOLD = '#F59E0B';
const GREEN = '#10B981';

export function BrowseScene({ className = '' }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="80" cy="106" rx="58" ry="8" fill={NAVY} opacity="0.06" />
      {/* house */}
      <path d="M38 62 L80 30 L122 62" fill="none" stroke={NAVY} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="48" y="60" width="64" height="44" rx="4" fill="#fff" stroke={NAVY} strokeWidth="4" />
      <rect x="59" y="72" width="14" height="14" rx="2" fill={ACCENT} opacity="0.25" stroke={ACCENT} strokeWidth="2.5" />
      <rect x="87" y="72" width="14" height="32" rx="2" fill={NAVY} opacity="0.12" stroke={NAVY} strokeWidth="2.5" />
      {/* score badge */}
      <circle cx="118" cy="38" r="17" fill={GREEN} />
      <text x="118" y="43" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">8.6</text>
      {/* sparkle */}
      <path d="M30 34 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill={GOLD} opacity="0.9" />
    </svg>
  );
}

export function AnalysisScene({ className = '' }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="80" cy="106" rx="58" ry="8" fill={NAVY} opacity="0.06" />
      {/* chart card */}
      <rect x="30" y="26" width="86" height="70" rx="8" fill="#fff" stroke={NAVY} strokeWidth="4" />
      <rect x="42" y="66" width="10" height="20" rx="2" fill={ACCENT} opacity="0.35" />
      <rect x="58" y="56" width="10" height="30" rx="2" fill={ACCENT} opacity="0.6" />
      <rect x="74" y="46" width="10" height="40" rx="2" fill={ACCENT} />
      <path d="M42 52 L64 42 L80 34 L102 38" fill="none" stroke={GREEN} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="102" cy="38" r="4" fill={GREEN} />
      {/* dollar chip */}
      <rect x="40" y="16" width="30" height="14" rx="7" fill={GOLD} opacity="0.9" />
      <text x="55" y="26.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">$</text>
      {/* magnifier */}
      <circle cx="116" cy="82" r="18" fill="#fff" stroke={NAVY} strokeWidth="5" />
      <line x1="129" y1="95" x2="142" y2="108" stroke={NAVY} strokeWidth="6" strokeLinecap="round" />
      <path d="M108 82 l5 5 10 -10" fill="none" stroke={GREEN} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ConnectScene({ className = '' }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="80" cy="106" rx="58" ry="8" fill={NAVY} opacity="0.06" />
      {/* speech bubbles */}
      <path d="M28 42 h52 a8 8 0 0 1 8 8 v18 a8 8 0 0 1 -8 8 h-30 l-12 12 v-12 h-10 a8 8 0 0 1 -8 -8 v-18 a8 8 0 0 1 8 -8 Z" fill="#fff" stroke={NAVY} strokeWidth="4" />
      <circle cx="42" cy="59" r="3.5" fill={NAVY} opacity="0.5" />
      <circle cx="55" cy="59" r="3.5" fill={NAVY} opacity="0.5" />
      <circle cx="68" cy="59" r="3.5" fill={NAVY} opacity="0.5" />
      <path d="M132 26 h-42 a8 8 0 0 0 -8 8 v14 a8 8 0 0 0 8 8 h24 l10 10 v-10 h8 a8 8 0 0 0 8 -8 v-14 a8 8 0 0 0 -8 -8 Z" fill={ACCENT} />
      <path d="M96 40 l6 6 12 -12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {/* calendar */}
      <rect x="96" y="72" width="44" height="34" rx="6" fill="#fff" stroke={NAVY} strokeWidth="4" />
      <rect x="96" y="72" width="44" height="10" rx="5" fill={NAVY} />
      <rect x="104" y="88" width="8" height="8" rx="2" fill={GOLD} />
      <rect x="117" y="88" width="8" height="8" rx="2" fill={NAVY} opacity="0.15" />
      <rect x="129" y="88" width="8" height="8" rx="2" fill={NAVY} opacity="0.15" />
    </svg>
  );
}
