export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const TOKEN = process.env.AMPRE_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: 'AMPRE_TOKEN not set' });
  const { city = 'Mississauga', limit = 50, offset = 0 } = req.query;
  try {
    const cityFilter = `City eq '${city}' and TransactionType eq 'For Sale' and InternetAddressDisplayYN eq true and StandardStatus eq 'Active'`;
    const top = Math.min(parseInt(limit)||50, 100);
    const skip = parseInt(offset)||0;
    const url = `https://query.ampre.ca/odata/Property?$filter=${encodeURIComponent(cityFilter)}&$top=${top}&$skip=${skip}&$orderby=ModificationTimestamp desc&$select=ListingKey,StreetNumber,StreetName,StreetSuffix,UnitNumber,City,CityRegion,ListPrice,OriginalListPrice,BedroomsTotal,BathroomsTotalInteger,PropertyType,PropertySubType,LivingAreaRange,BuildingAreaTotal,DaysOnMarket,ListOfficeName,PublicRemarks,Inclusions,ParkingTotal,GarageType,Locker,TaxAnnualAmount,AssociationFee,CrossStreet,PostalCode,ApproximateAge,InternetAddressDisplayYN,InternetEntireListingDisplayYN,ModificationTimestamp,TransactionType,StandardStatus`;
    const propRes = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' } });
    if (!propRes.ok) { const e = await propRes.text(); return res.status(propRes.status).json({ error: 'Ampre error', detail: e }); }
    const data = await propRes.json();
    const listings = (data.value||[]).filter(l => l.InternetAddressDisplayYN !== false && l.PropertySubType !== 'Sale Of Business' && l.PropertyType !== 'Commercial');
    if (listings.length === 0) return res.status(200).json({ listings: [], total: 0, source: 'ampre-live', timestamp: new Date().toISOString() });
    const keys = listings.map(l => l.ListingKey).filter(Boolean);
    const mediaMap = {};
    const CHUNK = 10;
    for (let i = 0; i < keys.length; i += CHUNK) {
      const chunk = keys.slice(i, i + CHUNK);
      const filter = chunk.map(k => `ResourceRecordKey eq '${k}'`).join(' or ');
      try {
        const mr = await fetch(
          `https://query.ampre.ca/odata/Media?$filter=${encodeURIComponent(filter)}&$select=ResourceRecordKey,MediaURL,Order&$orderby=ResourceRecordKey,Order asc&$top=${chunk.length * 50}`,
          { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' } }
        );
        if (mr.ok) {
          const md = await mr.json();
          for (const m of (md.value||[])) {
            if (m.MediaURL && m.ResourceRecordKey) {
              if (!mediaMap[m.ResourceRecordKey]) mediaMap[m.ResourceRecordKey] = [];
              mediaMap[m.ResourceRecordKey].push(m.MediaURL);
            }
          }
        }
      } catch(e) {}
    }
    const enriched = listings.map(l => ({ ...l, images: mediaMap[l.ListingKey]||[] }));
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    return res.status(200).json({ listings: enriched, total: enriched.length, source: 'ampre-live', timestamp: new Date().toISOString() });
  } catch(err) { return res.status(500).json({ error: 'Server error', detail: err.message }); }
}