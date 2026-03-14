// api/listings.js — Amplify Syndication RESO Web API (TRREB)
// Field names verified from live Amplify schema — NO $expand (images via separate endpoint)
const BASE = 'https://query.ampre.ca/odata/Property';

export default async function handler(req, res) {
  const TOKEN = process.env.AMPRE_TOKEN;
  if (!TOKEN) return res.status(503).json({ listings: [], total: 0, source: 'no-token' });

  const city     = req.query.city     || 'Mississauga';
  const limit    = Math.min(parseInt(req.query.limit    || '100'), 100);
  const minPrice = parseInt(req.query.minPrice || '0');
  const maxPrice = parseInt(req.query.maxPrice || '5000000');

  const select = [
    'ListingKey','ListingId','UnparsedAddress',
    'StreetNumber','StreetName','StreetSuffix','UnitNumber',
    'City','CityRegion','PostalCode',
    'ListPrice','OriginalListPrice',
    'BedroomsTotal','BedroomsAboveGrade','BedroomsBelowGrade',
    'BathroomsTotalInteger',
    'BuildingAreaTotal','LivingAreaRange',
    'PropertyType','PropertySubType','TransactionType',
    'StandardStatus','ContractStatus','DaysOnMarket',
    'ListOfficeName',
    'PublicRemarks','PublicRemarksExtras','Inclusions',
    'ModificationTimestamp','OriginalEntryTimestamp',
    'ParkingTotal','GarageType','Locker',
    'ApproximateAge','AssociationFee','AssociationFeeIncludes',
    'TaxAnnualAmount','CrossStreet',
    'InternetAddressDisplayYN','InternetEntireListingDisplayYN',
    'VirtualTourURLBranded'
  ].join(',');

  const filter = `City eq '${city}' and StandardStatus eq 'Active',
      `ListPrice ge 200000` and ListPrice ge ${minPrice} and ListPrice le ${maxPrice}`;

  const url = BASE
    + '?$filter='  + encodeURIComponent(filter)
    + '&$select='  + encodeURIComponent(select)
    + '&$top='     + limit
    + '&$orderby=ModificationTimestamp%20desc';

  try {
    const apiRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' }
    });

    const raw = await apiRes.text();

    if (!apiRes.ok) {
      console.error('Amplify error:', apiRes.status, raw.slice(0, 400));
      return res.status(200).json({ listings: [], total: 0, error: raw });
    }

    const data = JSON.parse(raw);
    const listings = (data.value || []).filter(l => l.InternetAddressDisplayYN !== false);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json({
      listings,
      total: listings.length,
      source: 'ampre-live',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({ listings: [], total: 0, error: err.message });
  }
}
