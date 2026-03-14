// api/listings.js - PropTx VOW Datafeed — fast, no photo calls
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
  if (s.indexOf('triplex') > -1) return 'Triplex';
  if (s.indexOf('fourplex') > -1 || s.indexOf('four-plex') > -1 || s.indexOf('quadruplex') > -1) return 'Fourplex';
  if (s.indexOf('multi') > -1 || s.indexOf('multiplex') > -1) return 'Multiplex';
  return 'Detached';
}

function estimateRent(price, beds, city, type) {
  var base = ({ 0: 1850, 1: 2100, 2: 2700, 3: 3200, 4: 3800, 5: 4400 })[Math.min(beds || 0, 5)] || 2500;
  var adj = type === 'Detached' ? 250 : type === 'Condo' ? -150 : 0;
  if (type === 'Duplex' || type === 'Triplex' || type === 'Fourplex' || type === 'Multiplex') adj += 800;
  if ((city || '').toLowerCase().indexOf('port credit') > -1) adj += 200;
  return Math.round(((price || 0) * 0.0042 * 0.4 + (base + adj) * 0.6) / 50) * 50;
}

function addr(l) {
  return [l.UnitNumber ? l.UnitNumber + '-' : '', l.StreetNumber || '', l.StreetName || '', l.StreetSuffix || '']
    .filter(Boolean).join(' ').trim() || l.UnparsedAddress || 'Address on Request';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!TOK) return res.status(500).json({ error: 'AMPRE_TOKEN not set' });

  try {
    var page = parseInt(req.query.page) || 1;
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

    // NO photo fetching here — photos load lazily on the frontend via /api/photos
    var listings = items.map(function(l) {
      var price = l.ListPrice || 0;
      var beds = l.BedroomsTotal || 0;
      var city = l.City || 'Mississauga';
      var type = mapType(l.PropertySubType, l.PropertyType);
      var rent = estimateRent(price, beds, city, type);
      var drop = (l.OriginalListPrice && l.OriginalListPrice > price)
        ? Math.round((l.OriginalListPrice - price) / l.OriginalListPrice * 100) : 0;
      var rem = l.PublicRemarks || '';
      var dom = l.DaysOnMarket || l.CumulativeDaysOnMarket || 0;
      if (dom === 0 && l.OnMarketDate) {
        var onDate = new Date(l.OnMarketDate);
        dom = Math.max(0, Math.round((Date.now() - onDate) / 86400000));
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
        type: type,
        subType: l.PropertySubType || '',
        yearBuilt: l.YearBuilt,
        dom: dom,
        daysOnMarket: dom,
        status: l.StandardStatus,
        brokerage: l.ListOfficeName || '',
        remarks: rem,
        photos: [],
        lat: l.Latitude,
        lng: l.Longitude,
        originalPrice: l.OriginalListPrice || price,
        priceDrop: drop,
        priceReduction: drop,
        estimatedRent: rent,
        rent: rent,
        hasSuite: /separate entrance|in-law|basement apt|2nd kitchen|second kitchen|legal basement|finished basement|accessory|rental income|two unit|2 unit/i.test(rem)
      };
    });

    return res.status(200).json({
      listings: listings,
      total: total,
      page: page,
      limit: limit,
      pages: Math.ceil(total / limit),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('listings err:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
};
