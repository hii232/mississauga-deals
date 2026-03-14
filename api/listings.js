// api/listings.js - PropTx VOW Datafeed — all Mississauga residential
const BASE = 'https://query.ampre.ca/odata';
const TOK = process.env.AMPRE_TOKEN;
const CITIES = ['Mississauga','Port Credit','Streetsville','Clarkson','Lakeview',
  'Erin Mills','Churchill Meadows','Cooksville','Hurontario','Meadowvale','Malton'];

function mapType(sub, prop) {
  var s = (sub || '').toLowerCase(), p = (prop || '').toLowerCase();
  if (s.indexOf('semi') > -1) return 'Semi-Detached';
  if (s.indexOf('att') > -1 || s.indexOf('row') > -1 || s.indexOf('town') > -1) return 'Townhouse';
  if (p.indexOf('condo') > -1 || s.indexOf('condo') > -1 || s.indexOf('apt') > -1) return 'Condo';
  if (s.indexOf('duplex') > -1) return 'Duplex';
  return 'Detached';
}

function estimateRent(price, beds, city, type) {
  var base = ({ 0: 1850, 1: 2100, 2: 2700, 3: 3200, 4: 3800, 5: 4400 })[Math.min(beds || 0, 5)] || 2500;
  var adj = type === 'Detached' ? 250 : type === 'Condo' ? -150 : 0;
  if ((city || '').toLowerCase().indexOf('port credit') > -1) adj += 200;
  return Math.round(((price || 0) * 0.0042 * 0.4 + (base + adj) * 0.6) / 50) * 50;
}

function addr(l) {
  return [l.UnitNumber ? l.UnitNumber + '-' : '', l.StreetNumber || '', l.StreetName || '', l.StreetSuffix || '']
    .filter(Boolean).join(' ').trim() || l.UnparsedAddress || 'Address on Request';
}

