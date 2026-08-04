import { ImageResponse } from 'next/og';

// Apple touch icon - the tile iOS uses when a visitor adds the site to their
// home screen. Flagged as missing by the Seobility audit; without it iOS
// screenshots the page and uses that, which looks broken.
//
// Generated rather than committed as a binary so it stays in sync with the
// brand gradient in public/icon.svg (which iOS cannot use - apple-touch-icon
// must be a raster format). 180x180 is the size current iOS devices request.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Same gradient stops as public/icon.svg.
          background: 'linear-gradient(135deg, #1A73E8 0%, #0F2A4A 100%)',
          color: 'white',
          fontSize: 92,
          fontWeight: 800,
          letterSpacing: '-4px',
        }}
      >
        MI
      </div>
    ),
    { ...size }
  );
}
