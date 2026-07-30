# SEO Enablement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make trunkmobile.app rank and convert for packing-app search queries by fixing its metadata, adding structured data, expanding the homepage from ~120 to ~1,000 words, and cutting page weight.

**Architecture:** A hand-written static site served by GitHub Pages. No build step, no framework, no package manager. Metadata is duplicated across six HTML files by design — a validation script (`scripts/check-seo.mjs`) is the safety net that keeps the copies honest. That script is written **first**, fails against the current site, and each subsequent task drives it further toward green. It is the test harness for this project.

**Tech Stack:** Static HTML5, hand-authored CSS with custom properties, Node.js ≥18 (stdlib only, for the validation script), `sips` (macOS built-in, for image processing). No dependencies are added to the repo.

## Global Constraints

- **Origin:** `https://trunkmobile.app` — every canonical, `og:url`, and `og:image` must be absolute against this origin.
- **App entity name:** `Trunk: Packing List & Trips` — this exact string, matching the App Store listing, goes in JSON-LD `name`. It does **not** go in any `<title>`.
- **App Store URL:** `https://apps.apple.com/app/trunk-smart-packing-assistant/id6747906870`
- **Publisher:** `Aquarius TX Labs` (confirmed).
- **The app is free** (confirmed) — `offers.price` is `"0"`, currency `USD`.
- **Platform today is iOS only**; Android is in development. No page may promise an Android date.
- **`og:title` and `twitter:title` must equal the page `<title>` byte-for-byte** after HTML-entity decoding.
- **`<title>` ≤ 60 characters; `<meta name="description">` ≤ 160 characters.** Enforced by the script.
- **Exactly one `<h1>` per page.** Enforced by the script.
- **No `aggregateRating`** in any schema. Ratings that don't match a verifiable source are a manual-action risk.
- **Every `<img>` needs `alt`;** every raster `<img>` also needs `width` and `height`. SVGs are exempt from dimensions.
- **Design tokens** are already defined in both stylesheets (`--ink`, `--ink-2`, `--sky-text`, `--coral`, `--card`, `--border`, `--r-card`, `--shadow-card`, …). New CSS uses them; it never introduces raw hex values.
- **Never run `git push`.** Commit locally only.

---

## Pre-flight: capture baselines (human, not agent)

These require the live site and the owner's Google account, so an agent cannot do them. They must happen **before** Task 2 lands, because Task 2 changes the numbers.

- [ ] Run PageSpeed Insights (**Mobile** tab) on `https://trunkmobile.app/` and on `https://trunkmobile.app/blog/`. Record Performance score and LCP for each.
- [ ] In Search Console → Performance, set the range to the last 28 days and record total impressions, total clicks, and average position.
- [ ] In GA4, record organic sessions and `app_store_click` event count for the last 28 days.
- [ ] Paste all three into `docs/superpowers/plans/2026-07-30-seo-baseline.md` and commit.

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `scripts/check-seo.mjs` | Create | The test harness. Presence and consistency checks for every HTML file. |
| `index.html` | Modify | Homepage: head, JSON-LD, ~880 words of new copy, `<h1>` restructure, image attributes. |
| `privacy.html` | Modify | Head (incl. missing viewport), `WebPage` schema. |
| `blog/index.html` | Modify | Head (incl. missing viewport), `Blog` schema, image attributes. |
| `blog/posts/001-packing-hacks.html` | Modify | Head, `BlogPosting` + `BreadcrumbList`, visible date, `<h1>` fix. |
| `blog/posts/002-carryon-guide.html` | Modify | Same. |
| `blog/posts/003-smarter-with-trunk.html` | Modify | Same. |
| `styles/styles.css` | Modify | Styles for the five new homepage sections and the `<h1>` subtitle. |
| `blog/styles/styles.css` | Modify | Styles for the demoted masthead and the post date line. |
| `sitemap.xml` | Modify | Namespace fix, `lastmod`. |
| `404.html` | Create | Noindex error page. |
| `assets/images/*` | Modify | Four images resized; one re-encoded to JPEG. |

---

## Task 1: SEO validation harness

**Files:**
- Create: `scripts/check-seo.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: the command `node scripts/check-seo.mjs [file...]`. Exits `0` when every checked file passes, `1` otherwise. With no arguments it walks the repo, skipping `.git`, `node_modules`, `docs`, and `scripts`. Every later task runs this against the file it just edited.

- [ ] **Step 1: Write the harness**

Create `scripts/check-seo.mjs`:

```js
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
```

- [ ] **Step 2: Run it and confirm it fails against the current site**

Run: `node scripts/check-seo.mjs`

Expected: exit code 1, all 6 pages FAIL. Confirm these specific findings appear, because they are the known live defects the harness must detect:

- `index.html` — `twitter:title does not match <title>`, `missing <meta name="description">`, `missing <link rel="canonical">`, `og:image must be an absolute URL: /assets/images/twitter_banner.png`
- `privacy.html` — `missing <meta name="viewport">`
- `blog/index.html` — `missing <meta name="viewport">`
- `blog/posts/001-packing-hacks.html` — `expected exactly 1 <h1>, found 2`

If any of those four are absent, the harness is broken — fix it before continuing.

Two further failures are expected and are **not** harness bugs: posts 001 and 002
report `<title> is 63 chars` and `62 chars` respectively. Their current titles
carry a `| Trunk Blog` suffix that pushes them past the SERP truncation limit. The
shorter titles in Task 6 resolve both.

This run has been verified against the site as it stands: 6 of 6 pages fail, exit
code 1.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-seo.mjs
git commit -m "Add SEO metadata validation script

Fails against the current site, reporting the known defects: a
copy-pasted Twitter title on the homepage, missing viewport tags on
two pages, relative og:image URLs, and duplicate h1 elements on
every blog post."
```

---

## Task 2: Image optimization

**Files:**
- Modify: `assets/images/packed_suitcase.jpg`, `assets/images/notepad.jpg`, `assets/images/lightbulb.jpg`
- Create: `assets/images/twitter_banner.jpg`
- Delete: `assets/images/twitter_banner.png`

**Interfaces:**
- Consumes: nothing.
- Produces: the social card is now `https://trunkmobile.app/assets/images/twitter_banner.jpg` at 1200×630. Tasks 3, 5, and 6 reference that exact URL. The three thumbnails keep their filenames, so no markup path changes follow from them.

**Note on the banner rename.** The spec says filenames are preserved. This one file is a deliberate exception: 1200×630 photographic content cannot reach the ~120 KB target as PNG, and Open Graph cards are composited onto opaque backgrounds so alpha is not needed. The only references to it live in `<head>` blocks that Tasks 3 and 5 rewrite anyway, so the rename costs nothing. No other filename changes.

