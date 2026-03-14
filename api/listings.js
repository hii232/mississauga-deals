export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOKEN = process.env.AMPRE_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: 'AMPRE_TOKEN not set' });

  const { city = 'Mississauga', limit = 50, offset = 0 } = req.query;

  try {
    // Build filter
    const cityFilter = `City eq '${city}' and InternetAddressDisplayYN eq true and StandardStatus eq 'Active'`;
    const top = Math.min(parseInt(limit) || 50, 100);
    const skip = parseInt(offset) || 0;

    const url = `https://query.ampre.ca/odata/Property?$filter=${encodeURIComponent(cityFilter)}&$top=${top}&$skip=${skip}&$orderby=ModificationTimestamp desc&$select=ListingKey,StreetNumber,StreetName,StreetSuffix,UnitNumber,City,CityRegion,ListPrice,OriginalListPrice,BedroomsTotal,BathroomsTotalInteger,PropertyType,PropertySubType,LivingAreaRange,BuildingAreaTotal,DaysOnMarket,ListOfficeName,PublicRemarks,PublicRemarksExtras,Inclusions,ParkingTotal,GarageType,Locker,TaxAnnualAmount,AssociationFee,AssociationFeeIncludes,CrossStreet,PostalCode,ApproximateAge,VirtualTourURLBranded,InternetAddressDisplayYN,InternetEntireListingDisplayYN,OriginalEntryTimestamp,ModificationTimestamp,TransactionType,StandardStatus,ContractStatus,ListingId`;

    const propRes = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' }
    });

    if (!propRes.ok) {
      const errText = await propRes.text();
      return res.status(propRes.status).json({ error: 'Ampre API error', detail: errText });
    }

    const data = await propRes.json();
    const listings = (data.value || []).filter(l => l.InternetAddressDisplayYN !== false);

    if (listings.length === 0) {
      return res.status(200).json({ listings: [], total: 0, source: 'ampre-live', timestamp: new Date().toISOString() });
    }

    // ── Fetch photos in ONE batch call ──
    const keys = listings.map(l => l.ListingKey).filter(Boolean);
    const mediaFilter = keys.map(k => `ResourceRecordKey eq '${k}'`).join(' or ');
    let mediaMap = {};

    try {
      const mediaUrl = `https://query.ampre.ca/odata/Media?$filter=${encodeURIComponent(mediaFilter)}&$select=ResourceRecordKey,MediaURL,Order,MediaCategory&$orderby=ResourceRecordKey,Order asc&$top=${keys.length * 5}`;
      const mediaRes = await fetch(mediaUrl, {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' }
      });
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        for (const m of (mediaData.value || [])) {
          if (m.MediaURL && m.ResourceRecordKey) {
            if (!mediaMap[m.ResourceRecordKey]) mediaMap[m.ResourceRecordKey] = [];
            if (mediaMap[m.ResourceRecordKey].length < 5) {
              mediaMap[m.ResourceRecordKey].push(m.MediaURL);
            }
          }
        }
      }
    } catch(e) {
      // Photos failed — continue without them
    }

    // Attach photos to listings
    const enriched = listings.map(l => ({
      ...l,
      images: mediaMap[l.ListingKey] || []
    }));

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json({
      listings: enriched,
      total: enriched.length,
      source: 'ampre-live',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}