// api/listings.js — PropTx VOW Datafeed
// Env var: AMPRE_TOKEN (set in Vercel)

const ODATA_BASE = 'https://query.ampre.ca/odata';
const BEARER_TOKEN = process.env.AMPRE_TOKEN;

const MISSISSAUGA_CITIES = [
  'Mississauga','Port Credit','Streetsville','Clarkson','Lakeview',
  'Erin Mills','Churchill Meadows','Cooksville','Hurontario','Meadowvale','Malton',
];


function mapType(sub, prop) {
  const s = (sub||'').toLowerCase();
  const p = (prop||'').toLowerCase();
  if(s.includes('semi')) return 'Semi-Detached';
  if(s.includes('att')||s.includes('row')||s.includes('town')) return 'Townhouse';
  if(p.includes('condo')||s.includes('condo')||s.includes('apt')) return 'Condo';
  if(s.includes('duplex')) return 'Duplex';
  return 'Detached';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!BEARER_TOKEN) {
    return res.status(500).json({ error: 'AMPRE_TOKEN not set in Vercel env vars' });
  }

  try {
    const { page = '1', limit = '50', minPrice, maxPrice, beds, type, city } = req.query;
    const take = Math.min(parseInt(limit) || 50, 100);
    const skip = (parseInt(page) - 1) * take;

    const filters = ["StandardStatus eq 'Active'",
      "ListPrice ge 200000"];

    if (minPrice) filters.push(`ListPrice ge ${parseInt(minPrice)}`);
    if (maxPrice) filters.push(`ListPrice le ${parseInt(maxPrice)}`);
    if (beds)     filters.push(`BedroomsTotal ge ${parseInt(beds)}`);
    if (type) {
      const typeMap = {
        detached: 'Detached', 'semi-detached': 'Semi-Detached',
        townhouse: 'Row/Townhouse', condo: 'Condo Apartment', duplex: 'Duplex',
      };
      const mapped = typeMap[type.toLowerCase()] || type;
      filters.push(`PropertyType eq '${mapped}'`);
    }
    if (city) {
      filters.push(`City eq '${city}'`);
    } else {
      const cf = MISSISSAUGA_CITIES.map(c => `City eq '${c}'`).join(' or ');
      filters.push(`(${cf})`);
    }

    // Only use fields verified to exist in PropTx schema
    const select = [
      'ListingKey','ListingId','ListPrice','OriginalListPrice',
      'City','StateOrProvince','PostalCode',
      'UnparsedAddress','StreetNumber','StreetName','StreetSuffix','UnitNumber',
      'BedroomsTotal','BathroomsTotalInteger',
      'PropertyType','PropertySubType',
      'YearBuilt','DaysOnMarket','StandardStatus',
      'ListOfficeName','ListOfficePhone',
      'PublicRemarks',
      'Latitude','Longitude',
      'ModificationTimestamp',
    ].join(',');

    const filterStr = filters.join(' and ');
    const url = `${ODATA_BASE}/Property?$filter=${encodeURIComponent(filterStr)}&$select=${encodeURIComponent(select)}&$top=${take}&$skip=${skip}&$orderby=ModificationTimestamp desc&$count=true`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('PropTx error:', response.status, errText);
      return res.status(response.status).json({ error: `PropTx API returned ${response.status}`, detail: errText });
    }

    const data = await response.json();
    const listings = data.value || [];
    const totalCount = data['@odata.count'] || listings.length;

    const enriched = listings.map(l => {
      const price = l.ListPrice || 0;
      const beds  = l.BedroomsTotal || 0;
      const type  = l.PropertyType || '';
      const city  = l.City || 'Mississauga';
      const estimatedRent = estimateRent(price, beds, city, type);

      return {
        id:               l.ListingKey,
        mlsId:            l.ListingId,
        price,
        address:          formatAddress(l),
        city:             l.City,
        neighbourhood:    l.City,
        postalCode:       l.PostalCode,
        beds,
        baths:            l.BathroomsTotalInteger || 0,
        halfBaths:        0,
        sqft:             null,
        type:             mapType(l.PropertySubType, l.PropertyType),
        subType:          l.PropertySubType || '',
        yearBuilt:        l.YearBuilt,
        daysOnMarket:     l.DaysOnMarket || 0,
        dom:              l.DaysOnMarket || 0,
        status:           l.StandardStatus,
        listingBrokerage: l.ListOfficeName || '',
        brokerage:        l.ListOfficeName || '',
        remarks:          l.PublicRemarks || '',
        notes:            l.PublicRemarks || '',
        photos:           [],
        images:           [],
        lat:              l.Latitude,
        lng:              l.Longitude,
        originalPrice:    l.OriginalListPrice || price,
        priceReduction:   l.OriginalListPrice && l.OriginalListPrice > price
                            ? Math.round(((l.OriginalListPrice - price) / l.OriginalListPrice) * 100)
                            : 0,
        priceDrop:        l.OriginalListPrice && l.OriginalListPrice > price
                            ? Math.round(((l.OriginalListPrice - price) / l.OriginalListPrice) * 100)
                            : 0,
        lastModified:     l.ModificationTimestamp,
        estimatedRent,
        rent:             estimatedRent,
      };
    });

    return res.status(200).json({
      listings: enriched,
      total: totalCount,
      page: parseInt(page),
      limit: take,
      pages: Math.ceil(totalCount / take),
      copyright: 'Listing data provided by PropTx / TRREB. Deemed reliable but not guaranteed.',
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('listings.js error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

function estimateRent(price, beds, city, type) {
  const bedRents = { 0: 1850, 1: 2100, 2: 2700, 3: 3200, 4: 3800, 5: 4400 };
  const base = bedRents[Math.min(beds, 5)] || 2500;
  let adj = 0;
  if (type.toLowerCase().includes('detach')) adj += 250;
  if (type.toLowerCase().includes('condo'))  adj -= 150;
  if (city.toLowerCase().includes('port credit') || city.toLowerCase().includes('lakeview')) adj += 200;
  const fromPrice = price * 0.0042;
  const blended = (fromPrice * 0.4 + (base + adj) * 0.6);
  return Math.round(blended / 50) * 50;
}

function formatAddress(l) {
  const parts = [
    l.UnitNumber ? l.UnitNumber + '-' : '',
    l.StreetNumber || '',
    l.StreetName || '',
    l.StreetSuffix || '',
  ].filter(Boolean);
  return parts.join(' ').trim() || l.UnparsedAddress || 'Address on Request';
}
