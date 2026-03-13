// api/listings.js — Amplify RESO Web API
const BASE = 'https://query.ampre.ca/odata/Property';

export default async function handler(req, res) {
  const TOKEN = process.env.AMPRE_TOKEN;
  if (!TOKEN) return res.status(503).json({ listings: [], total: 0, source: 'no-token' });

  const mode = req.query.mode || 'full';

  // SCHEMA MODE: fetch 1 raw listing, no filter, no select — see every field name
  if (mode === 'schema') {
    try {
      const r = await fetch(BASE + '?$top=1', {
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' }
      });
      const raw = await r.text();
      if (!r.ok) return res.status(200).json({ error: raw, status: r.status });
      const d = JSON.parse(raw);
      const sample = (d.value || [])[0] || {};
      return res.status(200).json({ 
        fields: Object.keys(sample).sort(), 
        sample,
        count: Object.keys(sample).length
      });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // FULL MODE
  const city = req.query.city || 'Mississauga';
  const limit = Math.min(parseInt(req.query.limit || '100'), 100);
  const minPrice = parseInt(req.query.minPrice || '0');
  const maxPrice = parseInt(req.query.maxPrice || '5000000');

  const filter = `City eq '${city}' and StandardStatus eq 'Active' and ListPrice ge ${minPrice} and ListPrice le ${maxPrice}`;

  // Use verified field names (BathroomsTotalInteger, BuildingAreaTotal)
  const select = [
    'ListingKey','StreetNumber','StreetName','StreetSuffix','UnitNumber',
    'City','PostalCode','ListPrice','OriginalListPrice',
    'BedroomsTotal','BathroomsTotalInteger',
    'BuildingAreaTotal','PropertyType','PropertySubType',
    'StandardStatus','DaysOnMarket','ListOfficeName','ListAgentFullName',
    'PublicRemarks','ModificationTimestamp',
    'Latitude','Longitude','YearBuilt','ParkingTotal'
  ].join(',');

  const expand = 'Media($select=MediaURL,Order;$orderby=Order;$top=5)';
  const url = BASE + '?$filter=' + encodeURIComponent(filter) + '&$select=' + encodeURIComponent(select) + '&$expand=' + expand + '&$top=' + limit + '&$orderby=ModificationTimestamp%20desc';

  try {
    const apiRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' }
    });
    const raw = await apiRes.text();
    if (!apiRes.ok) return res.status(200).json({ listings: [], total: 0, error: raw, url });
    const data = JSON.parse(raw);
    const listings = data.value || [];
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json({ listings, total: listings.length, source: 'ampre-live', timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ listings: [], total: 0, error: err.message });
  }
}
