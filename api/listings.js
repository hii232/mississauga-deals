// api/listings.js — PropTx VOW Datafeed
// Env var: AMPRE_TOKEN (Vercel environment variables)

const ODATA_BASE = 'https://query.ampre.ca/odata';
const TOKEN = process.env.AMPRE_TOKEN;

const CITIES = [
  'Mississauga','Port Credit','Streetsville','Clarkson','Lakeview',
  'Erin Mills','Churchill Meadows','Cooksville','Hurontario','Meadowvale','Malton',
];

function mapType(sub, prop) {
  const s = (sub || '').toLowerCase();
  const p = (prop || '').toLowerCase();
  if (s.includes('semi')) return 'Semi-Detached';
  if (s.includes('att') || s.includes('row') || s.includes('town')) return 'Townhouse';
  if (p.includes('condo') || s.includes('condo') || s.includes('apt')) return 'Condo';
  if (s.includes('duplex')) return 'Duplex';
  return 'Detached';
}

function estimateRent(price, beds, city, type) {
  const bedRents = { 0: 1850, 1: 2100, 2: 2700, 3: 3200, 4: 3800, 5: 4400 };
  const base = bedRents[Math.min(beds || 0, 5)] || 2500;
  let adj = 0;
  if (type === 'Detached') adj += 250;
  if (type === 'Condo') adj -= 150;
  const c = (city || '').toLowerCase();
  if (c.includes('port credit') || c.includes('lakeview')) adj += 200;
  return Math.round(((price || 0) * 0.0042 * 0.4 + (base + adj) * 0.6) / 50) * 50;
}

function formatAddress(l) {
  return [
    l.UnitNumber ? l.UnitNumber + '-' : '',
    l.StreetNumber || '',
    l.StreetName || '',
    l.StreetSuffix || '',
  ].filter(Boolean).join(' ').trim() || l.UnparsedAddress || 'Address on Request';
}

// Fetch photos for a listing from the Media endpoint
async function fetchPhotos(listingKey) {
  try {
    const url = ODATA_BASE + '/Property(\'' + listingKey + '\')/Media?$orderby=Order asc&$top=20&$select=MediaURL,MediaUrl,Order,MediaCategory';
    const r = await fetch(url, {
      headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }
    });
    if (!r.ok) return [];
    const data = await r.json();
    const items = data.value || [];
    return items
      .filter(m => m && (m.MediaURL || m.MediaUrl))
      .map(m => m.MediaURL || m.MediaUrl)
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!TOKEN) return res.status(500).json({ error: 'AMPRE_TOKEN not set' });

  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip  = (page - 1) * limit;

    const filters = [
      "StandardStatus eq 'Active'",
      "ListPrice ge 300000",
    ];

    if (req.query.minPrice) filters.push('ListPrice ge ' + parseInt(req.query.minPrice));
    if (req.query.maxPrice) filters.push('ListPrice le ' + parseInt(req.query.maxPrice));
    if (req.query.beds)     filters.push('BedroomsTotal ge ' + parseInt(req.query.beds));

    if (req.query.city) {
      filters.push("City eq '" + req.query.city + "'");
    } else {
      filters.push('(' + CITIES.map(c => "City eq '" + c + "'").join(' or ') + ')');
    }

    const select = [
      'ListingKey','ListingId','ListPrice','OriginalListPrice',
      'City','PostalCode',
      'UnparsedAddress','StreetNumber','StreetName','StreetSuffix','UnitNumber',
      'BedroomsTotal','BathroomsTotalInteger',
      'PropertyType','PropertySubType',
      'YearBuilt','DaysOnMarket','StandardStatus',
      'ListOfficeName',
      'PublicRemarks',
      'Latitude','Longitude',
      'ModificationTimestamp',
    ].join(',');

    const url = ODATA_BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
      + '&$select=' + encodeURIComponent(select)
      + '&$top=' + limit + '&$skip=' + skip
      + '&$orderby=ModificationTimestamp desc&$count=true';

    const response = await fetch(url, {
      headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' }
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: 'PropTx ' + response.status, detail: err.substring(0, 500) });
    }

    const data   = await response.json();
    const items  = data.value || [];
    const total  = data['@odata.count'] || items.length;

    // Fetch photos for ALL listings in parallel
    const photosArr = await Promise.all(
      items.map(l => fetchPhotos(l.ListingKey))
    );

    const listings = items.map((l, i) => {
      const price    = l.ListPrice || 0;
      const beds     = l.BedroomsTotal || 0;
      const city     = l.City || 'Mississauga';
      const fType    = mapType(l.PropertySubType, l.PropertyType);
      const rent     = estimateRent(price, beds, city, fType);
      const priceDrop = (l.OriginalListPrice && l.OriginalListPrice > price)
        ? Math.round(((l.OriginalListPrice - price) / l.OriginalListPrice) * 100) : 0;
      const remarks  = l.PublicRemarks || '';
      const photos   = photosArr[i] || [];

      return {
        id:               l.ListingKey,
        mlsId:            l.ListingId,
        price,
        address:          formatAddress(l),
        city,
        neighbourhood:    city,
        postalCode:       l.PostalCode,
        beds,
        baths:            l.BathroomsTotalInteger || 0,
        sqft:             null,
        type:             fType,
        subType:          l.PropertySubType || '',
        yearBuilt:        l.YearBuilt,
        dom:              l.DaysOnMarket || 0,
        daysOnMarket:     l.DaysOnMarket || 0,
        status:           l.StandardStatus,
        listingBrokerage: l.ListOfficeName || '',
        brokerage:        l.ListOfficeName || '',
        remarks,
        notes:            remarks,
        photos,
        images:           photos,
        lat:              l.Latitude,
        lng:              l.Longitude,
        originalPrice:    l.OriginalListPrice || price,
        priceDrop,
        priceReduction:   priceDrop,
        estimatedRent:    rent,
        rent,
        isSample:         false,
        hasSuite: remarks.toLowerCase().includes('separate entrance')
                || remarks.toLowerCase().includes('basement suite')
                || remarks.toLowerCase().includes('in-law suite')
                || remarks.toLowerCase().includes('legal suite')
                || remarks.toLowerCase().includes('second unit'),
      };
    });

    return res.status(200).json({
      listings,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      copyright: 'Listing data provided by PropTx / TRREB. Deemed reliable but not guaranteed.',
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('listings.js error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
};
