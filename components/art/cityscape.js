// Original Mississauga skyline artwork — pure SVG, zero network requests.
// The two curved towers are the Absolute World pair, the city's landmark.
// Server components; deterministic output (no randomness) so SSG stays stable.

// Deterministic "lit window" grid — (i*7 + j*13) % k picks which windows glow
function Windows({ x, y, w, h, cols, rows, litColor = '#F59E0B', litOpacity = 0.85, density = 3 }) {
  const cw = w / cols;
  const ch = h / rows;
  const cells = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if ((i * 7 + j * 13) % density === 0) {
        cells.push(
          <rect
            key={`${i}-${j}`}
            x={x + i * cw + cw * 0.25}
            y={y + j * ch + ch * 0.3}
            width={cw * 0.5}
            height={ch * 0.4}
            fill={litColor}
            opacity={litOpacity * (((i * 5 + j * 3) % 3) === 0 ? 1 : 0.55)}
            rx={0.5}
          />
        );
      }
    }
  }
  return <g>{cells}</g>;
}

// Absolute World tower — vase-curved silhouette built from stacked bezier bulges
function AbsoluteTower({ x, y, h, w, fill, flip = false }) {
  const s = flip ? -1 : 1;
  const cx = x;
  // Curvy outline: narrow base, bulge low-mid, pinch, bulge upper, tapered top
  const d = [
    `M ${cx - w * 0.28} ${y}`,
    `C ${cx - w * 0.55 * s - (flip ? 0 : 0)} ${y - h * 0.18}, ${cx - w * 0.15} ${y - h * 0.3}, ${cx - w * 0.45} ${y - h * 0.46}`,
    `C ${cx - w * 0.62} ${y - h * 0.58}, ${cx - w * 0.18} ${y - h * 0.68}, ${cx - w * 0.38} ${y - h * 0.82}`,
    `C ${cx - w * 0.46} ${y - h * 0.9}, ${cx - w * 0.24} ${y - h * 0.96}, ${cx - w * 0.2} ${y - h}`,
    `L ${cx + w * 0.2} ${y - h}`,
    `C ${cx + w * 0.24} ${y - h * 0.96}, ${cx + w * 0.5} ${y - h * 0.88}, ${cx + w * 0.34} ${y - h * 0.78}`,
    `C ${cx + w * 0.18} ${y - h * 0.66}, ${cx + w * 0.58} ${y - h * 0.56}, ${cx + w * 0.42} ${y - h * 0.44}`,
    `C ${cx + w * 0.28} ${y - h * 0.32}, ${cx + w * 0.5} ${y - h * 0.16}, ${cx + w * 0.3} ${y}`,
    'Z',
  ].join(' ');
  return (
    <g>
      <path d={d} fill={fill} />
      {/* floor lines suggest the rotating balconies */}
      {Array.from({ length: 9 }).map((_, i) => {
        const fy = y - (h * (i + 1)) / 10;
        const fw = w * (0.62 + 0.18 * Math.sin((i / 9) * Math.PI * 2 + (flip ? 2 : 0.6)));
        return (
          <rect key={i} x={cx - fw / 2} y={fy} width={fw} height={1.2} fill="#fff" opacity={0.07} rx={0.6} />
        );
      })}
    </g>
  );
}

function BoxTower({ x, y, w, h, fill, windows, spire = false }) {
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} fill={fill} rx={1.5} />
      {spire ? <rect x={x + w / 2 - 1} y={y - h - 14} width={2} height={14} fill={fill} /> : null}
      {windows ? (
        <Windows x={x + 2} y={y - h + 6} w={w - 4} h={h * 0.85} cols={Math.max(3, Math.floor(w / 8))} rows={Math.max(6, Math.floor(h / 14))} {...windows} />
      ) : null}
    </g>
  );
}

