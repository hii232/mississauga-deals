// api/photos.js — Fetch photos for a listing from PropTx Media endpoint
const ODATA_BASE = 'https://query.ampre.ca/odata';
const TOKEN = process.env.AMPRE_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  // Cache photos for 1 hour — they don't change often
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!TOKEN) return res.status(500).json({ error: 'AMPRE_TOKEN not set' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    // Try ResourceRecordKey filter first (most reliable)
    const url1 = ODATA_BASE + "/Media?$filter=ResourceRecordKey eq '" + id + "'&$orderby=Order asc&$top=50&$select=MediaURL,Order";
    let response = await fetch(url1, {
      headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }
    });

    let data = null;
    if (response.ok) {
      data = await response.json();
    }

    // Fallback: ListingKey filter
    if (!data || !data.value || data.value.length === 0) {
      const url2 = ODATA_BASE + "/Media?$filter=ListingKey eq '" + id + "'&$orderby=Order asc&$top=50&$select=MediaURL,Order";
      response = await fetch(url2, {
        headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }
      });
      if (response.ok) {
        data = await response.json();
      }
    }

    // Fallback: Navigation property
    if (!data || !data.value || data.value.length === 0) {
      const url3 = ODATA_BASE + "/Property('" + id + "')/Media?$orderby=Order asc&$top=50&$select=MediaURL,Order";
      response = await fetch(url3, {
        headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }
      });
      if (response.ok) {
        data = await response.json();
      }
    }

    if (!data || !data.value) {
      return res.status(200).json({ photos: [] });
    }

    // Extract and deduplicate photo URLs
    const seen = new Set();
    const photos = [];
    for (const m of data.value) {
      const url = m.MediaURL || m.MediaUrl || '';
      if (url && !seen.has(url)) {
        seen.add(url);
        photos.push(url);
      }
    }

    return res.status(200).json({ photos: photos });
  } catch (err) {
    return res.status(200).json({ photos: [] });
  }
};
