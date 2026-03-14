// api/listings.js â PropTx VOW Datafeed
// Requires AMPRE_TOKEN in Vercel environment variables

const ODATA_BASE = 'https://query.ampre.ca/odata';
const BEARER_TOKEN = process.env.AMPRE_TOKEN;

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

function extractPhotos(media) {
  if (!media || !Array.isArray(media)) return [];
  return media
    .filter(function(m) { return m && (m.MediaURL || m.MediaUrl); })
    .sort(function(a, b) { return (a.Order || a.MediaOrder || 0) - (b.Order || b.MediaOrder || 0); })
    .map(function(m) { return m.MediaURL || m.MediaUrl; })
    .filter(Boolean)
    .slice(0, 25);
}

function estimateRent(price, beds, city, type) {
  var bedRents = { 0: 1850, 1: 2100, 2: 2700, 3: 3200, 4: 3800, 5: 4400 };
  var base = bedRents[Math.min(beds || 0, 5)] || 2500;
  var adj = 0;
  if (type === 'Detached') adj += 250;
  if (type === 'Condo') adj -= 150;
  var c = (city || '').toLowerCase();
  if (c.includes('port credit') || c.includes('lakeview')) adj += 200;
  var fromPrice = (price || 0) * 0.0042;
  var blended = fromPrice * 0.4 + (base + adj) * 0.6;
  return Math.round(blended / 50) * 50;
}

function formatAddress(l) {
  var parts = [
    l.UnitNumber ? l.UnitNumber + '-' : '',
    l.StreetNumber || '',
    l.StreetName || '',
    l.StreetSuffix || '',
  ].filter(Boolean);
  return parts.join(' ').trim() || l.UnparsedAddress || 'Address on Request';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!BEARER_TOKEN) {
    return res.status(500).json({ error: 'AMPRE_TOKEN not set in Vercel env vars' });
  }

  try {
    var page = parseInt(req.query.page) || 1;
    var limit = Math.min(parseInt(req.query.limit) || 50, 100);
    var skip = (page - 1) * limit;
    var minPrice = req.query.minPrice;
    var maxPrice = req.query.maxPrice;
    var beds = req.query.beds;
    var city = req.query.city;

    var filters = [
      "StandardStatus eq 'Active'",
      "ListPrice ge 300000",
    ];

    if (minPrice) filters.push('ListPrice ge ' + parseInt(minPrice));
    if (maxPrice) filters.push('ListPrice le ' + parseInt(maxPrice));
    if (beds) filters.push('BedroomsTotal ge ' + parseInt(beds));

    if (city) {
      filters.push("City eq '" + city + "'");
    } else {
      var cf = CITIES.map(function(c) { return "City eq '" + c + "'"; }).join(' or ');
      filters.push('(' + cf + ')');
    }

    var select = [
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
      'Media',
    ].join(',');

    var filterStr = filters.join(' and ');
    var url = ODATA_BASE + '/Property?$filter=' + encodeURIComponent(filterStr) +
      '&$select=' + encodeURIComponent(select) +
      '&$top=' + limit + '&$skip=' + skip +
      '&$orderby=ModificationTimestamp desc&$count=true';

    var response = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + BEARER_TOKEN,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('PropTx error:', response.status, errText.substring(0, 500));
      return res.status(response.status).json({ error: 'PropTx API returned ' + response.status, detail: errText.substring(0, 500) });
    }

    var data = await response.json();
    var listings = data.value || [];
    var totalCount = data['@odata.count'] || listings.length;

    var enriched = listings.map(function(l) {
      var price = l.ListPrice || 0;
      var beds2 = l.BedroomsTotal || 0;
      var city2 = l.City || 'Mississauga';
      var fType = mapType(l.PropertySubType, l.PropertyType);
      var rent = estimateRent(price, beds2, city2, fType);
      var priceDrop = (l.OriginalListPrice && l.OriginalListPrice > price)
        ? Math.round(((l.OriginalListPrice - price) / l.OriginalListPrice) * 100) : 0;
      var photos = extractPhotos(l.Media);
      var remarks = l.PublicRemarks || '';

      return {
        id: l.ListingKey,
        mlsId: l.ListingId,
        price: price,
        address: formatAddress(l),
        city: city2,
        neighbourhood: city2,
        postalCode: l.PostalCode,
        beds: beds2,
        baths: l.BathroomsTotalInteger || 0,
        halfBaths: 0,
        sqft: null,
        type: fType,
        subType: l.PropertySubType || '',
        yearBuilt: l.YearBuilt,
        daysOnMarket: l.DaysOnMarket || 0,
        dom: l.DaysOnMarket || 0,
        status: l.StandardStatus,
        listingBrokerage: l.ListOfficeName || '',
        brokerage: l.ListOfficeName || '',
        remarks: remarks,
        notes: remarks,
        photos: photos,
        images: photos,
        lat: l.Latitude,
        lng: l.Longitude,
        originalPrice: l.OriginalListPrice || price,
        priceReduction: priceDrop,
        priceDrop: priceDrop,
        lastModified: l.ModificationTimestamp,
        estimatedRent: rent,
        rent: rent,
        isSample: false,
        hamzasPick: false,
        hasSuite: remarks.toLowerCase().includes('separate entrance') ||
                  remarks.toLowerCase().includes('basement suite') ||
                  remarks.toLowerCase().includes('in-law suite') ||
                  remarks.toLowerCase().includes('legal suite') ||
                  remarks.toLowerCase().includes('second unit'),
      };
    });

    return res.status(200).json({
      listings: enriched,
      total: totalCount,
      page: page,
      limit: limit,
      pages: Math.ceil(totalCount / limit),
      copyright: 'Listing data provided by PropTx / TRREB. Deemed reliable but not guaranteed.',
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('listings.js crash:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
