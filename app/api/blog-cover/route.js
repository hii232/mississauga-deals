import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Generated magazine-style blog cover — guarantees every post has an image.
// GET /api/blog-cover?title=...&category=...
// Deterministic gradient per category so covers vary but stay on-brand.

const PALETTES = {
  default: ['#0F2A4A', '#1a3a5c'],
  strategy: ['#0F2A4A', '#14532D'],
  'market analysis': ['#0F2A4A', '#3B2F14'],
  neighbourhoods: ['#12303F', '#0F2A4A'],
  financing: ['#1E1B4B', '#0F2A4A'],
  'pre-construction': ['#3B2F14', '#0F2A4A'],
  news: ['#450A0A', '#0F2A4A'],
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || 'Mississauga Real Estate').slice(0, 120);
  const category = (searchParams.get('category') || '').slice(0, 40);
  const [c1, c2] = PALETTES[category.toLowerCase()] || PALETTES.default;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
          padding: '56px 64px',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', width: '100%', height: '4px', background: '#F5F2EC' }} />
          <div style={{ display: 'flex', width: '100%', height: '1px', background: 'rgba(245,242,236,0.5)', marginTop: '5px' }} />
          <div
            style={{
              display: 'flex',
              fontSize: '26px',
              color: '#F5F2EC',
              letterSpacing: '10px',
              marginTop: '28px',
              fontWeight: 700,
            }}
          >
            MISSISSAUGA INVESTOR
          </div>
          {category ? (
            <div
              style={{
                display: 'flex',
                fontSize: '20px',
                color: '#D4B36A',
                letterSpacing: '6px',
                marginTop: '14px',
                textTransform: 'uppercase',
              }}
            >
              {category.toUpperCase()}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 60 ? '52px' : '62px',
            color: '#FFFFFF',
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: '1000px',
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: '20px',
              color: 'rgba(245,242,236,0.75)',
              letterSpacing: '4px',
              marginBottom: '20px',
            }}
          >
            GTA REAL ESTATE INTELLIGENCE &middot; MISSISSAUGAINVESTOR.CA
          </div>
          <div style={{ display: 'flex', width: '100%', height: '1px', background: 'rgba(245,242,236,0.5)' }} />
          <div style={{ display: 'flex', width: '100%', height: '4px', background: '#F5F2EC', marginTop: '5px' }} />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
