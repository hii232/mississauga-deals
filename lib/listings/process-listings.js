import { calcMonthly, calculateNOI, calculateCapRate, calculateCashOnCash } from '../cash-flow-engine';
import { calculateDealScore, detectBasementTier, getBasementIncome, isLRTCorridor } from '../deal-score';
import { generateHamzaTake } from '../hamza-take';
import { EXCLUDED_SUBTYPES } from '../property-types';
import { HOOD_DATA, HOOD_RENTS, FSA_COORDS, FSA_TO_HOOD, getTaxRate } from '../constants';

/**
 * Geocode from postal code using FSA centroid + deterministic offset
 */
function geocodeFromPostal(postalCode, id) {
  if (!postalCode) return null;
  const fsa = postalCode.replace(/\s/g, '').substring(0, 3).toUpperCase();
  const coords = FSA_COORDS[fsa];
  if (!coords) return null;

  // Deterministic offset so pins spread but stay stable
  const key = (postalCode || '') + (id || '');
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) - h) + key.charCodeAt(i);
    h |= 0;
  }
  const r1 = ((h & 0xffff) / 0xffff - 0.5) * 0.008;
  const r2 = (((h >> 16) & 0xffff) / 0xffff - 0.5) * 0.012;
  return [coords[0] + r1, coords[1] + r2];
}

/**
 * Process raw listings from API into enriched listings with scores
 */
export function processListings(rawListings) {
  // Filter out commercial/lease/non-residential
  const filtered = rawListings.filter((l) => {
    if (EXCLUDED_SUBTYPES.test(l.subType || '')) return false;
    if (EXCLUDED_SUBTYPES.test(l.type || '')) return false;
    return true;
  });

  const processed = filtered.map((l, i) => {
    const price = l.price || 0;
    const beds = l.beds || 0;
    const dom = l.dom || l.daysOnMarket || 0;
    const drop = l.priceDrop || l.priceReduction || 0;
    // Derive neighbourhood from postal code FSA, then fall back to city/neighbourhood
    const fsa = (l.postalCode || '').replace(/\s/g, '').substring(0, 3).toUpperCase();
    const hoodFromPostal = FSA_TO_HOOD[fsa];
    const hood = hoodFromPostal || (HOOD_DATA[l.neighbourhood] ? l.neighbourhood : null) || (HOOD_DATA[l.city] ? l.city : null) || 'Mississauga';
    const hoodData = HOOD_DATA[hood];
    const remarks = (l.remarks || l.notes || '').toLowerCase();
    const lrtAccess = isLRTCorridor(hood);
    const propType = (l.subType || l.type || '').toLowerCase();

    // Neighbourhood-specific rent estimate (preferred) → API estimate → formula fallback
    const hoodRents = HOOD_RENTS[hood];
    let baseRent;
    if (hoodRents) {
      const bedKey = Math.min(beds, 5);
      let hoodRent = hoodRents[bedKey];
      // Type adjustments on top of neighbourhood rent
      if (/detach/i.test(propType) && !/semi/i.test(propType)) hoodRent += 250;
      else if (/condo|apartment/i.test(propType)) hoodRent -= 150;
      if (/duplex|triplex|fourplex|multiplex/i.test(propType)) hoodRent += 800;
      baseRent = Math.round(hoodRent / 50) * 50;
    } else {
      baseRent = l.estimatedRent || l.rent || Math.round(price * 0.0042);
    }

    // Tiered basement detection — exclude condos/apartments (they don't have basements)
    const isCondoOrApt = /condo|apartment|loft|penthouse|co-op|coop|studio/i.test(propType);
    const basementTier = isCondoOrApt ? null : (detectBasementTier(remarks) || (l.hasSuite ? 'legal' : null));
    const basementIncome = getBasementIncome(basementTier);
    const rent = baseRent + basementIncome; // Total potential rent including basement

    const monthly = calcMonthly(price, 20, 5.5, 25);
    const propTax = Math.round((price * getTaxRate(hood)) / 12);
    const propInsurance = Math.round((price * 0.003) / 12);
    const maintenanceReserve = Math.round(rent * 0.05);
    const vacancyAllowance = Math.round(rent * 0.04);
    const cashFlow = rent - monthly - propTax - propInsurance - maintenanceReserve - vacancyAllowance;
    const noi = calculateNOI(rent);
    const capRate = calculateCapRate(noi, price);
    const totalCashIn = price * 0.2;
    const cashOnCash = calculateCashOnCash(cashFlow * 12, price, 20);

    const hamzaScore = calculateDealScore({
      cashFlow,
      dom,
      priceDrop: drop,
      capRate,
      basementTier,
    });

    const geocoded = geocodeFromPostal(l.postalCode, l.id);

    const obj = {
      id: l.id || l.mlsId || 'live-' + i,
      mlsId: l.mlsId || '',
      address: l.address || 'Address on Request',
      neighbourhood: hood,
      city: hood,
      postalCode: l.postalCode || '',
      price,
      originalPrice: l.originalPrice || price,
      beds,
      baths: l.baths || 0,
      type: l.type || 'Residential',
      subType: l.subType || '',
      yearBuilt: l.yearBuilt || null,
      dom,
      daysOnMarket: dom,
      status: l.status || 'Active',
      brokerage: l.brokerage || l.listingBrokerage || '',
      remarks: l.remarks || l.notes || '',
      photos: l.photos || l.images || [],
      images: l.photos || l.images || [],
      sqft: l.sqft || 0,
      pricePerSqFt: l.sqft > 0 ? Math.round(price / l.sqft) : 0,
      lat: l.lat || (geocoded ? geocoded[0] : null),
      lng: l.lng || (geocoded ? geocoded[1] : null),
      priceReduction: drop,
      priceDrop: drop,
      estimatedRent: rent,
      baseRent,
      basementIncome,
      basementTier,
      rent,
      capRate,
      cashFlow,
      cashOnCash,
      monthlyExpenses: monthly + propTax + propInsurance + maintenanceReserve + vacancyAllowance,
      hamzaScore,
      hamzaNotes: '',
      hamzasPick: hamzaScore >= 8.5 && i < 3,
      lrtAccess,
      hasSuite: basementTier !== null,
    };

    obj.hamzaNotes = generateHamzaTake(obj);
    return obj;
  });

  // Deduplicate by address+price (same unit listed multiple times)
  const seen = new Map();
  return processed.filter((l) => {
    const key = `${l.address}|${l.price}`;
    if (seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });
}
