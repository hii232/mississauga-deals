/**
 * Guards the crawler classifier.
 *
 *   node lib/seo/crawlers.test.mjs
 *
 * The classifier only writes a log label, so a wrong answer cannot break a
 * page. It CAN send the next investigation the wrong way, though, and the two
 * mistakes that would do it are both here: labelling a real visitor as a bot
 * (which would make ordinary traffic look like a crawl), and labelling a
 * training crawler as its search-engine namesake (which would hide the exact
 * bot the robots.txt change is meant to stop).
 */

import { classifyCrawler, DISALLOWED_CRAWLERS, ALLOWED_CRAWLERS } from './crawlers.js';

let pass = 0; const failures = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name} ${detail}`); }
}

console.log('\nReal browsers are NOT crawlers');
// The failure that would matter most: every visitor logged as a bot.
const BROWSERS = [
  // iPhone Safari — the site's dominant device (mobile-first at ~375px).
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0',
];
for (const ua of BROWSERS) {
  check(`browser not flagged: ${ua.slice(0, 42)}…`, classifyCrawler(ua) === null, JSON.stringify(classifyCrawler(ua)));
}

console.log('\nSearch engines are recognised and NOT marked disallowed');
const ALLOWED_UAS = [
  ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
  ['Googlebot-Image', 'Googlebot-Image/1.0'],
  ['Bingbot', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'],
  ['DuckDuckBot', 'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)'],
  ['Applebot', 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)'],
  ['OAI-SearchBot', 'Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)'],
  ['PerplexityBot', 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)'],
];
for (const [want, ua] of ALLOWED_UAS) {
  const got = classifyCrawler(ua);
  check(`${want} recognised`, got?.name === want, JSON.stringify(got));
  check(`${want} not disallowed`, got?.disallowed === false, JSON.stringify(got));
}

console.log('\nBlocked crawlers are recognised AND marked disallowed');
const DISALLOWED_UAS = [
  ['AhrefsBot', 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)'],
  ['SemrushBot', 'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)'],
  ['GPTBot', 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot'],
  ['ClaudeBot', 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)'],
  ['CCBot', 'CCBot/2.0 (https://commoncrawl.org/faq/)'],
  ['Bytespider', 'Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)'],
  ['DataForSeoBot', 'Mozilla/5.0 (compatible; DataForSeoBot/1.0; +https://dataforseo.com/dataforseo-bot)'],
];
for (const [want, ua] of DISALLOWED_UAS) {
  const got = classifyCrawler(ua);
  check(`${want} recognised`, got?.name === want, JSON.stringify(got));
  check(`${want} marked disallowed`, got?.disallowed === true, JSON.stringify(got));
}

console.log('\nThe training-vs-search trap');
// "Applebot-Extended" CONTAINS "Applebot", and "Google-Extended" is a distinct
// bot from "Googlebot". Order-dependent, and getting either wrong would hide a
// blocked crawler behind the name of one we deliberately allow.
const appleExt = classifyCrawler('Mozilla/5.0 (compatible; Applebot-Extended/1.0; +http://www.apple.com/go/applebot)');
check('Applebot-Extended is NOT labelled Applebot', appleExt?.name === 'Applebot-Extended', JSON.stringify(appleExt));
check('Applebot-Extended is disallowed', appleExt?.disallowed === true, JSON.stringify(appleExt));
const googleExt = classifyCrawler('Mozilla/5.0 (compatible; Google-Extended/1.0)');
check('Google-Extended is disallowed', googleExt?.disallowed === true, JSON.stringify(googleExt));
check('plain Googlebot still allowed after that',
  classifyCrawler('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')?.disallowed === false);

console.log('\nUnknown bots surface their raw name so the list can grow');
const unknown = classifyCrawler('Mozilla/5.0 (compatible; SomeNewBot/3.0; +http://example.com)');
check('unknown bot is flagged', unknown !== null, JSON.stringify(unknown));
check('unknown bot is not falsely marked disallowed', unknown?.disallowed === false);
check('unknown bot carries the raw UA', unknown?.name.startsWith('other:'), JSON.stringify(unknown));
check('unknown bot label is bounded', unknown.name.length <= 66, String(unknown.name.length));
check('curl flagged', classifyCrawler('curl/8.4.0') !== null);
check('python-requests flagged', classifyCrawler('python-requests/2.31.0') !== null);

console.log('\nMissing / junk user agents are safe');
check('empty string -> none', classifyCrawler('')?.name === 'none');
check('whitespace -> none', classifyCrawler('   ')?.name === 'none');
check('undefined -> none', classifyCrawler(undefined)?.name === 'none');
check('null -> none', classifyCrawler(null)?.name === 'none');
check('non-string -> none', classifyCrawler(12345)?.name === 'none');
check('absent UA is not marked disallowed', classifyCrawler('')?.disallowed === false);

console.log('\nThe two lists stay disjoint');
// A name in both would make the disallowed flag depend on iteration order.
const overlap = DISALLOWED_CRAWLERS.filter((d) => ALLOWED_CRAWLERS.includes(d));
check('no name is both allowed and disallowed', overlap.length === 0, String(overlap));
check('Googlebot is NOT in the disallow list', !DISALLOWED_CRAWLERS.includes('Googlebot'));
check('Bingbot is NOT in the disallow list', !DISALLOWED_CRAWLERS.includes('Bingbot'));

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'} — ${pass} checks passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
