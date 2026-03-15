// ─────────────────────────────────────────────
//   SOLD COMPS UTILITIES
// ─────────────────────────────────────────────

/**
 * Calculate annualized appreciation rate between two prices over a period
 * @param {number} oldPrice - Earlier price
 * @param {number} newPrice - Later price
 * @param {number} years - Time between in years (can be fractional)
 * @returns {number} Annualized return percentage (e.g. 5.2)
 */
export function calculateAppreciation(oldPrice, newPrice, years) {
  if (!oldPrice || oldPrice <= 0 || !newPrice || !years || years <= 0) return 0;
  const rate = (Math.pow(newPrice / oldPrice, 1 / years) - 1) * 100;
  return +rate.toFixed(1);
}

/**
 * Calculate haversine distance between two lat/lng points in km
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(1);
}

/**
 * Calculate years between two dates
 */
export function yearsBetween(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  const a = new Date(dateA);
  const b = new Date(dateB);
  const ms = Math.abs(b - a);
  return +(ms / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2);
}

/**
 * Calculate months ago from now
 */
export function monthsAgo(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return Math.max(0, months);
}

/**
 * Format a comp from raw AMPRE data
 */
export function formatComp(raw) {
  const listPrice = raw.ListPrice || 0;
  const closePrice = raw.ClosePrice || raw.ListPrice || 0;
  const priceDelta = listPrice > 0 ? +(((closePrice - listPrice) / listPrice) * 100).toFixed(1) : 0;

  return {
    id: raw.ListingKey,
    mlsId: raw.ListingId,
    address: [raw.StreetNumber || '', raw.StreetName || '', raw.StreetSuffix || '']
      .filter(Boolean).join(' ').trim() || raw.UnparsedAddress || 'Address on Request',
    city: raw.City || '',
    listPrice,
    closePrice,
    priceDelta, // negative = sold below list, positive = sold above
    beds: raw.BedroomsTotal || 0,
    baths: raw.BathroomsTotalInteger || 0,
    type: raw.PropertyType || '',
    subType: raw.PropertySubType || '',
    dom: raw.DaysOnMarket || 0,
    closeDate: raw.CloseDate || null,
    listDate: raw.OnMarketDate || raw.ListingContractDate || raw.OriginalEntryTimestamp || null,
    status: raw.StandardStatus || '',
    brokerage: raw.ListOfficeName || '',
    lat: raw.Latitude,
    lng: raw.Longitude,
  };
}

/**
 * Calculate summary stats from an array of comps
 */
export function calculateCompStats(comps) {
  if (!comps || comps.length === 0) {
    return { avgSoldPrice: 0, avgDOM: 0, avgNegotiationGap: 0, count: 0 };
  }

  const soldComps = comps.filter((c) => c.closePrice > 0);
  if (soldComps.length === 0) {
    return { avgSoldPrice: 0, avgDOM: 0, avgNegotiationGap: 0, count: 0 };
  }

  const avgSoldPrice = Math.round(
    soldComps.reduce((sum, c) => sum + c.closePrice, 0) / soldComps.length
  );
  const avgDOM = Math.round(
    soldComps.reduce((sum, c) => sum + (c.dom || 0), 0) / soldComps.length
  );
  const avgNegotiationGap = +(
    soldComps.reduce((sum, c) => sum + c.priceDelta, 0) / soldComps.length
  ).toFixed(1);

  return { avgSoldPrice, avgDOM, avgNegotiationGap, count: soldComps.length };
}