- [ ] **Step 1: Record the before state**

```bash
cd assets/images
ls -l packed_suitcase.jpg notepad.jpg lightbulb.jpg twitter_banner.png
```

Expected, approximately: 1.2 MB, 990 KB, 377 KB, 1.0 MB. Total ~3.5 MB.

- [ ] **Step 2: Resize the three blog thumbnails**

These render at 120×120 (`.blog-list img.thumbnail`), so 800 px on the long edge is already generous.

```bash
cd assets/images
sips -Z 800 --setProperty formatOptions 72 packed_suitcase.jpg
sips -Z 800 --setProperty formatOptions 72 notepad.jpg
sips -Z 800 --setProperty formatOptions 72 lightbulb.jpg
```

- [ ] **Step 3: Rebuild the social card at 1200×630**

`sips -Z` scales the long edge; `sips -c` then crops to the exact Open Graph aspect from the center.

```bash
cd assets/images
sips -s format jpeg -s formatOptions 80 twitter_banner.png --out twitter_banner.jpg
sips -Z 1200 twitter_banner.jpg
sips -c 630 1200 twitter_banner.jpg
rm twitter_banner.png
```

- [ ] **Step 4: Verify the results**

```bash
cd assets/images
ls -l packed_suitcase.jpg notepad.jpg lightbulb.jpg twitter_banner.jpg
sips -g pixelWidth -g pixelHeight twitter_banner.jpg
```

Expected: each thumbnail under 100 KB, `twitter_banner.jpg` under 200 KB and reporting exactly `pixelWidth: 1200` / `pixelHeight: 630`. Total for the four files under 400 KB, down from ~3.5 MB.

Then open `twitter_banner.jpg` and confirm the center crop did not cut off the Trunk logo or wordmark. If it did, re-crop with an offset instead of accepting a broken card.

- [ ] **Step 5: Commit**

```bash
git add -A assets/images
git commit -m "Resize oversized images and rebuild the social card

The blog thumbnails were full-resolution stock photos (up to
5184x3888) rendered at 120x120, making the blog index ship ~2.5MB to
show three cards. Resized to 800px.

The social card was 1536x1024, a 3:2 image cropped badly by platforms
targeting 1.91:1. Rebuilt as a 1200x630 JPEG."
```

---

## Task 3: Homepage head and structured data

**Files:**
- Modify: `index.html` (the `<head>` block, lines 3–25, plus `<img>` attributes in the body)

**Interfaces:**
- Consumes: `twitter_banner.jpg` from Task 2.
- Produces: the homepage's `MobileApplication` JSON-LD. Task 6's `BreadcrumbList` nodes reference `https://trunkmobile.app/` as their root; Task 4 adds a second JSON-LD block (`FAQPage`) to this same file, so leave the existing block clearly delimited.

- [ ] **Step 1: Replace the `<head>` block**

Replace everything from `<head>` through `</head>` in `index.html` with:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="google-site-verification" content="pKF7ivNDv7vS3oPGxFxO6no69DMk7vZL1f-w3tNy7zY" />

  <title>Trunk — Smart Packing List App for Travel</title>
  <meta name="description" content="Plan trips, build reusable packing lists, and track exactly which bag each item is in. Trunk is a free packing list app for travelers. On iPhone." />
  <link rel="canonical" href="https://trunkmobile.app/" />
  <meta name="theme-color" content="#062336" />

  <!-- Open Graph -->
  <meta property="og:title" content="Trunk — Smart Packing List App for Travel" />
  <meta property="og:description" content="Plan trips, build reusable packing lists, and track exactly which bag each item is in. Trunk is a free packing list app for travelers." />
  <meta property="og:image" content="https://trunkmobile.app/assets/images/twitter_banner.jpg" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://trunkmobile.app/" />
  <meta property="og:site_name" content="Trunk" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Trunk — Smart Packing List App for Travel" />
  <meta name="twitter:description" content="Plan trips, build reusable packing lists, and track exactly which bag each item is in. Trunk is a free packing list app for travelers." />
  <meta name="twitter:image" content="https://trunkmobile.app/assets/images/twitter_banner.jpg" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <link rel="stylesheet" href="styles/styles.css" />
  <link rel="icon" href="./assets/images/favicon.ico" type="image/x-icon" />
  <link rel="apple-touch-icon" href="./assets/images/app_icon_carryon.png" />
  <script src="/assets/js/analytics.js" defer></script>

  <!-- App entity. `name` matches the App Store listing exactly; the <title> above is
       tuned for the SERP instead. No aggregateRating: unverifiable ratings are a
       manual-action risk. -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "Trunk: Packing List & Trips",
    "alternateName": "Trunk",
    "operatingSystem": "iOS",
    "applicationCategory": "TravelApplication",
    "url": "https://trunkmobile.app/",
    "downloadUrl": "https://apps.apple.com/app/trunk-smart-packing-assistant/id6747906870",
    "description": "Trunk is a packing list app for travelers. Create a trip, build a packing list from a reusable item inventory, assign each item to a specific bag, and track what is still unpacked.",
    "image": "https://trunkmobile.app/assets/images/twitter_banner.jpg",
    "screenshot": [
      "https://trunkmobile.app/assets/images/screenshot_1.png",
      "https://trunkmobile.app/assets/images/screenshot_2.png",
      "https://trunkmobile.app/assets/images/screenshot_3.png"
    ],
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Aquarius TX Labs",
      "url": "https://trunkmobile.app/"
    }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Trunk",
    "url": "https://trunkmobile.app/"
  }
  </script>
</head>
```

- [ ] **Step 2: Add dimensions and alt text to the body images**

The logo is an SVG and needs only `alt`. Replace the existing logo tag:

```html
<img src="./assets/images/app_icon_new.svg" class="icon-logo" alt="Trunk app icon" />
```

Replace the three hero screenshots. The first is the LCP element, so it stays eager and gets `fetchpriority="high"`; the other two can wait:

```html
<img src="./assets/images/screenshot_1.png" width="1290" height="2796" fetchpriority="high" decoding="async" alt="Trunk trip list showing upcoming trips with packing progress for each" />
<img src="./assets/images/screenshot_2.png" width="1290" height="2796" loading="lazy" decoding="async" alt="A saved packing list in Trunk, with items grouped by category" />
<img src="./assets/images/screenshot_3.png" width="1290" height="2796" loading="lazy" decoding="async" alt="Trunk item inventory showing reusable items ready to add to a trip" />
```

Replace the two screenshot-row images:

```html
<img src="./assets/images/screenshot_4.png" width="1290" height="2796" loading="lazy" decoding="async" alt="Creating a new trip in Trunk with a destination and travel dates" />
<img src="./assets/images/screenshot_5.png" width="1290" height="2796" loading="lazy" decoding="async" alt="A Trunk packing list with items checked off and assigned to bags" />
```

- [ ] **Step 3: Run the validation script**

Run: `node scripts/check-seo.mjs index.html`

Expected: `ok    index.html`, exit code 0. Every homepage failure from Task 1 Step 2 is now resolved.

- [ ] **Step 4: Verify the page still renders**

Run: `python3 -m http.server 8000` and open `http://localhost:8000/`.

