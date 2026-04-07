import { NextResponse } from 'next/server';

const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_VOW_TOKEN || process.env.AMPRE_TOKEN;

/**
 * Deduplicate AMPRE photo URLs server-side.
 * AMPRE returns each photo in ~5 size variants (240, 960, 1920, 3840, default).
 * We keep only the best resolution per unique base image.
 */
function dedup(urls) {
  if (!urls.length) return urls;
  const groups = {};
  for (const url of urls) {
    const match = url.match(/\/([A-Za-z0-9+/_=-]+\.jpe?g)$/i);
    const key = match ? match[1] : url;
    if (!groups[key]) groups[key] = [];
    groups[key].push(url);
  }
  const result = [];
  for (const key of Object.keys(groups)) {
    const variants = groups[key];
    const scored = variants.map((u) => {
      const sizeMatch = u.match(/rs:fit:(\d+)/);
      const size = sizeMatch ? parseInt(sizeMatch[1]) : 500;
      return { url: u, size };
    });
    scored.sort((a, b) => b.size - a.size);
    // Prefer 1920 over 3840 (unwatermarked original)
    const pick = scored.length > 1 && scored[0].size >= 3840 ? scored[1] : scored[0];
    result.push(pick.url);
  }
  return result;
}

async function fetchMedia(filter, top = 500) {
  const url = BASE + '/Media?$filter=' + encodeURIComponent(filter)
    + '&$orderby=Order asc&$top=' + top + '&$select=MediaURL,Order';
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data?.value) return [];
  const urls = [];
  const seen = new Set();
  for (const m of data.value) {
    const u = m.MediaURL || m.MediaUrl || '';
    if (u && !seen.has(u)) { seen.add(u); urls.push(u); }
  }
  return urls;
}

export async function GET(request) {
  if (!TOK) return NextResponse.json({ error: 'AMPRE_TOKEN not set' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    // Try ResourceRecordKey first
    let urls = await fetchMedia("ResourceRecordKey eq '" + id + "'");

    // Fallback: ListingKey
    if (!urls.length) {
      urls = await fetchMedia("ListingKey eq '" + id + "'");
    }

    // Fallback: Navigation property
    if (!urls.length) {
      const navUrl = BASE + "/Property('" + id + "')/Media?$orderby=Order asc&$top=500&$select=MediaURL,Order";
      const res = await fetch(navUrl, {
        headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.value) {
          const seen = new Set();
          for (const m of data.value) {
            const u = m.MediaURL || m.MediaUrl || '';
            if (u && !seen.has(u)) { seen.add(u); urls.push(u); }
          }
        }
      }
    }

    // Deduplicate size variants
    const photos = dedup(urls);

    return NextResponse.json({ photos }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