async function getPhotos(key) {
  try {
    // Try ResourceRecordKey first
    var r = await fetch(BASE + "/Media?$filter=ResourceRecordKey eq '" + key + "'&$orderby=Order asc&$top=50&$select=MediaURL,Order", {
      headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' }
    });
    if (r.ok) {
      var d = await r.json();
      var ph = (d.value || []).map(function(m) { return m.MediaURL || m.MediaUrl || ''; }).filter(Boolean);
      if (ph.length > 0) {
        // Deduplicate URLs
        return [...new Set(ph)];
      }
    }
    // Fallback: ListingKey filter
    var r2 = await fetch(BASE + "/Media?$filter=ListingKey eq '" + key + "'&$orderby=Order asc&$top=50&$select=MediaURL,Order", {
      headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' }
    });
    if (r2.ok) {
      var d2 = await r2.json();
      var ph2 = (d2.value || []).map(function(m) { return m.MediaURL || m.MediaUrl || ''; }).filter(Boolean);
      return [...new Set(ph2)];
    }
    return [];
  } catch (e) {
    console.log('getPhotos err', e.message);
    return [];
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!TOK) return res.status(500).json({ error: 'AMPRE_TOKEN not set' });

  try {
    var page = parseInt(req.query.page) || 1;
    // Allow up to 200 per page for faster loading
    var limit = Math.min(parseInt(req.query.limit) || 200, 200);
    var skip = (page - 1) * limit;

    var filters = ["StandardStatus eq 'Active'", "ListPrice ge 300000"];
    if (req.query.minPrice) filters.push('ListPrice ge ' + parseInt(req.query.minPrice));
    if (req.query.maxPrice) filters.push('ListPrice le ' + parseInt(req.query.maxPrice));
    if (req.query.beds) filters.push('BedroomsTotal ge ' + parseInt(req.query.beds));
    if (req.query.city) {
      filters.push("City eq '" + req.query.city + "'");
    } else {
      filters.push('(' + CITIES.map(function(c) { return "City eq '" + c + "'"; }).join(' or ') + ')');
    }

    var sel = [
      'ListingKey', 'ListingId', 'ListPrice', 'OriginalListPrice',
      'City', 'PostalCode', 'UnparsedAddress', 'StreetNumber', 'StreetName',
      'StreetSuffix', 'UnitNumber', 'BedroomsTotal', 'BathroomsTotalInteger',
      'PropertyType', 'PropertySubType', 'YearBuilt',
      'DaysOnMarket', 'CumulativeDaysOnMarket', 'OnMarketDate',
      'StandardStatus', 'ListOfficeName', 'PublicRemarks',
      'Latitude', 'Longitude', 'ModificationTimestamp'
    ].join(',');

    var url = BASE + '/Property?$filter=' + encodeURIComponent(filters.join(' and '))
      + '&$select=' + encodeURIComponent(sel)
      + '&$top=' + limit + '&$skip=' + skip
      + '&$orderby=ModificationTimestamp desc&$count=true';

    var resp = await fetch(url, {
      headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json' }
    });

    if (!resp.ok) {
      var e = await resp.text();
      return res.status(resp.status).json({ error: 'PropTx ' + resp.status, detail: e.substring(0, 400) });
    }

    var data = await resp.json();
    var items = data.value || [];
    var total = data['@odata.count'] || items.length;

    // Fetch photos in parallel batches of 10 to avoid overwhelming API
    var photos = [];
    for (var b = 0; b < items.length; b += 10) {
      var batch = items.slice(b, b + 10);
      var batchPhotos = await Promise.all(batch.map(function(l) { return getPhotos(l.ListingKey); }));
      photos = photos.concat(batchPhotos);
    }

    var listings = items.map(function(l, i) {
      var price = l.ListPrice || 0;
      var beds = l.BedroomsTotal || 0;
      var city = l.City || 'Mississauga';
      var type = mapType(l.PropertySubType, l.PropertyType);
      var rent = estimateRent(price, beds, city, type);
      var drop = (l.OriginalListPrice && l.OriginalListPrice > price)
        ? Math.round((l.OriginalListPrice - price) / l.OriginalListPrice * 100) : 0;
      var rem = l.PublicRemarks || '';
      var ph = photos[i] || [];

      // DOM: try DaysOnMarket, then CumulativeDaysOnMarket, then calculate from OnMarketDate
      var dom = l.DaysOnMarket || l.CumulativeDaysOnMarket || 0;
      if (dom === 0 && l.OnMarketDate) {
        var onDate = new Date(l.OnMarketDate);
        var now = new Date();
        dom = Math.max(0, Math.round((now - onDate) / (1000 * 60 * 60 * 24)));
      }

      return {
        id: l.ListingKey,
        mlsId: l.ListingId,
        price: price,
        address: addr(l),
        city: city,
        neighbourhood: city,
        postalCode: l.PostalCode,
        beds: beds,
        baths: l.BathroomsTotalInteger || 0,
        sqft: null,
        type: type,
        subType: l.PropertySubType || '',
        yearBuilt: l.YearBuilt,
        dom: dom,
        daysOnMarket: dom,
        status: l.StandardStatus,
        listingBrokerage: l.ListOfficeName || '',
        brokerage: l.ListOfficeName || '',
        remarks: rem,
        notes: rem,
        photos: ph,
        images: ph,
        lat: l.Latitude,
        lng: l.Longitude,
        originalPrice: l.OriginalListPrice || price,
        priceDrop: drop,
        priceReduction: drop,
        estimatedRent: rent,
        rent: rent,
        isSample: false,
        hasSuite: /separate entrance|in-law|basement apt|2nd kitchen|second kitchen|legal basement|finished basement|accessory|duplex|rental income|two unit|2 unit/i.test(rem)
      };
    });

    return res.status(200).json({
      listings: listings,
      total: total,
      page: page,
      limit: limit,
      pages: Math.ceil(total / limit),
      copyright: 'Listing data provided by PropTx/TRREB. Deemed reliable but not guaranteed.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('err:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
};