Confirm: the hero renders unchanged, the logo tile still shows, all five screenshots load, and the browser console is free of 404s. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Add homepage metadata and app structured data

Adds the missing description and canonical, fixes the Twitter card
that described the blog, makes og:image absolute so social cards
resolve, and preconnects fonts.gstatic.com where the font files
actually come from.

Adds MobileApplication and WebSite JSON-LD. The schema name matches
the App Store listing exactly; the title tag is tuned for the SERP."
```

---

## Task 4: Homepage content expansion

**Files:**
- Modify: `index.html` (body: hero `<h1>`, four new sections, footer)
- Modify: `styles/styles.css` (append new rules)

**Interfaces:**
- Consumes: the `<head>` from Task 3. Adds a second JSON-LD block (`FAQPage`) into that head.
- Produces: new CSS classes `.wordmark`, `.h1-sub`, `.steps`, `.use-case-grid`, `.reason-grid`, `.faq-list`, `.blog-links`. Nothing later depends on them.

- [ ] **Step 1: Restructure the hero `<h1>`**

The `<h1>` is currently the single word "Trunk" — the most heavily weighted element on the page spent on a term nobody searches. Replace the `.hero-title` block and the tagline:

```html
<div class="hero-title">
  <img src="./assets/images/app_icon_new.svg" class="icon-logo" alt="Trunk app icon" />
  <h1>
    <span class="wordmark">Trunk</span>
    <span class="h1-sub">Packing List App for Travel</span>
  </h1>
</div>
<p class="tagline">Travel with confidence.</p>
<p class="hero-lede">Build a packing list for every trip, track exactly which bag each item is in, and reuse your lists next time. Everything stays on your device.</p>
```

- [ ] **Step 2: Rewrite the Features section copy**

Replace the `<h2>Features</h2>` heading and the four `<p>` elements inside `.feature-grid` (leave the icons and `<h3>`s alone except where shown):

```html
<h2>Everything you need to pack for a trip</h2>
```

Then the four descriptions, in order:

```html
<p>Set your destination, dates, and trip notes, then keep every trip's packing list in its own place.</p>
<p>Add items, assign them to bags, and watch your packing progress as you check things off.</p>
<p>Keep a reusable inventory of everything you travel with, categorized and ready to drop into your next trip.</p>
<p>Know which suitcase, carry-on, or backpack every item went into — no more unzipping three bags to find your charger.</p>
```

- [ ] **Step 3: Add the "How Trunk works" section**

Insert immediately **after** the closing `</header>` tag and **before** `<section id="features" ...>`:

```html
<section id="how-it-works" class="centered-content">
  <h2>How Trunk works</h2>
  <ol class="steps">
    <li>
      <span class="step-number">1</span>
      <h3>Create your trip</h3>
      <p>Add your destination and travel dates. Trunk keeps every trip separate, so a weekend away and a two-week holiday never get tangled together.</p>
    </li>
    <li>
      <span class="step-number">2</span>
      <h3>Build your packing list</h3>
      <p>Pull items from your saved inventory or add new ones as you think of them. Group them by category so nothing hides at the bottom of a long list.</p>
    </li>
    <li>
      <span class="step-number">3</span>
      <h3>Pack and check off</h3>
      <p>Assign each item to a specific bag as you pack it. Trunk shows what is still unpacked and what is inside every bag, right up to the moment you leave.</p>
    </li>
  </ol>
</section>
```

- [ ] **Step 4: Add the use-case and reasons sections**

Insert immediately **after** the closing `</section>` of `#features` and **before** `<section class="pro-banner">`:

```html
<section id="use-cases" class="centered-content">
  <h2>Built for every kind of trip</h2>
  <div class="use-case-grid">
    <div class="use-case">
      <h3>Carry-on only</h3>
      <p>When every cubic inch counts, a written list is the difference between fitting a week into one bag and checking luggage you did not need. Build the list, trim it down, then pack against it.</p>
    </div>
    <div class="use-case">
      <h3>Family travel</h3>
      <p>Packing for four people means four sets of essentials and four times the chances to forget something. Keep a separate list per traveler and track whose things went into which bag.</p>
    </div>
    <div class="use-case">
      <h3>Business trips</h3>
      <p>The same trip, over and over. Save your standard work-travel list once and apply it to the next booking in seconds — chargers, adapters, and the good shirt included.</p>
    </div>
    <div class="use-case">
      <h3>Long and multi-stop trips</h3>
      <p>Longer trips mean more gear and more bags. Trunk keeps the full inventory visible, so you can see what is packed, what is missing, and where it all is before you move on.</p>
    </div>
  </div>
</section>

<section id="why-trunk" class="centered-content">
  <h2>Why travelers choose Trunk</h2>
  <div class="reason-grid">
    <div class="reason">
      <h3>No account required</h3>
      <p>Download it and start packing. There is no sign-up, no password, and no profile to create.</p>
    </div>
    <div class="reason">
      <h3>Your data stays on your device</h3>
      <p>Trips, lists, and photos are stored locally on your phone rather than uploaded to us. We never see them.</p>
    </div>
    <div class="reason">
      <h3>Works without a signal</h3>
      <p>Your packing lists work offline, so a hotel with bad Wi-Fi or a plane at 30,000 feet does not lock you out.</p>
    </div>
    <div class="reason">
      <h3>Lists you can reuse</h3>
      <p>Your item inventory carries from trip to trip, so the second trip packs faster than the first.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Add the FAQ and blog sections**

Insert immediately **after** the closing `</section>` of `.pro-banner` and **before** `<footer>`:

```html
<section id="faq" class="centered-content">
  <h2>Frequently asked questions</h2>
  <dl class="faq-list">
    <dt>Is Trunk free?</dt>
    <dd>Yes. Trunk is free to download and use, with no ads and no subscription required for the packing features. A paid Pro tier with AI-generated lists and travel-app integrations is in development.</dd>

    <dt>Does Trunk work offline?</dt>
    <dd>Your trips, packing lists, items, and bags all work offline, because they are stored on your device. Two things need a connection: searching for a destination and loading the weather forecast for a trip.</dd>

    <dt>Do I need an account to use Trunk?</dt>
    <dd>No. Trunk has no accounts and no sign-up. Open the app and start building a list.</dd>

    <dt>Can I reuse a packing list for another trip?</dt>
    <dd>Yes. Trunk keeps a personal item inventory that carries across every trip, so you build each new list from things you have already added instead of starting over.</dd>

    <dt>Can Trunk tell me which bag an item is in?</dt>
    <dd>Yes — that is what luggage tracking does. Assign each item to a specific bag as you pack, and Trunk shows you at a glance what is inside every bag.</dd>

    <dt>Is Trunk available on Android?</dt>
    <dd>Trunk is on iPhone and iPad today. An Android version is in development.</dd>

    <dt>Where is my data stored?</dt>
    <dd>On your device. Your trips, packing lists, items, and photos are stored locally and are not uploaded to us — there are no accounts, and we build no profile of you. Your device's own iCloud or Google backup may include the app's data, and limited anonymous usage and crash information is collected unless you turn it off. Full details are in our <a href="privacy.html">privacy policy</a>.</dd>
  </dl>
