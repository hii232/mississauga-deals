/**
 * Tests for Resend webhook verification, normalisation and rollup.
 *
 *   node lib/emails/resend-webhook.test.mjs
 *
 * The verification half is security code on a PUBLIC endpoint: the signature is
 * the only thing stopping anyone on the internet from posting fake campaign
 * analytics, or replaying a captured delivery. The rollup half decides the
 * numbers Hamza will make follow-up calls from.
 */

import { createHmac } from 'crypto';
import { verifyResendSignature, normalizeEvent, summarize } from './resend-webhook.js';

const SECRET = 'whsec_' + Buffer.from('super-secret-signing-key-0123456789').toString('base64');
const NOW = 1785624000;

function sign(id, ts, body, secret = SECRET) {
  const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const mac = createHmac('sha256', Buffer.from(raw, 'base64'))
    .update(`${id}.${ts}.${body}`).digest('base64');
  return `v1,${mac}`;
}

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

const body = JSON.stringify({ type: 'email.opened', created_at: '2026-08-01T23:00:00Z', data: {} });
const id = 'msg_2abc';

console.log('\nSignature - the happy path');
const good = verifyResendSignature({
  secret: SECRET, id, timestamp: String(NOW), signature: sign(id, NOW, body), body, nowSeconds: NOW,
});
check('valid signature accepted', good.ok === true, JSON.stringify(good));

console.log('\nForgery and tampering must all reject');
const bad = (over, why) => {
  const r = verifyResendSignature({
    secret: SECRET, id, timestamp: String(NOW), signature: sign(id, NOW, body),
    body, nowSeconds: NOW, ...over,
  });
  check(why, r.ok === false, `unexpectedly ACCEPTED: ${JSON.stringify(r)}`);
  return r;
};
bad({ signature: 'v1,' + Buffer.from('nope').toString('base64') }, 'wrong signature rejected');
bad({ body: body.replace('opened', 'clicked') }, 'tampered body rejected');
bad({ id: 'msg_different' }, 'tampered svix-id rejected');
bad({ timestamp: String(NOW + 1) }, 'tampered timestamp rejected');
bad({ signature: sign(id, NOW, body, 'whsec_' + Buffer.from('the-wrong-key').toString('base64')) },
  'signature from a different secret rejected');
bad({ signature: 'garbage' }, 'malformed signature header rejected');
bad({ signature: 'v2,' + Buffer.from('x').toString('base64') }, 'non-v1 scheme alone rejected');
bad({ secret: '' }, 'missing secret rejects (fail-closed, never open)');
bad({ id: '' }, 'missing svix-id rejected');
bad({ signature: '' }, 'missing signature rejected');
bad({ timestamp: 'not-a-number' }, 'non-numeric timestamp rejected');
bad({ body: JSON.parse(body) }, 'parsed object instead of raw string rejected');

console.log('\nReplay protection');
bad({ nowSeconds: NOW + 6 * 60 }, 'delivery older than 5 min rejected');
bad({ nowSeconds: NOW - 6 * 60 }, 'timestamp too far in the future rejected');
const edge = verifyResendSignature({
  secret: SECRET, id, timestamp: String(NOW), signature: sign(id, NOW, body),
  body, nowSeconds: NOW + 4 * 60,
});
check('inside tolerance still accepted', edge.ok === true);

console.log('\nSecret rotation - multiple signatures, any match wins');
const rotate = verifyResendSignature({
  secret: SECRET, id, timestamp: String(NOW),
  signature: `v1,${Buffer.from('old').toString('base64')} ${sign(id, NOW, body)}`,
  body, nowSeconds: NOW,
});
check('accepts when one of several v1 signatures matches', rotate.ok === true);

console.log('\nNormalisation');
const opened = normalizeEvent({
  type: 'email.opened',
  created_at: '2026-08-01T23:10:00Z',
  data: {
    email_id: 'e_1', to: ['Investor@Example.com '.trim()], subject: 'x',
    tags: [{ name: 'campaign', value: 'offer-picks-2026-08-01' }],
  },
}, 'svix_1');
check('campaign read from the tag, not the subject', opened.campaign === 'offer-picks-2026-08-01');
check('recipient lowercased', opened.recipient === 'investor@example.com');
check('svix id becomes the idempotency key', opened.event_id === 'svix_1');

const clicked = normalizeEvent({
  type: 'email.clicked',
  created_at: '2026-08-01T23:11:00Z',
  data: { email_id: 'e_1', to: ['a@b.c'], click: { link: 'https://site/listing/1' }, tags: [] },
}, 'svix_2');
check('click link captured', clicked.link === 'https://site/listing/1');
check('missing campaign tag -> null, not invented', clicked.campaign === null);
check('untracked type ignored', normalizeEvent({ type: 'contact.updated', data: {} }, 's') === null);
check('garbage payload ignored', normalizeEvent(null, 's') === null);

console.log('\nRollup - rates must not flatter');
const ev = (type, recipient, extra = {}) => ({ type, recipient, occurred_at: '2026-08-01T23:00:00Z', ...extra });
const s = summarize([
  ...['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com'].map((r) => ev('email.sent', r)),
  ...['a@x.com', 'b@x.com', 'c@x.com'].map((r) => ev('email.delivered', r)),
  ev('email.bounced', 'd@x.com'),
  ev('email.opened', 'a@x.com'), ev('email.opened', 'a@x.com'), ev('email.opened', 'b@x.com'),
  ev('email.clicked', 'a@x.com', { link: 'https://site/listing/1' }),
  ev('email.clicked', 'a@x.com', { link: 'https://site/listing/1' }),
]);
check('delivered counts unique people', s.delivered === 3, `got ${s.delivered}`);
check('opens split unique vs total', s.openedUnique === 2 && s.openedTotal === 3,
  `${s.openedUnique}/${s.openedTotal}`);
check('open rate is over DELIVERED (2/3), not sent', s.openRate === 66.7, `got ${s.openRate}`);
check('click rate over delivered (1/3)', s.clickRate === 33.3, `got ${s.clickRate}`);
check('bounce counted', s.bounced === 1 && s.bounceRate === 33.3);
check('top links aggregated', s.topLinks[0].link === 'https://site/listing/1' && s.topLinks[0].count === 2);

console.log('\nThe follow-up list');
check('clickers rank above openers', s.engaged[0].email === 'a@x.com');
check('opener still listed', s.engaged.some((p) => p.email === 'b@x.com'));
check('non-openers excluded', !s.engaged.some((p) => p.email === 'c@x.com'));
check('per-person link list', s.engaged[0].links.length === 1);
check('bounced person is not "engaged"', !s.engaged.some((p) => p.email === 'd@x.com'));

console.log('\nEmpty and degenerate input');
const z = summarize([]);
check('no events -> zeros, rates null not NaN',
  z.delivered === 0 && z.openRate === null && z.engaged.length === 0);
check('undefined input safe', summarize(undefined).delivered === 0);

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} - ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
