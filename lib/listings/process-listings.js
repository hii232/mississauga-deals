import { calcMonthly, calculateNOI, calculateCapRate, calculateCashOnCash, calculateGRM, DEFAULT_ASSUMPTIONS } from '../cash-flow-engine';
import { calculateDealScore, detectBasementTier, getBasementIncome, parseBedroomSplit, isLRTCorridor, detectMultiUnit, estimateMultiUnitRent } from '../deal-score';
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

    // ── Multi-unit detection (duplex, triplex, fourplex, multiplex) ──
    const multiUnit = detectMultiUnit(propType);
    const isMultiUnit = multiUnit.units >= 2;

    // ── Tiered basement detection (only for non-multi-unit, non-condo) ──
    const isCondoOrApt = /condo|apartment|loft|penthouse|co-op|coop|studio/i.test(propType);
    const basementTier = (isCondoOrApt || isMultiUnit) ? null : (detectBasementTier(remarks) || (l.hasSuite ? 'legal' : null));

    // For suite properties, split bedrooms between main unit and basement
    const hasSuitePotential = basementTier === 'legal' || basementTier === 'potential';
    const bedSplit = hasSuitePotential ? parseBedroomSplit(l.remarks || l.notes || '', beds) : null;
    const mainBeds = bedSplit ? bedSplit.mainBeds : beds;
    const basementBeds = bedSplit ? bedSplit.basementBeds : 0;

    // ── Rent estimation — 3 paths: multi-unit, suite, or single-family ──
    let baseRent;
    let basementIncome = 0;
    let rent;
    let rentSource = 'price_ratio';
    let unitBreakdown = null; // For multi-unit display

    if (isMultiUnit) {
      // PATH 1: MULTI-UNIT — estimate per-unit rents, sum them
      const multiRent = estimateMultiUnitRent(multiUnit.units, beds, propType);
      rent = multiRent.totalRent;
      baseRent = rent;
      rentSource = 'multi_unit';
      unitBreakdown = multiRent.units;
    } else {
      // PATH 2 & 3: Single-family with or without suite
      const hoodRents = HOOD_RENTS[hood];
      if (hoodRents) {
        const bedKey = Math.min(mainBeds, 5);
        let hoodRent = hoodRents[bedKey];
        if (/detach/i.test(propType) && !/semi/i.test(propType)) hoodRent += 250;
        else if (/condo|apartment/i.test(propType)) hoodRent -= 150;
        baseRent = Math.round(hoodRent / 50) * 50;
        rentSource = 'neighbourhood';
      } else {
        // For suite properties: recalculate from mainBeds only (not API's total-bed estimate)
        if (hasSuitePotential) {
          const fallbackRents = { 0: 1850, 1: 2100, 2: 2700, 3: 3200, 4: 3800, 5: 4400 };
          const fbBase = fallbackRents[Math.min(mainBeds, 5)] || 2500;
          let fbAdj = /detach/i.test(propType) && !/semi/i.test(propType) ? 250 : /condo|apartment/i.test(propType) ? -150 : 0;
          baseRent = Math.round(((price * 0.0042 * 0.4) + ((fbBase + fbAdj) * 0.6)) / 50) * 50;
        } else {
          baseRent = l.estimatedRent || l.rent || Math.round(price * 0.0042);
        }
      }

      // Basement income based on ACTUAL basement bed count
      basementIncome = hasSuitePotential ? getBasementIncome(basementTier, basementBeds) : 0;
      rent = baseRent + basementIncome;
    }

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
      unitCount: multiUnit.units,
      unitType: multiUnit.type,
      unitBreakdown,
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
