import { NextResponse } from 'next/server';

/**
 * Auth guards for the privileged routes (cron jobs and admin actions).
 *
 * These FAIL CLOSED. The patterns they replace all failed OPEN when the secret
 * was absent from the environment, which is the opposite of what you want from
 * a guard:
 *
 *   if (cronSecret && authHeader !== `Bearer ${cronSecret}`) return 401;
 *       ^ CRON_SECRET unset => the check is skipped and the route is public.
 *         On /api/alerts/send that meant anyone could trigger a mass email to
 *         every subscriber, on demand, as often as they liked.
 *
 *   if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
 *       ^ CRON_SECRET unset => the template renders "Bearer undefined", so
 *         sending exactly that header authenticates you.
 *
 * A missing secret is now a misconfiguration to refuse, not a door to open.
 * Every helper returns a NextResponse to return early, or null when the caller
 * is authorised.
 */

const UNAUTHORIZED = () =>
  NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const MISCONFIGURED = (which) =>
  NextResponse.json(
    { error: `${which} is not configured on the server; this endpoint is disabled.` },
    { status: 503 }
  );

// Timing-safe enough for a shared secret compared as a whole string; the point
// here is correctness of the fail-closed branch, not side-channel hardening.
function matches(actual, expected) {
  return typeof actual === 'string' && actual.length > 0 && actual === expected;
}

export function isCronAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return matches(request.headers.get('authorization'), `Bearer ${secret}`);
}

export function isAdminAuthorized(request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return matches(request.headers.get('x-admin-key'), secret);
}

/** Cron-only endpoints (Vercel Cron sends the Authorization header). */
export function requireCron(request) {
  if (!process.env.CRON_SECRET) return MISCONFIGURED('CRON_SECRET');
  return isCronAuthorized(request) ? null : UNAUTHORIZED();
}

/** Endpoints Vercel Cron calls but Hamza can also trigger by hand from admin. */
export function requireCronOrAdmin(request) {
  if (!process.env.CRON_SECRET && !process.env.ADMIN_SECRET) {
    return MISCONFIGURED('CRON_SECRET/ADMIN_SECRET');
  }
  return isCronAuthorized(request) || isAdminAuthorized(request) ? null : UNAUTHORIZED();
}

/** Admin-only endpoints. */
export function requireAdmin(request) {
  if (!process.env.ADMIN_SECRET) return MISCONFIGURED('ADMIN_SECRET');
  return isAdminAuthorized(request) ? null : UNAUTHORIZED();
}

/**
 * Broadcast endpoints that a human can also trigger from a browser via ?key=.
 * Accepts: cron Bearer, x-admin-key header, or ?key= matching either secret.
 * Used by /api/broadcast/announcement and /api/broadcast/motivated-sellers.
 */
export function isBroadcastAuthorized(request, searchParams) {
  if (isCronAuthorized(request)) return true;
  if (isAdminAuthorized(request)) return true;
  const key = searchParams?.get('key');
  if (!key) return false;
  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET;
  if (cronSecret && matches(key, cronSecret)) return true;
  if (adminSecret && matches(key, adminSecret)) return true;
  return false;
}

export function requireBroadcast(request, searchParams) {
  if (!process.env.CRON_SECRET && !process.env.ADMIN_SECRET) {
    return MISCONFIGURED('CRON_SECRET/ADMIN_SECRET');
  }
  return isBroadcastAuthorized(request, searchParams) ? null : UNAUTHORIZED();
}
