/**
 * Phone formatting and validation, shared by every surface that collects a
 * number: /signup, the two-step signup gate, and the post-Google prompt.
 *
 * Three near-copies of this logic existed before phone became mandatory, and
 * they had already drifted: the gate modal accepted any 10+ digit string, so
 * an 11-digit number NOT starting with 1 (a mistyped area code, a pasted
 * international number) passed there and failed on /signup. Now that a number
 * is required to register, "valid" has to mean the same thing everywhere —
 * otherwise the rule a visitor meets on one page rejects them on another.
 *
 * Dependency-free so it can be unit-tested without booting Next (phone.test.mjs).
 */

/** Digits only — what validation actually reasons about. */
export function cleanPhone(ph) {
  return String(ph || '').replace(/\D/g, '');
}

/**
 * A dialable North American number: 10 digits, or 11 starting with the
 * country code 1. Deliberately strict — Hamza calls these numbers, and a lead
 * he cannot reach is worse than no lead, because it also looks like one.
 */
export function isValidPhone(ph) {
  const digits = cleanPhone(ph);
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith('1')) return true;
  return false;
}

/**
 * Obvious fakes: all-same-digit, or a 555 area/exchange (the reserved
 * fictional range).
 *
 * This check used to live only in /api/lead and only for `source ===
 * 'registration'`. That was defensible while the number was optional —
 * someone volunteering a phone has little reason to invent one. It stopped
 * being defensible the moment a number became mandatory on the signup gate
 * and after Google Sign-In: forcing a field out of a reluctant visitor is
 * precisely what produces 5555555555, and those two paths post under
 * different `source` values, so nothing was checking them.
 *
 * Exported so the clients can reject before posting — a visitor who types a
 * fake number should be told immediately, not by a round-trip 400.
 */
export function isFakePhone(ph) {
  const digits = cleanPhone(ph);
  const last10 = digits.slice(-10);
  if (last10.length < 10) return false; // shape is isValidPhone's job, not this
  if (/^(\d)\1{9}$/.test(last10)) return true;
  const area = last10.slice(0, 3);
  const exchange = last10.slice(3, 6);
  return area === '555' || exchange === '555';
}

/** Digits only, for a tel:/wa.me href. wa.me REQUIRES bare digits. */
export function phoneDigits(ph) {
  return cleanPhone(ph);
}

/**
 * Progressive display formatting: (647) 361-1234, or 1 (647) 361-1234.
 * Called on every keystroke, so it must format partial input without
 * fighting the typist — under 4 digits it returns them untouched.
 */
export function formatPhone(val) {
  const digits = cleanPhone(val).slice(0, 11);
  if (digits.length >= 7) {
    const start = digits.length === 11 ? 1 : 0;
    const f = `(${digits.slice(start, start + 3)}) ${digits.slice(start + 3, start + 6)}-${digits.slice(start + 6)}`;
    return digits.length === 11 ? `1 ${f}` : f;
  }
  if (digits.length >= 4) {
    const start = digits.length === 11 ? 1 : 0;
    return `(${digits.slice(start, start + 3)}) ${digits.slice(start + 3)}`;
  }
  return digits;
}
