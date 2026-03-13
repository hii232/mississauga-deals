let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const CLIENT_ID = process.env.TRREB_CLIENT_ID;
  const CLIENT_SECRET = process.env.TRREB_CLIENT_SECRET;
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  const res = await fetch('https://oauth.proptx.ca/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'DDFApi_Read'
    })
  });
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const CLIENT_ID = process.env.TRREB_CLIENT_ID;
  const CLIENT_SECRET = process.env.TRREB_CLIENT_SECRET;
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(503).json({ error: 'Feed not yet configured', listings: [] });
  }

  try {
    const token = await getAccessToken();
    if (!token) return res.status(401).json({ error: 'Auth failed', listings: [] });

    const { city = 'Mississauga', minPrice = 400000, maxPrice = 2000000, limit = 100 } = req.query;

    const params = new URLSearchParams({
      '$filter': `City eq '${city}' and ListPrice ge ${minPrice} and ListPrice le ${maxPrice} and StandardStatus eq 'Active' and InternetAddressDisplayYN eq true`,
      '$top': String(Math.min(parseInt(limit) || 100, 100)),
      '$select': 'ListingKey,ListPrice,OriginalListPrice,StreetNumber,StreetName,StreetSuffix,UnitNumber,City,PostalCode,BedroomsTotal,BathroomsTotal,LivingArea,PropertyType,PropertySubType,PublicRemarks,ListOfficeName,DaysOnMarket,Media,InternetAddressDisplayYN,Latitude,Longitude',
      '$orderby': 'ListPrice asc'
    });

    const listingsRes = await fetch(`https://ddfapi.proptx.ca/odata/v1/Property?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });

    const data = await listingsRes.json();
    const listings = (data.value || []).filter(l => l.InternetAddressDisplayYN !== false);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.json({ listings, total: listings.length, timestamp: new Date().toISOString() });

  } catch (err) {
    console.error('PropTx listings error:', err);
    res.status(500).json({ error: 'Feed error', listings: [] });
  }
}