</section>

<section id="from-the-blog" class="centered-content">
  <h2>Packing tips from the Trunk blog</h2>
  <ul class="blog-links">
    <li><a href="./blog/posts/001-packing-hacks.html">10 Packing Hacks Every Frequent Traveler Swears By</a></li>
    <li><a href="./blog/posts/002-carryon-guide.html">How to Pack 7 Days in a Carry-On</a></li>
    <li><a href="./blog/posts/003-smarter-with-trunk.html">How Trunk Helps You Pack Smarter, Not Harder</a></li>
  </ul>
  <p class="blog-links-more"><a href="./blog/index.html">Read more on the blog →</a></p>
</section>
```

- [ ] **Step 6: Add the FAQPage JSON-LD**

Append inside `<head>`, after the `WebSite` block from Task 3. The `text` values must match the visible answers — schema that disagrees with the page is a spam signal.

> This will not produce rich snippets. Google restricted FAQ rich results to government and health sites in August 2023. It is here because AI Overviews, ChatGPT, and Perplexity parse it.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is Trunk free?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Trunk is free to download and use, with no ads and no subscription required for the packing features. A paid Pro tier with AI-generated lists and travel-app integrations is in development." }
    },
    {
      "@type": "Question",
      "name": "Does Trunk work offline?",
      "acceptedAnswer": { "@type": "Answer", "text": "Your trips, packing lists, items, and bags all work offline, because they are stored on your device. Two things need a connection: searching for a destination and loading the weather forecast for a trip." }
    },
    {
      "@type": "Question",
      "name": "Do I need an account to use Trunk?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Trunk has no accounts and no sign-up. Open the app and start building a list." }
    },
    {
      "@type": "Question",
      "name": "Can I reuse a packing list for another trip?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Trunk keeps a personal item inventory that carries across every trip, so you build each new list from things you have already added instead of starting over." }
    },
    {
      "@type": "Question",
      "name": "Can Trunk tell me which bag an item is in?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes — that is what luggage tracking does. Assign each item to a specific bag as you pack, and Trunk shows you at a glance what is inside every bag." }
    },
    {
      "@type": "Question",
      "name": "Is Trunk available on Android?",
      "acceptedAnswer": { "@type": "Answer", "text": "Trunk is on iPhone and iPad today. An Android version is in development." }
    },
    {
      "@type": "Question",
      "name": "Where is my data stored?",
      "acceptedAnswer": { "@type": "Answer", "text": "On your device. Your trips, packing lists, items, and photos are stored locally and are not uploaded to us — there are no accounts, and we build no profile of you. Your device's own iCloud or Google backup may include the app's data, and limited anonymous usage and crash information is collected unless you turn it off. Full details are in our privacy policy." }
    }
  ]
}
</script>
```

- [ ] **Step 7: Add the CSS**

Append to `styles/styles.css`:

```css
/* ---------------------------------------------------------------- hero h1 */
/* The h1 carries both the wordmark and a descriptive line. Visible text, not a
   hidden keyword span — hidden text works today and gets discounted later. */
.hero-title h1 {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
  font-size: inherit;
}

.hero-title .wordmark {
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: -.03em;
  line-height: 1;
}

.hero-title .h1-sub {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.3;
  color: #CFE8F5;
}

.hero-lede {
  max-width: 34rem;
  margin: 0.75rem 0 0;
  color: #CFE8F5;
  font-size: 1.05rem;
  line-height: 1.6;
}

/* ------------------------------------------------------- how Trunk works */
.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
}

.steps li {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  padding: 1.5rem;
}

.steps .step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--sky-tint);
  color: var(--sky-text);
  font-weight: 800;
  font-size: 1.1rem;
  margin-bottom: 0.9rem;
}

.steps h3 {
  margin: 0 0 0.35rem;
  font-weight: 700;
  color: var(--ink);
}

.steps p {
  margin: 0;
  color: var(--ink-2);
}

/* -------------------------------------------------- use cases and reasons */
.use-case-grid,
.reason-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
}

.use-case,
.reason {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  padding: 1.5rem;
}

.use-case h3,
.reason h3 {
  margin: 0 0 0.4rem;
  font-weight: 700;
  color: var(--ink);
}

.use-case p,
.reason p {
  margin: 0;
  color: var(--ink-2);
}

/* -------------------------------------------------------------------- FAQ */
.faq-list {
  max-width: 46rem;
  margin: 0 auto;
}

.faq-list dt {
  font-weight: 700;
  color: var(--ink);
  margin-top: 1.75rem;
  font-size: 1.05rem;
}

.faq-list dt:first-of-type {
  margin-top: 0;
}

.faq-list dd {
  margin: 0.4rem 0 0;
  color: var(--ink-2);
}

.faq-list dd a {
  color: var(--sky-text);
}

/* ------------------------------------------------------------ blog links */
.blog-links {
  max-width: 46rem;
  margin: 0 auto;
  padding-left: 1.25rem;
}

.blog-links li {
  margin-bottom: 0.5rem;
}

.blog-links a,
.blog-links-more a {
  color: var(--sky-text);
}

.blog-links-more {
  max-width: 46rem;
  margin: 1rem auto 0;
  font-weight: 600;
}

@media (max-width: 767px) {
  .hero-title h1 {
    align-items: center;
    text-align: center;
  }

  .hero-title .wordmark {
    font-size: 2.75rem;
  }

  .hero-lede {
    text-align: center;
  }
}
```

