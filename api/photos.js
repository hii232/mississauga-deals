// api/photos.js — Fetch photos for a listing from PropTx Media endpoint
const ODATA_BASE = 'https://query.ampre.ca/odata';
const TOKEN = process.env.AMPRE_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!TOKEN) return res.status(500).json({ error: 'AMPRE_TOKEN not set' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    // Try multiple Media endpoint formats PropTx supports
    // Format 1: Navigation property
    const url1 = ODATA_BASE + "/Property('" + id + "')/Media?\$orderby=Order%20asc&\$top=25&\$select=MediaURL,Order,MediaCategory";
    
    // Format 2: Filter on ResourceRecordKey  
    const url2 = ODATA_BASE + "/Media?\$filter=ResourceRecordKey%20eq%20'" + id + "'&\$orderby=Order%20asc&\$top=25&\$select=MediaURL,Order,MediaCategory";

    // Try format 1 first
    let response = await fetch(url1, {
      headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }
    });
    
    let data = null;
    if (response.ok) {
      data = await response.json();
    } else {
      // Try format 2
      response = await fetch(url2, {
        headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }
      });
      if (response.ok) {
        data = await response.json();
      }
    }

    if (!data) {
      const errText = await response.text();
      return res.status(200).json({ photos: [], debug: { status: response.status, error: errText.substring(0, 300) } });
    }

    const items = data.value || [];
    const photos = items
      .filter(m => m && (m.MediaURL || m.MediaUrl))
      .map(m => m.MediaURL || m.MediaUrl)
      .filter(Boolean);

    return res.status(200).json({ photos, total: items.length, raw: items.slice(0,2) });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
