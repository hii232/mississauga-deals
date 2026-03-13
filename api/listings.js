// api/listings.js — Amplify Syndication RESO Web API
// Endpoint: https://query.ampre.ca/odata/
// Auth: Bearer token via AMPRE_TOKEN env var (no OAuth2 needed)

const BASE = 'https://query.ampre.ca/odata/Property';

export default async function handler(req, res) {
  const TOKEN = process.env.AMPRE_TOKEN;

  if (!TOKEN) {
    return res.status(503).json({ listings: [], total: 0, source: 'no-token' });
  }

  const city = req.query.city || 'Mississauga';
  const minPrice = parseInt(req.query.minPrice || '0');
  const maxPrice = parseInt(req.query.maxPrice || '5000000');
  const limit = Math.min(parseInt(req.query.limit || '100'), 100);

  const filter = [
    `City eq '${city}'`,
    `StandardStatus eq 'Active'`,
    `InternetAddressDisplayYN eq true`,
    `ListPrice ge ${minPrice}`,
    `ListPrice le ${maxPrice}`
  ].join(' and ');

  const select = [
    'ListingKey','StreetNumber','StreetName','StreetSuffix','UnitNumber',
    'City','PostalCode','ListPrice','OriginalListPrice',
    'BedroomsTotal','BathroomsTotal',
    'LivingArea','PropertyType','PropertySubType',
    'StandardStatus','DaysOnMarket','ListOfficeName','ListAgentFullName',
    'PublicRemarks','InternetAddressDisplayYN','ModificationTimestamp',
    'Latitude','Longitude','MlsStatus','YearBuilt','ParkingTotal'
  ].join(',');

  const expand = "Media($select=MediaURL,MediaType,Order;$filter=MediaType eq 'image/jpeg';$orderby=Order;$top=10)";

  const params = new URLSearchParams();
  params.set('$filter', filter);
  params.set('$select', select);
  params.set('$expand', expand);
  params.set('$top', limit.toString());
  params.set('$orderby', 'ModificationTimestamp desc');

  const url = `${BASE}?${params.toString()}`;

  try {
    const apiRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Amplify API error:', apiRes.status, errText);
      return res.status(apiRes.status).json({ listings: [], total: 0, error: errText });
    }

    const data = await apiRes.json();
    const listings = (data.value || []).filter(l => l.InternetAddressDisplayYN !== false);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json({
      listings,
      total: listings.length,
      timestamp: new Date().toISOString(),
      source: 'ampre-live'
    });

  } catch (err) {
    console.error('Amplify fetch failed:', err.message);
    return res.status(500).json({ listings: [], total: 0, error: err.message });
  }
}