- [ ] **Step 8: Run the validation script**

Run: `node scripts/check-seo.mjs index.html`

Expected: `ok    index.html`, exit code 0. In particular the `<h1>` count is still exactly 1 (the two new spans live *inside* it) and the new `FAQPage` block parses as valid JSON.

- [ ] **Step 9: Verify rendering at both breakpoints**

Run: `python3 -m http.server 8000` and open `http://localhost:8000/`.

Confirm:
- The hero shows "Trunk" large with "Packing List App for Travel" beneath it, and the logo tile is still vertically centered against the pair.
- All five new sections render as cards consistent with the existing Features grid.
- At a 375 px viewport width the hero text centers and nothing overflows horizontally.
- The visible word count is now roughly 1,000. The `<script>` and `<style>` blocks must be stripped **before** the tags, otherwise the FAQ JSON-LD gets counted as prose and inflates the number by several hundred:

```bash
python3 - <<'PY'
import re
html = open('index.html', encoding='utf-8').read()
html = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', ' ', html, flags=re.S|re.I)
print(len(re.sub(r'<[^>]+>', ' ', html).split()))
PY
```

  Expected: 900–1,100.

Stop the server.

- [ ] **Step 10: Commit**

```bash
git add index.html styles/styles.css
git commit -m "Expand homepage copy for search relevance

Grows the homepage from ~120 to ~1000 words: how-it-works steps, trip
use cases, differentiators, an FAQ, and direct links to the blog
posts. Rewrites the feature copy to carry the target terms.

The h1 was the single word 'Trunk' — the most weighted element on the
page spent on a term nobody searches. It now carries a visible
descriptive line as well. Adds FAQPage JSON-LD, which will not produce
rich snippets (Google restricted those in 2023) but is parsed by AI
answer engines."
```

---

## Task 5: Privacy and blog index metadata

**Files:**
- Modify: `privacy.html` (head)
- Modify: `blog/index.html` (head, plus `<img>` attributes)

**Interfaces:**
- Consumes: `twitter_banner.jpg` from Task 2.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Replace the `privacy.html` head**

Replace everything from `<head>` through `</head>`:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Privacy Policy — Trunk Packing List App</title>
  <meta name="description" content="How Trunk handles your data. Your trips, lists, and photos stay on your device — no accounts, no profiles, and analytics you can turn off." />
  <link rel="canonical" href="https://trunkmobile.app/privacy.html" />
  <meta name="theme-color" content="#062336" />

  <!-- Open Graph -->
  <meta property="og:title" content="Privacy Policy — Trunk Packing List App" />
  <meta property="og:description" content="How Trunk handles your data. Your trips, lists, and photos stay on your device — no accounts and no profiles." />
  <meta property="og:image" content="https://trunkmobile.app/assets/images/twitter_banner.jpg" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://trunkmobile.app/privacy.html" />
  <meta property="og:site_name" content="Trunk" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Privacy Policy — Trunk Packing List App">
  <meta name="twitter:description" content="How Trunk handles your data. Your trips, lists, and photos stay on your device — no accounts and no profiles.">
  <meta name="twitter:image" content="https://trunkmobile.app/assets/images/twitter_banner.jpg">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./styles/styles.css">
  <link rel="icon" href="./assets/images/favicon.ico" type="image/x-icon" />
  <link rel="apple-touch-icon" href="./assets/images/app_icon_carryon.png" />
  <script src="/assets/js/analytics.js" defer></script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy",
    "url": "https://trunkmobile.app/privacy.html",
    "isPartOf": { "@type": "WebSite", "name": "Trunk", "url": "https://trunkmobile.app/" }
  }
  </script>
</head>
```

- [ ] **Step 2: Replace the `blog/index.html` head**

Replace everything from `<head>` through `</head>`:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Packing Tips &amp; Travel Advice — Trunk Blog</title>
  <meta name="description" content="Packing hacks, carry-on guides, and smarter travel planning from Trunk, the packing list app that tracks what's in every bag.">
  <link rel="canonical" href="https://trunkmobile.app/blog/" />
  <meta name="theme-color" content="#062336" />

  <!-- Open Graph -->
  <meta property="og:title" content="Packing Tips &amp; Travel Advice — Trunk Blog" />
  <meta property="og:description" content="Packing hacks, carry-on guides, and smarter travel planning from Trunk, the packing list app." />
  <meta property="og:image" content="https://trunkmobile.app/assets/images/twitter_banner.jpg" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://trunkmobile.app/blog/" />
  <meta property="og:site_name" content="Trunk" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Packing Tips &amp; Travel Advice — Trunk Blog">
  <meta name="twitter:description" content="Packing hacks, carry-on guides, and smarter travel planning from Trunk, the packing list app.">
  <meta name="twitter:image" content="https://trunkmobile.app/assets/images/twitter_banner.jpg">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./styles/styles.css">
  <link rel="icon" href="../assets/images/favicon.ico" type="image/x-icon" />
  <link rel="apple-touch-icon" href="../assets/images/app_icon_carryon.png" />
  <script src="/assets/js/analytics.js" defer></script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Trunk Blog",
    "url": "https://trunkmobile.app/blog/",
    "description": "Packing hacks, carry-on guides, and smarter travel planning from Trunk.",
    "publisher": { "@type": "Organization", "name": "Aquarius TX Labs", "url": "https://trunkmobile.app/" }
  }
  </script>
</head>
```

- [ ] **Step 3: Add dimensions and better alt text to the three thumbnails**

These render at 120×120 via CSS; the attributes carry intrinsic size so the browser reserves space before the image arrives.

`sips -Z 800` scales the long edge to 800 and preserves aspect ratio, so from the
original dimensions the post-Task-2 sizes are `notepad.jpg` 4331×6496 → **533×800**
and `packed_suitcase.jpg` 5184×3888 → **800×600**. `app_icon_carryon.png` is
untouched at 1024×1024.

Replace the three thumbnail tags:

```html
<img class="thumbnail" src="../assets/images/notepad.jpg" width="533" height="800" loading="lazy" decoding="async" alt="A notepad and pen used to plan a packing list">
<img class="thumbnail" src="../assets/images/packed_suitcase.jpg" width="800" height="600" loading="lazy" decoding="async" alt="An open suitcase packed with neatly rolled clothes">
<img class="thumbnail" src="../assets/images/app_icon_carryon.png" width="1024" height="1024" loading="lazy" decoding="async" alt="The Trunk app icon">
```

Then confirm those match reality — `sips` rounds, so a value may land a pixel off:

```bash
sips -g pixelWidth -g pixelHeight assets/images/notepad.jpg assets/images/packed_suitcase.jpg
```

