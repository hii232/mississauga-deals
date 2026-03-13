// api/listings.js — Amplify RESO debug build
const BASE = 'https://query.ampre.ca/odata/Property';

export default async function handler(req, res) {
  const TOKEN = process.env.AMPRE_TOKEN;
  if (!TOKEN) return res.status(503).json({ listings: [], total: 0, source: 'no-token' });

  const mode = req.query.mode || 'full';
  const city = req.query.city || 'Mississauga';
  const limit = Math.min(parseInt(req.query.limit || '10'), 100);
  const minPrice = parseInt(req.query.minPrice || '300000');
  const maxPrice = parseInt(req.query.maxPrice || '5000000');

  // Build filter progressively based on mode for debugging
  let filter = '';
  if (mode === 'bare') {
    // No filter — just get any property
    filter = '';
  } else if (mode === 'city') {
    filter = `City eq '${city}'`;
  } else if (mode === 'status') {
    filter = `City eq '${city}' and StandardStatus eq 'Active'`;
  } else if (mode === 'price') {
    filter = `City eq '${city}' and StandardStatus eq 'Active' and ListPrice ge ${minPrice} and ListPrice le ${maxPrice}`;
  } else {
    // full mode
    filter = `City eq '${city}' and StandardStatus eq 'Active' and ListPrice ge ${minPrice} and ListPrice le ${maxPrice}`;
  }

  // Minimal select — just key fields
  const select = 'ListingKey,StreetNumber,StreetName,City,ListPrice,BedroomsTotal,BathroomsTotal,LivingArea,StandardStatus,DaysOnMarket,ListOfficeName,PublicRemarks,ModificationTimestamp';

  let url = BASE + '?$top=' + limit;
  if (filter) url += '&$filter=' + encodeURIComponent(filter);
  url += '&$select=' + encodeURIComponent(select);
  url += '&$orderby=ModificationTimestamp%20desc';

  try {
    const apiRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' }
    });

    const raw = await apiRes.text();
    
    if (!apiRes.ok) {
      return res.status(200).json({ 
        listings: [], total: 0, 
        debug: { status: apiRes.status, url, error: raw, mode }
      });
    }

    const data = JSON.parse(raw);
    const listings = data.value || [];
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ 
      listings, total: listings.length, 
      source: 'ampre-live', mode, url,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({ listings: [], total: 0, error: err.message, url });
  }
}
