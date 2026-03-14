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

  try {
    // Build OR filter for all IDs at once
    const filter = batch.map(function(id) {
      return "ResourceRecordKey eq '" + id + "'";
    }).join(' or ');

    const url = ODATA_BASE + "/Media?$filter=" + encodeURIComponent(filter)
      + "&$orderby=ResourceRecordKey,Order asc&$top=" + (batch.length * 2)
      + "&$select=MediaURL,ResourceRecordKey,Order";

    const response = await fetch(url, {
      headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }
    });

    if (!response.ok) {
      return res.status(200).json({ photos: {} });
    }

    const data = await response.json();
    const items = data.value || [];

    // Group by ResourceRecordKey, take first photo per listing
    const result = {};
    for (const m of items) {
      const key = m.ResourceRecordKey;
      const url = m.MediaURL || m.MediaUrl || '';
      if (key && url && !result[key]) {
        result[key] = url;
      }
    }

    return res.status(200).json({ photos: result });
  } catch (err) {
    return res.status(200).json({ photos: {} });
  }
};