If a number differs, use the reported one. A one-pixel discrepancy is harmless here (CSS forces 120×120 with `object-fit: cover`), but the attributes should still state the truth.

- [ ] **Step 4: Run the validation script**

Run: `node scripts/check-seo.mjs privacy.html blog/index.html`

Expected: both `ok`, exit code 0. The missing-viewport failures from Task 1 are gone.

- [ ] **Step 5: Verify rendering**

Run: `python3 -m http.server 8000`, then open `http://localhost:8000/privacy.html` and `http://localhost:8000/blog/`.

Confirm both render unchanged, the three thumbnails still show as 120×120 squares, and the console is free of 404s. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add privacy.html blog/index.html
git commit -m "Add metadata and schema to privacy and blog index

Both pages were missing a viewport meta entirely, which is a direct
mobile-ranking signal. Adds descriptions, canonicals, absolute Open
Graph images, WebPage and Blog schema, and image dimensions so the
thumbnails stop shifting layout."
```

---

## Task 6: Blog post metadata, dates, and heading fix

**Files:**
- Modify: `blog/posts/001-packing-hacks.html`
- Modify: `blog/posts/002-carryon-guide.html`
- Modify: `blog/posts/003-smarter-with-trunk.html`
- Modify: `blog/styles/styles.css`

**Interfaces:**
- Consumes: `twitter_banner.jpg` (Task 2); `.site-header` styles already in `blog/styles/styles.css`.
- Produces: `.site-title` (the demoted masthead) and `.post-date` classes.

**Dates**, taken from git history — all three were committed together, so they share a publication date:

| | |
|---|---|
| `datePublished` | `2025-07-29` |
| `dateModified` | `2026-07-26` |

- [ ] **Step 1: Fix the duplicate `<h1>` in all three posts**

Each post has two `<h1>`s: the "Trunk Blog" masthead and the article title. The masthead must be demoted so the article title is the page's only `<h1>`. In **each of the three files**, change the masthead line:

```html
<div class="site-title">Trunk Blog</div>
```

(from `<h1>Trunk Blog</h1>`). The article `<h1>` inside `<main class="blog-post">` stays exactly as it is.

Leave `blog/index.html` alone — "Trunk Blog" is legitimately that page's `<h1>`.

- [ ] **Step 2: Add the masthead and date CSS**

Append to `blog/styles/styles.css`:

```css
/* The post pages demote the masthead to a div so the article title is the sole
   h1. This mirrors .site-header h1 so nothing moves visually. */
.site-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -.02em;
  color: var(--ink);
}

.post-date {
  margin: 0 0 1.5rem;
  color: var(--ink-2);
  font-size: 0.95rem;
}
```

- [ ] **Step 3: Add a visible date to each post**

In each post, immediately after the article `<h1>`, insert the date line. An article with a concealed publication date reads as stale to humans too, not just to crawlers. All three use the same value:

```html
<p class="post-date"><time datetime="2025-07-29">July 29, 2025</time></p>
```

- [ ] **Step 4: Replace the head of post 001**

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>10 Packing Hacks Every Frequent Traveler Swears By</title>
  <meta name="description" content="Ten proven packing hacks — rolling, cubes, outfit planning, and more — to help you travel lighter and pack faster for any trip.">
  <link rel="canonical" href="https://trunkmobile.app/blog/posts/001-packing-hacks.html" />
  <meta name="theme-color" content="#062336" />

  <meta property="og:title" content="10 Packing Hacks Every Frequent Traveler Swears By" />
  <meta property="og:description" content="Ten proven packing hacks to help you travel lighter and pack faster for any trip." />
  <meta property="og:image" content="https://trunkmobile.app/assets/images/notepad.jpg" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://trunkmobile.app/blog/posts/001-packing-hacks.html" />
  <meta property="og:site_name" content="Trunk" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="10 Packing Hacks Every Frequent Traveler Swears By">
  <meta name="twitter:description" content="Ten proven packing hacks to help you travel lighter and pack faster for any trip.">
  <meta name="twitter:image" content="https://trunkmobile.app/assets/images/notepad.jpg">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles/styles.css">
  <link rel="icon" href="../../assets/images/favicon.ico" type="image/x-icon" />
  <link rel="apple-touch-icon" href="../../assets/images/app_icon_carryon.png" />
  <script src="/assets/js/analytics.js" defer></script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "10 Packing Hacks Every Frequent Traveler Swears By",
    "description": "Ten proven packing hacks — rolling, cubes, outfit planning, and more — to help you travel lighter and pack faster for any trip.",
    "image": "https://trunkmobile.app/assets/images/notepad.jpg",
    "datePublished": "2025-07-29",
    "dateModified": "2026-07-26",
    "author": { "@type": "Organization", "name": "Trunk" },
    "publisher": { "@type": "Organization", "name": "Aquarius TX Labs", "url": "https://trunkmobile.app/" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://trunkmobile.app/blog/posts/001-packing-hacks.html" }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://trunkmobile.app/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://trunkmobile.app/blog/" },
      { "@type": "ListItem", "position": 3, "name": "10 Packing Hacks Every Frequent Traveler Swears By" }
    ]
  }
  </script>
</head>
```

- [ ] **Step 5: Replace the head of post 002**

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>How to Pack 7 Days in a Carry-On</title>
  <meta name="description" content="A minimalist method and a sample packing list for fitting a full week into one carry-on bag, no checked luggage required.">
  <link rel="canonical" href="https://trunkmobile.app/blog/posts/002-carryon-guide.html" />
  <meta name="theme-color" content="#062336" />

  <meta property="og:title" content="How to Pack 7 Days in a Carry-On" />
  <meta property="og:description" content="A minimalist method and a sample packing list for fitting a full week into one carry-on bag." />
  <meta property="og:image" content="https://trunkmobile.app/assets/images/packed_suitcase.jpg" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://trunkmobile.app/blog/posts/002-carryon-guide.html" />
  <meta property="og:site_name" content="Trunk" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="How to Pack 7 Days in a Carry-On">
  <meta name="twitter:description" content="A minimalist method and a sample packing list for fitting a full week into one carry-on bag.">
  <meta name="twitter:image" content="https://trunkmobile.app/assets/images/packed_suitcase.jpg">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles/styles.css">
  <link rel="icon" href="../../assets/images/favicon.ico" type="image/x-icon" />
  <link rel="apple-touch-icon" href="../../assets/images/app_icon_carryon.png" />
  <script src="/assets/js/analytics.js" defer></script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "How to Pack 7 Days in a Carry-On",
    "description": "A minimalist method and a sample packing list for fitting a full week into one carry-on bag, no checked luggage required.",
    "image": "https://trunkmobile.app/assets/images/packed_suitcase.jpg",
    "datePublished": "2025-07-29",
    "dateModified": "2026-07-26",
    "author": { "@type": "Organization", "name": "Trunk" },
    "publisher": { "@type": "Organization", "name": "Aquarius TX Labs", "url": "https://trunkmobile.app/" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://trunkmobile.app/blog/posts/002-carryon-guide.html" }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://trunkmobile.app/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://trunkmobile.app/blog/" },
      { "@type": "ListItem", "position": 3, "name": "How to Pack 7 Days in a Carry-On" }
    ]
  }
  </script>
