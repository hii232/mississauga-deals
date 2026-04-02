import { calcMonthly, calculateNOI, calculateCapRate, calculateCashOnCash, calculateGRM, DEFAULT_ASSUMPTIONS } from '../cash-flow-engine';
import { calculateDealScore, detectBasementTier, getBasementIncome, parseBedroomSplit, isLRTCorridor } from '../deal-score';
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
  const filtered = rawListings.filter((l) => {
    if (EXCLUDED_SUBTYPES.test(l.subType || '')) return false;
    if (EXCLUDED_SUBTYPES.test(l.type || '')) return false;
    return true;
  });

  const { downPaymentPercent, annualInterestRate, amortizationYears, monthlyInsurance, maintenancePercent, vacancyPercent, managementPercent } = DEFAULT_ASSUMPTIONS;

  const processed = filtered.map((l, i) => {
    const price = l.price || 0;
    const beds = l.beds || 0;
    const dom = l.dom || l.daysOnMarket || 0;
    const drop = l.priceDrop || l.priceReduction || 0;
    const fsa = (l.postalCode || '').replace(/\s/g, '').substring(0, 3).toUpperCase();
    const hoodFromPostal = FSA_TO_HOOD[fsa];
    const hood = hoodFromPostal || (HOOD_DATA[l.neighbourhood] ? l.neighbourhood : null) || (HOOD_DATA[l.city] ? l.city : null) || l.city || l.neighbourhood || 'Mississauga';
    const hoodData = HOOD_DATA[hood];
    const transitScore = hoodData?.transitScore || 0;
    const schoolScore = hoodData?.schoolScore || 0;
    const remarks = (l.remarks || l.notes || '').toLowerCase();
    const lrtAccess = isLRTCorridor(hood);
    const propType = (l.subType || l.type || '').toLowerCase();

    // Tiered basement detection (do this first — affects rent estimation)
    const isCondoOrApt = /condo|apartment|loft|penthouse|co-op|coop|studio/i.test(propType);
    const basementTier = isCondoOrApt ? null : (detectBasementTier(remarks) || (l.hasSuite ? 'legal' : null));

    // For suite properties, split bedrooms between main unit and basement
    // This prevents double-counting: don't look up 5-bed rent then add basement on top
    const hasSuitePotential = basementTier === 'legal' || basementTier === 'potential';
    const bedSplit = hasSuitePotential ? parseBedroomSplit(l.remarks || l.notes || '', beds) : null;
    const mainBeds = bedSplit ? bedSplit.mainBeds : beds;
    const basementBeds = bedSplit ? bedSplit.basementBeds : 0;

    // Neighbourhood-specific rent estimate using MAIN UNIT beds (not total)
    const hoodRents = HOOD_RENTS[hood];
    let baseRent;
    let rentSource = 'price_ratio';
    if (hoodRents) {
      const bedKey = Math.min(mainBeds, 5);
      let hoodRent = hoodRents[bedKey];
      if (/detach/i.test(propType) && !/semi/i.test(propType)) hoodRent += 250;
      else if (/condo|apartment/i.test(propType)) hoodRent -= 150;
      if (/duplex|triplex|fourplex|multiplex/i.test(propType)) hoodRent += 800;
      baseRent = Math.round(hoodRent / 50) * 50;
      rentSource = 'neighbourhood';
    } else {
      baseRent = l.estimatedRent || l.rent || Math.round(price * 0.0042);
    }

    // Basement income based on ACTUAL basement bed count (not total property beds)
    const basementIncome = hasSuitePotential ? getBasementIncome(basementTier, basementBeds) : 0;
    const rent = baseRent + basementIncome;

    // Annual property tax — use listing data if available, else estimate
    const annualPropertyTax = l.propertyTax || Math.round(price * getTaxRate(hood));

    // Mortgage calculation (Canadian semi-annual compounding)
    const mortgage = calcMonthly(price, downPaymentPercent, annualInterestRate, amortizationYears);
    const propTax = Math.round(annualPropertyTax / 12);
    const insurance = monthlyInsurance;
    const maintenanceReserve = Math.round(rent * (maintenancePercent / 100));
    const vacancyAllowance = Math.round(rent * (vacancyPercent / 100));
    const managementFee = Math.round(rent * (managementPercent / 100));
    const totalExpenses = mortgage + propTax + insurance + maintenanceReserve + vacancyAllowance + managementFee;
    const cashFlow = rent - totalExpenses;

    // NOI — itemized, no mortgage
    const noiResult = calculateNOI(rent, {
      annualPropertyTax,
      monthlyInsurance: insurance,
      maintenancePct: maintenancePercent,
      vacancyPct: vacancyPercent,
      managementPct: managementPercent,
    });
    const noi = noiResult.noi;
    const capRate = calculateCapRate(noi, price);

    // Cash-on-Cash with Ontario LTT + closing costs
    const cashOnCash = calculateCashOnCash(cashFlow * 12, price, downPaymentPercent);

    // Gross Rent Multiplier
    const grm = calculateGRM(price, rent);

    const hamzaScore = calculateDealScore({
      cashFlow,
      dom,
      priceDrop: drop,
      capRate,
      cashOnCash,
      grm,
      basementTier,
      transitScore,
      schoolScore,
    });

    const geocoded = geocodeFromPostal(l.postalCode, l.id);

    const obj = {
      id: l.id || l.mlsId || 'live-' + i,
      mlsId: l.mlsId || '',
      address: l.address || 'Address on Request',
      neighbourhood: hood,
      city: l.city || hood,
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
      mainBeds,
      basementBeds,
      rentSource,
      rent,
      annualPropertyTax,
      capRate,
      cashFlow,
      cashOnCash,
      noi,
      grm,
      monthlyExpenses: totalExpenses,
      hamzaScore,
      hamzaNotes: '',
      hamzasPick: hamzaScore >= 8.5 && i < 3,
      transitScore,
      schoolScore,
      lrtAccess,
      hasSuite: basementTier !== null,
    };

    obj.hamzaNotes = generateHamzaTake(obj);
    return obj;
  });

  // Deduplicate by address+price
  const seen = new Map();
  return processed.filter((l) => {
    const key = `${l.address}|${l.price}`;
    if (seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });
}
