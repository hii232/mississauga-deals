// api/photos-batch.js — Fetch first photo for multiple listings at once
const ODATA_BASE = 'https://query.ampre.ca/odata';
const TOKEN = process.env.AMPRE_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (!TOKEN) return res.status(500).json({ error: 'AMPRE_TOKEN not set' });

  const { ids } = req.body || {};
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array required' });
  }

  // Limit to 20 IDs per request
  const batch = ids.slice(0, 20);
  const result = {};

  try {
    // Try ResourceRecordKey first
    const filter1 = batch.map(function(id) {
      return "ResourceRecordKey eq '" + id + "'";
    }).join(' or ');

    const url1 = ODATA_BASE + "/Media?$filter=" + encodeURIComponent(filter1)
      + "&$orderby=ResourceRecordKey,Order asc&$top=" + (batch.length * 3)
      + "&$select=MediaURL,ResourceRecordKey,Order";

    const r1 = await fetch(url1, {
      headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }
    });

    if (r1.ok) {
      const d1 = await r1.json();
      for (const m of (d1.value || [])) {
        const key = m.ResourceRecordKey;
        const u = m.MediaURL || m.MediaUrl || '';
        if (key && u && !result[key]) result[key] = u;
      }
    }

    // Find IDs still missing photos — try ListingKey filter
    const missing = batch.filter(function(id) { return !result[id]; });
    if (missing.length > 0) {
      const filter2 = missing.map(function(id) {
        return "ListingKey eq '" + id + "'";
      }).join(' or ');

      const url2 = ODATA_BASE + "/Media?$filter=" + encodeURIComponent(filter2)
        + "&$orderby=ListingKey,Order asc&$top=" + (missing.length * 3)
        + "&$select=MediaURL,ListingKey,Order";

      const r2 = await fetch(url2, {
        headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }
      });

      if (r2.ok) {
        const d2 = await r2.json();
        for (const m of (d2.value || [])) {
          const key = m.ListingKey;
          const u = m.MediaURL || m.MediaUrl || '';
          if (key && u && !result[key]) result[key] = u;
        }
      }
    }

    return res.status(200).json({ photos: result });
  } catch (err) {
    return res.status(200).json({ photos: result });
  }
};