</head>
```

Note: post 002's `<h1>` currently reads "How to Pack for a 7-Day Trip with Just a Carry-On" while the new `<title>` is shorter. That is fine and intentional — the `<title>` fits the SERP, the `<h1>` reads naturally on the page. Only `og:title`/`twitter:title` must match the `<title>`, and they do.

- [ ] **Step 6: Replace the head of post 003**

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>How Trunk Helps You Pack Smarter, Not Harder</title>
  <meta name="description" content="How the Trunk app solves real packing problems: reusable lists, bag-level tracking, and confidence that nothing was forgotten.">
  <link rel="canonical" href="https://trunkmobile.app/blog/posts/003-smarter-with-trunk.html" />
  <meta name="theme-color" content="#062336" />

  <meta property="og:title" content="How Trunk Helps You Pack Smarter, Not Harder" />
  <meta property="og:description" content="How the Trunk app solves real packing problems: reusable lists, bag-level tracking, and nothing forgotten." />
  <meta property="og:image" content="https://trunkmobile.app/assets/images/app_icon_carryon.png" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://trunkmobile.app/blog/posts/003-smarter-with-trunk.html" />
  <meta property="og:site_name" content="Trunk" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="How Trunk Helps You Pack Smarter, Not Harder">
  <meta name="twitter:description" content="How the Trunk app solves real packing problems: reusable lists, bag-level tracking, and nothing forgotten.">
  <meta name="twitter:image" content="https://trunkmobile.app/assets/images/app_icon_carryon.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles/styles.css">
  <link rel="icon" href="../../assets/images/favicon.ico" type="image/x-icon" />
  <link rel="apple-touch-icon" href="../../assets/images/app_icon_carryon.png" />
  <script src="/assets/js/analytics.js" defer></script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "How Trunk Helps You Pack Smarter, Not Harder",
    "description": "How the Trunk app solves real packing problems: reusable lists, bag-level tracking, and confidence that nothing was forgotten.",
    "image": "https://trunkmobile.app/assets/images/app_icon_carryon.png",
    "datePublished": "2025-07-29",
    "dateModified": "2026-07-26",
    "author": { "@type": "Organization", "name": "Trunk" },
    "publisher": { "@type": "Organization", "name": "Aquarius TX Labs", "url": "https://trunkmobile.app/" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://trunkmobile.app/blog/posts/003-smarter-with-trunk.html" }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://trunkmobile.app/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://trunkmobile.app/blog/" },
      { "@type": "ListItem", "position": 3, "name": "How Trunk Helps You Pack Smarter, Not Harder" }
    ]
  }
  </script>
</head>
```

- [ ] **Step 7: Run the validation script**

Run: `node scripts/check-seo.mjs blog/posts/*.html`

Expected: all three `ok`, exit code 0. The `expected exactly 1 <h1>, found 2` failures from Task 1 are resolved.

- [ ] **Step 8: Verify rendering**

Run: `python3 -m http.server 8000` and open each of the three posts.

Confirm: the "Trunk Blog" masthead looks identical to before (the `.site-title` rule mirrors `.site-header h1`), the date line appears under each article title, and the "← Back to Blog List" link still works. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add blog/posts/ blog/styles/styles.css
git commit -m "Add metadata, schema, and dates to blog posts

The posts had no description, no Open Graph, no Twitter tags, and no
publication date in markup or on screen. Adds all of them plus
BlogPosting and BreadcrumbList schema, with dates taken from git
history.

Also demotes the 'Trunk Blog' masthead from h1 to a styled div. Every
post previously had two h1 elements, the first of which described the
site rather than the article."
```

---

## Task 7: Sitemap and 404 page

**Files:**
- Modify: `sitemap.xml`
- Create: `404.html`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Rewrite `sitemap.xml`**

Three corrections. The namespace is currently `https://www.sitemaps.org/...`; the registered identifier is the `http://` form, and namespace URIs are compared as literal strings, so the current value is not the sitemap namespace at all. `lastmod` is added. `changefreq` and `priority` are deliberately omitted — Google has confirmed it ignores both.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Main pages -->
  <url>
    <loc>https://trunkmobile.app/</loc>
    <lastmod>2026-07-30</lastmod>
  </url>
  <url>
    <loc>https://trunkmobile.app/privacy.html</loc>
    <lastmod>2026-07-30</lastmod>
  </url>

  <!-- Blog index -->
  <url>
    <loc>https://trunkmobile.app/blog/</loc>
    <lastmod>2026-07-30</lastmod>
  </url>

  <!-- Blog posts -->
  <url>
    <loc>https://trunkmobile.app/blog/posts/001-packing-hacks.html</loc>
    <lastmod>2026-07-30</lastmod>
  </url>
  <url>
    <loc>https://trunkmobile.app/blog/posts/002-carryon-guide.html</loc>
    <lastmod>2026-07-30</lastmod>
  </url>
  <url>
    <loc>https://trunkmobile.app/blog/posts/003-smarter-with-trunk.html</loc>
    <lastmod>2026-07-30</lastmod>
  </url>

</urlset>
```

`404.html` is deliberately absent — a noindex page does not belong in a sitemap.

- [ ] **Step 2: Create `404.html`**

GitHub Pages serves this automatically for unknown paths. It carries `noindex` so the error page never competes in search results.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">

  <title>Page Not Found — Trunk</title>
  <meta name="description" content="That page could not be found. Head back to the Trunk homepage or browse the blog.">
  <meta name="theme-color" content="#062336" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="icon" href="/assets/images/favicon.ico" type="image/x-icon" />
  <script src="/assets/js/analytics.js" defer></script>
</head>
<body>
  <main class="privacy-policy-content">
    <h1>Page not found</h1>
    <p>That page does not exist, or it has moved.</p>
    <ul>
      <li><a href="/">Trunk homepage</a></li>
      <li><a href="/blog/">Trunk blog</a></li>
      <li><a href="/privacy.html">Privacy policy</a></li>
    </ul>
  </main>
  <footer>
    <p>&copy; 2025 Trunk. All rights reserved.</p>
    <p>Need help? Contact us at <a href="mailto:aquariustxlabs+support@gmail.com">aquariustxlabs+support@gmail.com</a></p>
  </footer>
</body>
</html>
```

