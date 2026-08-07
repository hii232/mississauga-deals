// Relative import, not '@/lib/constants': must import identically from a
// plain node test (same rule as lib/blog/match-hood.js).
import { FSA_TO_HOOD } from '../constants.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Pure logic for /sold-near-me - "find my home's comparables".
//
//  The proximity key is the FSA (the first three characters of a Canadian
//  postal code). That is an honest choice forced by the data: the feed
//  suppresses exact coordinates on active listings, and /api/sold-comps
//  already filters solds by FSA prefix. So the page says "your area", defined
//  as your postal district and its neighbourhood - and never pretends to a
//  radius it cannot compute.
//
//  Everything here is testable string/array work. The network calls live in
//  the client; the decisions live here.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the FSA from whatever the visitor typed - a postal code with or
 * without the space ("L5M 7L9", "l5m7l9"), just the FSA ("L5M"), or a full
 * address ending in one ("123 Main St, Mississauga L5M 7L9").
 *
 * @returns {string|null} uppercase 3-char FSA, or null when nothing valid.
 */
export function parseFsa(input) {
  const t = String(input || '').toUpperCase();
  // Full postal codes first (with or without the space), so an address
  // containing a street number never has digits misread as part of an FSA.
  const full = t.match(/\b([A-Z]\d[A-Z])\s?\d[A-Z]\d\b/);
  if (full) return full[1];
  // Bare FSA - allow it at a word boundary, not embedded in a longer token.
  const bare = t.match(/\b([A-Z]\d[A-Z])\b/);
  return bare ? bare[1] : null;
}

/**
 * The neighbourhood an FSA belongs to, when the map knows it. Null is a real
 * answer: it means "we cannot honestly name your neighbourhood", and the UI
 * drops the neighbourhood-scoped content instead of guessing.
 */
export function hoodForFsa(fsa) {
  return (fsa && FSA_TO_HOOD[String(fsa).toUpperCase()]) || null;
}

/**
 * The active-listing competition for a would-be seller: same neighbourhood,
 * same canonical property type (when given), freshest first. Days-on-market
 * ascending puts what JUST listed at the top - that is who a seller is
 * actually up against this week.
 *
 * Refuses to fake proximity: no hood -> empty list, because "competition"
 * drawn from the whole city is not competition.
 */
export function filterCompetition(listings, { hood, type, limit = 6 } = {}) {
  if (!hood || !Array.isArray(listings)) return [];
  return listings
    .filter((l) => l && l.neighbourhood === hood)
    .filter((l) => !type || l.type === type)
    .filter((l) => Number(l.price) > 0)
    .sort((a, b) => {
      // dom 0 means unknown age (the process-listings sentinel) - sort those
      // last, never first, so "freshest" is never claimed for unknown.
      const da = Number(a.dom) >= 1 ? Number(a.dom) : Infinity;
      const db = Number(b.dom) >= 1 ? Number(b.dom) : Infinity;
      return da - db;
    })
    .slice(0, limit);
}