function Trees({ x, y, count, fill, spread = 120 }) {
  return (
    <g fill={fill}>
      {Array.from({ length: count }).map((_, i) => {
        const tx = x + (i * spread) / count + ((i * 37) % 13);
        const r = 7 + ((i * 11) % 6);
        return (
          <g key={i}>
            <circle cx={tx} cy={y - r - 4} r={r} />
            <rect x={tx - 1} y={y - 6} width={2} height={6} />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Full skyline panorama. Sits at the bottom of a hero/CTA band.
 * variant: 'dusk' (homepage hero) | 'night' (CTA, more lit windows)
 * Parent controls sky color; this renders layered silhouettes + glow.
 */
export function CityscapePanorama({ variant = 'dusk', className = '' }) {
  const night = variant === 'night';
  const back = night ? '#141F38' : '#223458';
  const mid = night ? '#0F1930' : '#1B2A4A';
  const front = night ? '#0A1122' : '#131F38';
  const winOpacity = night ? 0.9 : 0.5;
  const winDensity = night ? 2 : 3;

  return (
    <svg
      viewBox="0 0 1440 300"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* dusk glow on the horizon */}
      <defs>
        <radialGradient id={`glow-${variant}`} cx="50%" cy="100%" r="75%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity={night ? 0.16 : 0.3} />
          <stop offset="45%" stopColor="#F59E0B" stopOpacity={night ? 0.05 : 0.12} />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="1440" height="300" fill={`url(#glow-${variant})`} />

      {/* ── back layer ── */}
      <g opacity="0.55">
        <BoxTower x={40} y={300} w={52} h={130} fill={back} />
        <BoxTower x={130} y={300} w={40} h={168} fill={back} />
        <BoxTower x={255} y={300} w={58} h={120} fill={back} />
        <BoxTower x={455} y={300} w={44} h={150} fill={back} />
        <BoxTower x={585} y={300} w={64} h={116} fill={back} />
        <BoxTower x={905} y={300} w={48} h={158} fill={back} />
        <BoxTower x={1035} y={300} w={56} h={122} fill={back} />
        <BoxTower x={1215} y={300} w={42} h={172} fill={back} />
        <BoxTower x={1330} y={300} w={60} h={128} fill={back} />
      </g>

      {/* ── mid layer ── */}
      <g opacity="0.85">
        <BoxTower x={85} y={300} w={54} h={192} fill={mid} spire windows={{ litOpacity: winOpacity * 0.6, density: winDensity + 1 }} />
        <BoxTower x={205} y={300} w={62} h={148} fill={mid} windows={{ litOpacity: winOpacity * 0.6, density: winDensity + 1 }} />
        <BoxTower x={330} y={300} w={48} h={210} fill={mid} windows={{ litOpacity: winOpacity * 0.6, density: winDensity + 1 }} />
        <BoxTower x={520} y={300} w={56} h={172} fill={mid} windows={{ litOpacity: winOpacity * 0.6, density: winDensity + 1 }} />
        <BoxTower x={960} y={300} w={58} h={188} fill={mid} spire windows={{ litOpacity: winOpacity * 0.6, density: winDensity + 1 }} />
        <BoxTower x={1105} y={300} w={50} h={156} fill={mid} windows={{ litOpacity: winOpacity * 0.6, density: winDensity + 1 }} />
        <BoxTower x={1255} y={300} w={64} h={200} fill={mid} windows={{ litOpacity: winOpacity * 0.6, density: winDensity + 1 }} />
      </g>

      {/* ── front layer: Absolute World pair + low-rise + trees ── */}
      <g>
        <AbsoluteTower x={735} y={300} h={252} w={64} fill={front} />
        <AbsoluteTower x={825} y={300} h={208} w={56} fill={front} flip />
        <BoxTower x={640} y={300} w={52} h={132} fill={front} windows={{ litOpacity: winOpacity, density: winDensity }} />
        <BoxTower x={885} y={300} w={44} h={108} fill={front} windows={{ litOpacity: winOpacity, density: winDensity }} />
        {/* low-rise strips */}
        <rect x={0} y={272} width={340} height={28} fill={front} rx={2} />
        <rect x={1130} y={276} width={310} height={24} fill={front} rx={2} />
        <Trees x={370} y={300} count={5} fill={front} spread={110} />
        <Trees x={1010} y={300} count={4} fill={front} spread={90} />
        <Trees x={8} y={272} count={4} fill={front} spread={100} />
      </g>
    </svg>
  );
}

/** Thin silhouette strip — section divider between white sections. */
export function SkylineStrip({ className = '', tone = '#1B2A4A', opacity = 0.06 }) {
  return (
    <svg viewBox="0 0 1440 60" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true" focusable="false">
      <g fill={tone} opacity={opacity}>
        <rect x={0} y={38} width={190} height={22} />
        <rect x={210} y={22} width={34} height={38} />
        <rect x={258} y={32} width={44} height={28} />
        <rect x={330} y={14} width={30} height={46} />
        <rect x={396} y={28} width={52} height={32} />
        <path d="M520 60 C512 42 528 34 520 18 L544 18 C536 34 552 42 544 60 Z" />
        <path d="M572 60 C566 46 578 38 572 26 L590 26 C584 38 596 46 590 60 Z" />
        <rect x={640} y={30} width={40} height={30} />
        <rect x={710} y={18} width={30} height={42} />
        <rect x={782} y={34} width={48} height={26} />
        <rect x={868} y={24} width={34} height={36} />
        <rect x={940} y={12} width={28} height={48} />
        <rect x={1006} y={30} width={52} height={30} />
        <circle cx={1092} cy={52} r={9} />
        <circle cx={1114} cy={50} r={11} />
        <circle cx={1136} cy={53} r={8} />
        <rect x={1170} y={26} width={36} height={34} />
        <rect x={1240} y={36} width={200} height={24} />
      </g>
    </svg>
  );
}
