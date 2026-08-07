#!/usr/bin/env node
/* SEO presence checks for every HTML page in the repo.
 *
 * This is the test harness for the SEO enablement work: it encodes the rules
 * that are easy to get wrong when six pages each hand-maintain their own <head>.
 * Node stdlib only — the repo has no package manager and should not gain one.
 *
 * Usage:  node scripts/check-seo.mjs            # every page
 *         node scripts/check-seo.mjs index.html # just one
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://trunkmobile.app';
const SKIP_DIRS = new Set(['.git', 'node_modules', 'docs', 'scripts', 'assets']);

/* 404.html is deliberately noindex, so the discovery tags don't apply to it. */
const NOINDEX = new Set(['404.html']);

/* Search Console verification token. Google reads this from the homepage only.
 *
 * This is asserted rather than trusted because losing it fails silently: there is
 * no error page and no broken link, Google simply revokes the property after a
 * while and the reports stop arriving. index.html's <head> has been rewritten
 * from scratch several times, and each rewrite was one forgotten line away from
 * costing the Search Console history.
 *
 * If you ever re-verify with a fresh token, update this value to match. */
const VERIFY_TOKEN = 'pKF7ivNDv7vS3oPGxFxO6no69DMk7vZL1f-w3tNy7zY';

function findHtml(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/* Enough entity handling to compare a <title> against an og:title honestly. */
const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const attrOf = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3]) : null;
};

function metaContent(html, key) {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const n = (attrOf(tag, 'name') || attrOf(tag, 'property') || '').toLowerCase();
    if (n === key) return decode(attrOf(tag, 'content') ?? '');
  }
  return null;
}

function check(file) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  const errs = [];
  const noindex = NOINDEX.has(rel.split('/').pop());
  const allowTitleMismatch = /<!--\s*seo-check:\s*allow-title-mismatch\s*-->/i.test(html);

  const titleTag = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleTag ? decode(titleTag[1]) : null;
  if (!title) errs.push('missing <title>');
  else if (title.length > 60) errs.push(`<title> is ${title.length} chars (max 60)`);

  const desc = metaContent(html, 'description');
  if (desc === null) errs.push('missing <meta name="description">');
  else if (desc.length > 160) errs.push(`description is ${desc.length} chars (max 160)`);

  if (!/<meta\b[^>]*name\s*=\s*["']viewport["']/i.test(html)) {
    errs.push('missing <meta name="viewport">');
  }

  /* Homepage only — Google does not look anywhere else for this. */
  if (rel === 'index.html') {
    const token = metaContent(html, 'google-site-verification');
    if (token === null) {
      errs.push('missing <meta name="google-site-verification"> — losing this silently revokes Search Console access');
    } else if (token !== VERIFY_TOKEN) {
      errs.push(`google-site-verification token changed\n           found:    ${token}\n           expected: ${VERIFY_TOKEN}`);
    }
  }

  if (!noindex) {
    const canonTag = (html.match(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i) || [])[0];
    const canon = canonTag ? attrOf(canonTag, 'href') : null;
    if (!canon) errs.push('missing <link rel="canonical">');
    else if (!canon.startsWith(ORIGIN)) errs.push(`canonical is not absolute: ${canon}`);

    for (const key of ['og:image', 'og:url']) {
      const v = metaContent(html, key);
      if (v === null) errs.push(`missing ${key}`);
      else if (!v.startsWith('https://')) errs.push(`${key} must be an absolute URL: ${v}`);
    }

    /* Exact match, not fuzzy similarity. The bug this exists to catch paired a page
       titled "Trunk – Smart Packing Assistant" with a twitter:title of "Trunk Blog –
       Smart Packing Tips & Travel Advice" — those share "Smart" and "Packing", so any
       overlap heuristic passes them and catches nothing. */
    if (!allowTitleMismatch) {
      for (const key of ['og:title', 'twitter:title']) {
        const v = metaContent(html, key);
        if (v === null) errs.push(`missing ${key}`);
        else if (v !== title) {
          errs.push(`${key} does not match <title>\n           ${key}: ${v}\n           <title>: ${title}`);
        }
      }
    }
  }

  const h1Count = [...html.matchAll(/<h1\b[^>]*>/gi)].length;
  if (h1Count !== 1) errs.push(`expected exactly 1 <h1>, found ${h1Count}`);

  for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = attrOf(tag, 'src') || '(no src)';
    if (attrOf(tag, 'alt') === null) errs.push(`<img> missing alt: ${src}`);
    /* SVGs scale freely; an intrinsic pixel size is not meaningful for them. */
    if (/\.svg(\?|$)/i.test(src)) continue;
    if (!attrOf(tag, 'width') || !attrOf(tag, 'height')) {
      errs.push(`<img> missing width/height: ${src}`);
    }
  }

  const ldRe = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const [, body] of html.matchAll(ldRe)) {
    try {
      const data = JSON.parse(body);
      for (const node of [].concat(data)) {
        if (!node['@context']) errs.push('JSON-LD block missing @context');
        if (!node['@type']) errs.push('JSON-LD block missing @type');
      }
    } catch (e) {
      errs.push(`JSON-LD is not valid JSON: ${e.message}`);
    }
  }

  return { rel, errs };
}

const args = process.argv.slice(2);
const files = (args.length ? args.map((a) => resolve(a)) : findHtml(ROOT)).sort();

let failed = 0;
for (const file of files) {
  const { rel, errs } = check(file);
  if (errs.length === 0) {
    console.log(`  ok    ${rel}`);
    continue;
  }
  failed++;
  console.log(`  FAIL  ${rel}`);
  for (const e of errs) console.log(`         - ${e}`);
}

console.log(
  failed
    ? `\n${failed} of ${files.length} page(s) failed.`
    : `\nAll ${files.length} page(s) passed.`
);
process.exit(failed ? 1 : 0);