The page reuses `.privacy-policy-content` for its centered layout rather than introducing a new class for one page.

- [ ] **Step 3: Validate the sitemap XML**

```bash
xmllint --noout sitemap.xml && echo "sitemap.xml is well-formed"
grep -c '<loc>' sitemap.xml
```

Expected: `sitemap.xml is well-formed`, and a count of `6`.

`xmllint` ships with macOS. It is used here rather than Python's `xml.dom.minidom`,
whose stdlib parsers expand external entities by default; `xmllint --noout` does
not expand them unless `--noent` is passed.

- [ ] **Step 4: Run the validation script over the whole site**

Run: `node scripts/check-seo.mjs`

Expected: all 7 pages `ok`, exit code 0. `404.html` passes because the `NOINDEX` set exempts it from the canonical and Open Graph rules while still requiring a title, description, viewport, and single `<h1>`.

- [ ] **Step 5: Commit**

```bash
git add sitemap.xml 404.html
git commit -m "Fix sitemap namespace and add a 404 page

The urlset namespace was https://www.sitemaps.org/..., but the
registered identifier is the http:// form and namespace URIs are
compared as literal strings. Adds lastmod; omits changefreq and
priority, which Google ignores.

Adds a noindex 404 page, which GitHub Pages serves automatically."
```

---

## Task 8: Full-site verification

**Files:** none modified — this task produces a report.

**Interfaces:**
- Consumes: everything above.
- Produces: `docs/superpowers/plans/2026-07-30-seo-verification.md`.

- [ ] **Step 1: Run the full validation suite**

```bash
node scripts/check-seo.mjs
xmllint --noout sitemap.xml && echo "sitemap ok"
```

Expected: all 7 pages `ok`, exit code 0, and `sitemap ok`.

- [ ] **Step 2: Check every internal link resolves**

The relative-path mix across `/`, `/blog/`, and `/blog/posts/` is the easiest thing to break here.

```bash
python3 - <<'PY'
import re, os
from pathlib import Path
bad = []
for page in Path('.').rglob('*.html'):
    if any(p in page.parts for p in ('.git', 'docs', 'node_modules')): continue
    html = page.read_text(encoding='utf-8')
    for href in re.findall(r'(?:href|src)="([^"]+)"', html):
        if href.startswith(('http', 'mailto:', '#', 'data:')): continue
        target = Path(href.lstrip('/')) if href.startswith('/') else (page.parent / href)
        target = Path(str(target).split('#')[0].split('?')[0])
        if str(target).endswith('/'): target = target / 'index.html'
        if not os.path.exists(target):
            bad.append(f'{page} -> {href}')
print('\n'.join(bad) if bad else 'all internal links resolve')
PY
```

Expected: `all internal links resolve`. Any output listing a page and href is a broken link that must be fixed before continuing.

- [ ] **Step 3: Validate every JSON-LD block against Schema.org**

Extract each block and paste it into <https://validator.schema.org/>. There are 11 in total: 3 on `index.html` (MobileApplication, WebSite, FAQPage), 1 on `privacy.html`, 1 on `blog/index.html`, and 2 on each of the 3 posts.

```bash
python3 - <<'PY'
import re, json
from pathlib import Path
for page in sorted(Path('.').rglob('*.html')):
    if any(p in page.parts for p in ('.git', 'docs', 'node_modules')): continue
    blocks = re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>',
                        page.read_text(encoding='utf-8'), re.S)
    for b in blocks:
        print(f'{page}: {json.loads(b)["@type"]}')
PY
```

Expected: exactly 11 lines, with the types above. Malformed schema is worse than none, so every block must come back clean from the validator — warnings about recommended-but-absent properties are acceptable; errors are not.

- [ ] **Step 4: Confirm the page-weight improvement**

```bash
du -sh assets/images
```

Expected: around 2.5 MB, down from 5.6 MB before Task 2.

(An earlier revision of this plan said 9.6 MB. That was wrong — it came from
misreading `ls -l`'s `total 9632`, which counts 512-byte blocks, not kilobytes.
Task 8 caught it against git history. The four individual file sizes in Task 2's
table were measured directly and are correct; only this directory total was off.)

- [ ] **Step 5: Write the verification report and commit**

Create `docs/superpowers/plans/2026-07-30-seo-verification.md` recording: the `check-seo.mjs` output, the link-check result, the JSON-LD type inventory, the image directory size before and after, and a checklist of the post-deploy steps below that still need a human.

```bash
git add docs/superpowers/plans/2026-07-30-seo-verification.md
git commit -m "Add SEO verification report"
```

---

## Post-deploy: human verification

These need the live site and the owner's Google account. They happen **after** the branch merges and GitHub Pages redeploys — not before.

- [ ] Search Console → URL Inspection on `https://trunkmobile.app/` → **Request indexing**.
- [ ] Search Console → Sitemaps → resubmit `https://trunkmobile.app/sitemap.xml`. Confirm it reports 6 discovered URLs and no parse error.
- [ ] Rich Results Test (<https://search.google.com/test/rich-results>) on the homepage and one blog post. Confirm the app, FAQ, and article entities are detected.
- [ ] PageSpeed Insights, **Mobile** tab, on `/` and `/blog/`. Compare against the Pre-flight baselines — the blog index is where the image work should show the largest gain.
- [ ] Facebook Sharing Debugger (<https://developers.facebook.com/tools/debug/>) on the homepage. Click **Scrape Again** to clear the cached blank card from the old relative `og:image`.
- [ ] LinkedIn Post Inspector (<https://www.linkedin.com/post-inspector/>) on the homepage. X retired its Card Validator but reads the same tags, so these two cover it.
- [ ] Four weeks after deploy, compare Search Console impressions and average position against the baseline. Ranking movement on the head term realistically takes 2–3 months; long-tail queries move first.

---

## Deferred, deliberately

- **Blog post URL restructuring.** `/blog/posts/001-packing-hacks.html` buries the keyword behind a numeric prefix. Renaming needs redirects, and GitHub Pages cannot issue them server-side. Future posts should use keyword-first paths.
- **WebP conversion.** Resizing captures most of the saving. Revisit only if PageSpeed still falls short after Task 2.
- **Swapping in the `assets/images/v2.0/` screenshots.** The live `screenshot_1–5.png` files show the old app UI. A content decision, not an SEO one.
- **`aggregateRating` in the app schema.** Only worth adding against a verifiable, maintained source.
