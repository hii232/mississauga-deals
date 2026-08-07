// Relative import, not '@/lib/constants': the alias only exists inside the
// Next build, and this module must import identically from a plain node test
// (same rule as lib/market/trreb.js).
import { HOOD_DATA } from '../constants.js';

/**
 * The neighbourhood a blog post is ABOUT, if its title names exactly one.
 *
 * Powers the contextual links in the blog -> product bridge
 * (components/blog/live-market-band.js): a "Malton Investment Guide" post
 * links to Malton's guide page and Malton's scored listings instead of the
 * generic /listings.
 *
 * Title-only on purpose: body text mentions neighbours for comparison
 * ("cheaper than Port Credit"), and a comparison mention is not what the post
 * is about. Ambiguity refuses: a title naming two distinct hoods gets the
 * generic links rather than a coin-flip.
 *
 * @param {string} title
 * @returns {string|null} the canonical HOOD_DATA key, or null
 */
export function matchHood(title) {
  const t = ` ${String(title || '').toLowerCase()} `;
  const hits = Object.keys(HOOD_DATA).filter((name) => {
    const n = name.toLowerCase();
    const i = t.indexOf(n);
    if (i === -1) return false;
    // Word boundaries by hand - \b misbehaves around apostrophes and unicode,
    // and hood names can contain spaces.
    const before = t[i - 1] || ' ';
    const after = t[i + n.length] || ' ';
    return !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
  });
  // Containment: "Central Erin Mills" also matches "Erin Mills", "Lakeview
  // Village" also matches "Lakeview". The longer name is the more specific
  // claim about what the post covers, so it wins; only then does the
  // exactly-one rule apply.
  const longest = hits.filter(
    (a) => !hits.some((b) => b !== a && b.toLowerCase().includes(a.toLowerCase()))
  );
  return longest.length === 1 ? longest[0] : null;
}
