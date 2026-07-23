// Distinct illustrated landmark scenes for Mississauga neighbourhood cards.
// Original artwork, palette-consistent, server components (no network, no photos
// required). Each neighbourhood maps to the archetype that fits it (waterfront /
// skyline / village / suburban / transit) AND gets a deterministic sky + light
// variation from its name, so same-archetype areas (e.g. all the waterfront
// hoods) still look distinct. Renders UNTIL a real photo is supplied (photo-ready).

const NAVY = '#1B2A4A';

// name → archetype. Anything unmapped falls back to 'suburban'.
const ARCHETYPE = {
  'Port Credit': 'waterfront',
  'Lakeview': 'waterfront',
  'Lakeview Village': 'waterfront',
  'Clarkson': 'waterfront',
  'Lorne Park': 'waterfront',
  'Mineola': 'waterfront',
  'Sheridan': 'waterfront',
  'City Centre': 'skyline',
  'Fairview': 'skyline',
  'Cooksville': 'skyline',
  'Hurontario': 'transit',
  'Streetsville': 'village',
  'Erindale': 'village',
  'Meadowvale': 'village',
};

export function archetypeFor(name) {
  return ARCHETYPE[name] || 'suburban';
}

// Deterministic hash from the name (stable across renders/SSR).
function hashName(name) {
  let h = 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

// Sky/light palettes — each area's card picks one by name hash, so cards vary.
const SKIES = [
  { from: '#243A61', to: '#5A6E8C', sun: '#FCD34D' }, // dusk blue
  { from: '#3A3560', to: '#8A6C86', sun: '#FBBF24' }, // twilight violet
  { from: '#2B4A6B', to: '#7FA0B8', sun: '#FDE68A' }, // clear afternoon
  { from: '#402E4B', to: '#9A5E6B', sun: '#FB923C' }, // sunset warm
  { from: '#213B57', to: '#5E7E93', sun: '#FCD34D' }, // overcast cool
];
const SUN_X = [130, 200, 270];

function variant(name) {
  const h = hashName(name);
  return {
    ...SKIES[h % SKIES.length],
    sunX: SUN_X[(h >> 3) % SUN_X.length],
    flip: ((h >> 5) & 1) === 1,
  };
}

// Shared sky gradient + soft sun-glow defs, unique id per instance.
function Sky({ id, v }) {
  const sunPct = ((v.sunX / 400) * 100).toFixed(0);
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={v.from} />
        <stop offset="100%" stopColor={v.to} />
      </linearGradient>
      <radialGradient id={`${id}-sun`} cx={`${sunPct}%`} cy="70%" r="60%">
        <stop offset="0%" stopColor={v.sun} stopOpacity="0.5" />
        <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function skyRect(uid) {
  return (
    <>
      <rect x="0" y="0" width="400" height="220" fill={`url(#${uid})`} />
      <rect x="0" y="0" width="400" height="220" fill={`url(#${uid}-sun)`} />
    </>
  );
}

function Waterfront({ uid, v }) {
  return (
    <>
      <Sky id={uid} v={v} />
      {skyRect(uid)}
      {/* sun */}
      <circle cx={v.sunX} cy="150" r="30" fill={v.sun} opacity="0.85" />
      {/* far shoreline */}
      <path d="M0 150 H400 V220 H0 Z" fill="#31456B" opacity="0.5" />
      {/* water */}
      <rect x="0" y="150" width="400" height="70" fill="#3B5480" opacity="0.55" />
      {[158, 170, 184, 198, 210].map((y, i) => (
        <rect key={y} x={20 + i * 12} y={y} width={360 - i * 20} height="2" rx="1" fill="#DCE6F5" opacity={0.18 + i * 0.04} />
      ))}
      {/* lighthouse */}
      <g>
        <rect x="322" y="96" width="16" height="60" fill="#F1F5F9" />
        <path d="M322 96 L338 96 L335 156 L325 156 Z" fill="#F1F5F9" />
        <rect x="322" y="112" width="16" height="8" fill="#EF4444" />
        <rect x="322" y="132" width="16" height="8" fill="#EF4444" />
        <rect x="320" y="86" width="20" height="12" rx="2" fill={NAVY} />
        <rect x="326" y="78" width="8" height="10" fill="#FBBF24" />
        <path d="M318 156 H342 L346 164 H314 Z" fill={NAVY} opacity="0.9" />
      </g>
      {/* sailboat (mirrors with flip for variety) */}
      <g opacity="0.9" transform={v.flip ? 'translate(210,0)' : ''}>
        <path d="M96 150 l18 0 -4 10 -10 0 z" fill="#F8FAFC" />
        <path d="M105 118 l0 32 14 0 z" fill="#F8FAFC" />
        <path d="M105 120 l-11 30 11 0 z" fill="#DCE6F5" />
      </g>
      {/* foreground rocks */}
      <path d="M0 206 q30 -16 64 0 q30 14 70 2 V220 H0 Z" fill={NAVY} />
    </>
  );
}

function Skyline({ uid, v }) {
  return (
    <>
      <Sky id={uid} v={v} />
      {skyRect(uid)}
      <g fill="#2C3F66">
        <rect x="30" y="96" width="30" height="124" />
        <rect x="330" y="70" width="28" height="150" />
        <rect x="364" y="110" width="30" height="110" />
      </g>
      {/* curved Absolute-style pair (mid) */}
      <g fill="#243559">
        <path d="M150 220 C138 190 168 176 150 150 C136 128 172 116 152 92 L176 92 C160 116 194 128 178 150 C162 176 190 190 178 220 Z" />
        <path d="M196 220 C186 196 210 184 196 162 C184 142 214 132 198 112 L218 112 C204 132 232 142 216 162 C202 184 224 196 214 220 Z" />
      </g>
      {/* lit windows */}
      <g fill="#FBBF24">
        {Array.from({ length: 30 }).map((_, i) => {
          const cols = [34, 44, 54, 336, 346, 370, 380];
          const x = cols[i % cols.length];
          const y = 104 + (i % 9) * 12;
          return (i * 7) % 3 === 0 ? <rect key={i} x={x} y={y} width="4" height="5" opacity={0.5 + (i % 3) * 0.2} /> : null;
        })}
      </g>
      {/* front low-rise + trees */}
      <rect x="0" y="196" width="400" height="24" fill="#1C2C4C" />
      {[24, 60, 100, 300, 340, 378].map((x, i) => (
        <g key={i} fill="#1C2C4C"><circle cx={x} cy="192" r="10" /><rect x={x - 1.5} y="192" width="3" height="8" /></g>
      ))}
    </>
  );
}

function Transit({ uid, v }) {
  return (
    <>
      <Sky id={uid} v={v} />
      {skyRect(uid)}
      {/* towers behind */}
      <g fill="#2C3F66">
        <rect x="40" y="70" width="30" height="150" />
        <rect x="80" y="100" width="24" height="120" />
        <rect x="300" y="86" width="28" height="134" />
        <rect x="336" y="112" width="30" height="108" />
      </g>
      {/* elevated LRT guideway */}
      <rect x="0" y="150" width="400" height="10" fill="#233457" />
      {[30, 110, 190, 270, 350].map((x) => (
        <rect key={x} x={x} y="160" width="10" height="44" fill="#233457" />
      ))}
      {/* LRT train */}
      <g>
        <rect x="150" y="128" width="120" height="24" rx="6" fill="#F1F5F9" />
        <rect x="150" y="128" width="120" height="8" rx="6" fill="#2563EB" />
        {[160, 182, 204, 226, 248].map((x) => (
          <rect key={x} x={x} y="138" width="12" height="9" rx="1.5" fill="#8AB6FF" />
        ))}
        <rect x="150" y="146" width="120" height="4" fill="#F59E0B" />
      </g>
      {/* platform + trees */}
      <rect x="0" y="204" width="400" height="16" fill="#1F2F50" />
      {[30, 70, 330, 372].map((x, i) => (
        <g key={i} fill="#1F2F50"><circle cx={x} cy="200" r="9" /><rect x={x - 1.5} y="200" width="3" height="7" /></g>
      ))}
    </>
  );
}

function Village({ uid, v }) {
  return (
    <>
      <Sky id={uid} v={v} />
      {skyRect(uid)}
      {/* storefront row */}
      {[
        ['#2C3F66', 40], ['#334770', 118], ['#2A3B63', 196], ['#35497A', 274], ['#2C3F66', 344],
      ].map(([c, x], i) => (
        <g key={i}>
          <rect x={x} y={120 - (i % 2) * 12} width="70" height={100 + (i % 2) * 12} fill={c} />
          <path d={`M${x - 6} ${120 - (i % 2) * 12} h82 l-8 -14 h-66 z`} fill="#1F2F50" />
          {/* awning */}
          <rect x={x + 6} y={150} width="58" height="10" fill={i % 2 ? '#EF4444' : '#2563EB'} opacity="0.8" />
          {/* lit window */}
          <rect x={x + 12} y={166} width="46" height="30" fill="#FBBF24" opacity="0.35" />
          <rect x={x + 30} y={166} width="10" height="54" fill="#1F2F50" />
        </g>
      ))}
      {/* lamp post */}
      <g fill="#12203C"><rect x="24" y="150" width="3" height="60" /><circle cx="25.5" cy="150" r="5" fill="#FBBF24" opacity="0.8" /></g>
      {/* street trees */}
      {[100, 260].map((x, i) => (
        <g key={i} fill="#1C2C4C"><circle cx={x} cy="186" r="14" /><rect x={x - 2} y="186" width="4" height="24" /></g>
      ))}
      <rect x="0" y="208" width="400" height="12" fill="#16243F" />
    </>
  );
}

function Suburban({ uid, v }) {
  return (
    <>
      <Sky id={uid} v={v} />
      {skyRect(uid)}
      {/* sun peeking */}
      <circle cx={v.sunX} cy="120" r="22" fill={v.sun} opacity="0.7" />
      {/* rolling ground */}
      <path d="M0 168 q100 -22 200 0 t200 0 V220 H0 Z" fill="#2A3B63" />
      {/* houses (pitched roofs) */}
      {[
        [40, 128, '#334770'], [150, 118, '#2C3F66'], [262, 132, '#3A4E7C'],
      ].map(([x, top, c], i) => (
        <g key={i}>
          <rect x={x} y={top} width="86" height={168 - top} fill={c} />
          <path d={`M${x - 10} ${top} L${x + 43} ${top - 30} L${x + 96} ${top} Z`} fill="#1F2F50" />
          {/* door + windows lit */}
          <rect x={x + 34} y={top + 30} width="18" height={168 - top - 30} fill="#1B2A4A" />
          <rect x={x + 10} y={top + 22} width="16" height="14" fill="#FBBF24" opacity="0.5" />
          <rect x={x + 60} y={top + 22} width="16" height="14" fill="#FBBF24" opacity="0.5" />
        </g>
      ))}
      {/* trees */}
      {[8, 118, 232, 344, 386].map((x, i) => (
        <g key={i} fill="#1C2C4C"><circle cx={x} cy="150" r="16" /><rect x={x - 2.5} y="150" width="5" height="22" /></g>
      ))}
      <path d="M0 188 q200 -18 400 0 V220 H0 Z" fill="#16243F" />
    </>
  );
}

const SCENES = { waterfront: Waterfront, skyline: Skyline, transit: Transit, village: Village, suburban: Suburban };

/**
 * Renders the landmark scene for a neighbourhood. `name` chooses the archetype
 * and a deterministic sky/light variation, so same-archetype cards differ.
 */
export function NeighbourhoodScene({ name, className = '' }) {
  const kind = archetypeFor(name);
  const Scene = SCENES[kind] || Suburban;
  const uid = `nb-${(name || 'x').toLowerCase().replace(/[^a-z]/g, '')}`;
  const v = variant(name);
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false">
      <Scene uid={uid} v={v} />
    </svg>
  );
}
