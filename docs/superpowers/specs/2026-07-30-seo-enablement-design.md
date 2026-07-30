# SEO Enablement — Design

**Date:** 2026-07-30
**Site:** trunkmobile.app (static, GitHub Pages)
**Status:** Approved design, ready for implementation planning

---

## 1 · Goal

Increase App Store installs driven by Google organic search.

The homepage is the conversion target. The blog supports it through internal
linking but is not the primary vehicle.

### Success criteria

| Metric | Source | Meaning |
|---|---|---|
| Impressions and average position for the target query cluster | Search Console | Leading indicator — is the page eligible at all? |
| Organic sessions → `app_store_click` rate | GA4 | The conversion. `analytics.js` already fires this event. |
| Mobile PageSpeed score, homepage and blog index | PageSpeed Insights | Core Web Vitals are a ranking input and currently fail on the blog. |

Baselines for all three are captured **before** any change lands.

### Timeline expectation

Indexing of new content: days. Ranking movement on a competitive head term
from a low-authority domain: 2–3 months, and possibly never for the head term
itself. Long-tail queries are where the first wins should appear. The technical
fixes (viewport, OG images, image weight) return faster and more reliably than
the keyword targeting does.

---

## 2 · Scope

**In scope**

- Standardized, unique `<head>` metadata on all 6 pages
- JSON-LD structured data
- Homepage content expansion, ~120 → ~1,000 words
- `sitemap.xml` correctness, `404.html`, image optimization, Core Web Vitals
- Heading-hierarchy fixes and visible blog post dates
- A metadata validation script

**Out of scope**

- Blog post URL restructuring. Current URLs (`/blog/posts/001-packing-hacks.html`)
  bury the keyword behind a numeric prefix and a `.html` extension. Renaming them
  requires redirects, and GitHub Pages cannot issue server-side redirects — the
  only option is JS or meta-refresh shims, which leak link equity and add
  maintenance. Not worth it for three posts. Any *future* posts should use
  keyword-first paths.
- New blog content.
- Swapping the live screenshots for the newer `assets/images/v2.0/` captures.
  Flagged separately; it is a content decision, not an SEO one.
- Backlink acquisition, directory submissions, paid promotion.

---

## 3 · Approach

**Chosen: hand-edit the static HTML, no build step.**

Metadata and JSON-LD are added directly to each of the 6 pages. The `<head>`
block is duplicated across files by design.

*Rejected — Jekyll layouts.* GitHub Pages builds Jekyll natively, and
`jekyll-seo-tag` plus `jekyll-sitemap` would remove the duplication permanently.
But converting a live, indexed site restructures URLs, and with no server-side
redirects available the recovery path is poor. The duplication cost is six copies
of ~15 lines on a site that gains perhaps two pages a year. The restructuring
risk exceeds the maintenance saving.

*Rejected — client-side meta injection.* Social scrapers do not execute
JavaScript, so Open Graph tags injected at runtime never resolve. JS-set
canonicals are also unreliable for Google. Non-viable, not merely worse.

---

## 4 · Keyword targeting

| Tier | Queries |
|---|---|
| Primary | packing list app |
| Secondary | travel packing app, smart packing assistant, carry-on packing app, trip packing organizer |
| Long-tail | packing app that tracks which bag, reusable packing list app, offline packing list app, family packing list app |
| Branded | Trunk app, Trunk packing app |

### Relationship to the App Store title

The App Store listing is titled **"Trunk: Packing List & Trips"**, optimized for
ASO. The web `<title>` deliberately differs. App Store search is short-query,
exact-match-heavy, within 30 characters; Google web search rewards natural
phrasing within ~60. "Trips" earns its place in the store title but is a
liability on the web, where "trip planner" queries are held by TripIt, Wanderlog,
and Google Travel — chasing it dilutes the one term Trunk can realistically win.

**One field must match the store exactly:** `MobileApplication.name` in JSON-LD
carries `"Trunk: Packing List & Trips"` verbatim. That is the entity name Google
uses to associate the site with the App Store listing. The `<title>` is a SERP
headline and is optimized separately. Different fields, different jobs.

---

## 5 · Per-page metadata

Every page receives: `charset`, `viewport`, unique `title`, unique
`description`, absolute `canonical`, full Open Graph set, Twitter card,
`theme-color`, `apple-touch-icon`.

| Page | Title | Description |
|---|---|---|
| `/` | Trunk — Smart Packing List App for Travel | Plan trips, build reusable packing lists, and track exactly which bag each item is in. Trunk is a free packing list app for travelers. On iPhone. |
| `/privacy.html` | Privacy Policy — Trunk Packing List App | How Trunk handles your data. Your trips, lists, and photos stay on your device — no accounts, no profiles, and analytics you can turn off. |
| `/blog/` | Packing Tips & Travel Advice — Trunk Blog | Packing hacks, carry-on guides, and smarter travel planning from Trunk, the packing list app that tracks what's in every bag. |
| `/blog/posts/001-…` | 10 Packing Hacks Every Frequent Traveler Swears By | Ten proven packing hacks — rolling, cubes, outfit planning, and more — to help you travel lighter and pack faster for any trip. |
| `/blog/posts/002-…` | How to Pack 7 Days in a Carry-On | A minimalist method and a sample packing list for fitting a full week into one carry-on bag, no checked luggage required. |
| `/blog/posts/003-…` | How Trunk Helps You Pack Smarter, Not Harder | How the Trunk app solves real packing problems: reusable lists, bag-level tracking, and confidence that nothing was forgotten. |

All titles are under 60 characters and all descriptions under 160, so neither
truncates in the SERP.

### Defects this corrects

1. **`viewport` is missing** on `blog/index.html` and `privacy.html`.
   Mobile-friendliness is a direct ranking signal; this is the highest-value
   single line in the project.
2. **`og:image` uses relative paths** on every page that has one. Relative OG
   URLs fail silently on Facebook, LinkedIn, and Slack — the share cards render
   blank today. All become absolute.
3. **The homepage Twitter card describes the blog.** `twitter:title` reads
   "Trunk Blog – Smart Packing Tips & Travel Advice" on `index.html`. Copy/paste
   error, corrected.
4. **Blog posts have no `description`, no Open Graph, and no Twitter tags at all.**
5. **`preconnect` targets the wrong host.** Only `fonts.googleapis.com` is
   preconnected; the font *files* are served from `fonts.gstatic.com`. Adding
   the latter with `crossorigin` is where the actual latency saving is.

---

## 6 · Homepage content plan

| # | Section | Status | Purpose |
|---|---|---|---|
| 1 | Hero | Revised | Tagline gains a descriptive line carrying the head term |
| 2 | How Trunk works | **New**, ~140w | Three numbered steps — a clear task narrative |
| 3 | Features | Rewritten | Same 4 cards; descriptions carry secondary keywords |
| 4 | Built for every kind of trip | **New**, ~200w | Carry-on weekend, family, business, long-haul — long-tail coverage |
| 5 | Why travelers choose Trunk | **New**, ~130w | Offline, no account, on-device, reusable inventory |
| 6 | Screenshot row | Kept | Improved alt text only |
| 7 | Pro banner | Kept | Unchanged |
| 8 | FAQ | **New**, ~350w | Seven Q&As |
| 9 | From the blog | **New** | Direct links to all 3 posts |
| 10 | Footer | Revised | Real nav links |

Section 5 carries the most weight. "Everything stays on your device, no account
required" is a true, verifiable differentiator against PackPoint and Packr, and
is already documented in the privacy policy.

### Heading structure

The homepage `<h1>` is currently `Trunk` — a word nobody searches for, occupying
the most heavily weighted on-page element.

**Resolution:** the `<h1>` keeps the visual wordmark and gains a *visible*
descriptive line beneath it, both inside the heading:

```html
<h1><span class="wordmark">Trunk</span><span class="h1-sub">Packing List App for Travel</span></h1>
```

Visually-hidden keyword text was considered and rejected — it works today but is
precisely the pattern Google discounts over time. Honest markup that says what
the page is serves both readers and crawlers.

### FAQ questions

1. Is Trunk free?
2. Does Trunk work offline?
3. Do I need an account to use Trunk?
4. Can I reuse a packing list for another trip?
5. Can Trunk tell me which bag an item is in?
6. Is Trunk available on Android?
7. Where is my data stored?

Answers derive from the privacy policy and existing feature copy. Q2 must be
accurate rather than flattering: packing lists work offline, but destination
search and weather forecasts require a network connection.

Q6 is answered as "iOS today, Android in development" — it does not promise a
date. The question is included specifically because "is there an Android version"
is a real query, and answering it honestly captures that search intent without
committing to a ship date the page would then have to defend.

### Platform language

Android ships soon. Copy and schema are written platform-neutrally so the Play
Store launch requires additions, not rewrites. Only the iOS link appears today.
Two places name iOS explicitly and will need a one-line edit at Android launch:
the homepage meta description ("On iPhone") and `operatingSystem` in the app
schema. Both are noted here so they are not missed.

---

## 7 · Structured data

| Page | Schema |
|---|---|
| `index.html` | `MobileApplication` + `WebSite` + `Organization` |
| Homepage FAQ | `FAQPage` |
| Blog posts | `BlogPosting` + `BreadcrumbList` |
| `blog/index.html` | `Blog` |
| `privacy.html` | `WebPage` |

`MobileApplication` is used rather than `SoftwareApplication` — it is the more
specific subtype and describes the entity more precisely.

```json
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "Trunk: Packing List & Trips",
  "alternateName": "Trunk",
  "operatingSystem": "iOS",
  "applicationCategory": "TravelApplication",
  "url": "https://trunkmobile.app/",
  "downloadUrl": "https://apps.apple.com/app/trunk-smart-packing-assistant/id6747906870",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "screenshot": ["https://trunkmobile.app/assets/images/screenshot_1.png"],
  "publisher": { "@type": "Organization", "name": "Aquarius TX Labs" }
}
```

### Two deliberate constraints

**No `aggregateRating`.** Hand-written ratings that do not match a verifiable
source risk a manual action, and the value would require perpetual manual
updating. Omitted entirely.

**`FAQPage` will not produce rich snippets.** Google restricted FAQ rich results
to government and health sites in August 2023. It is included anyway because
Google's AI Overviews, ChatGPT, and Perplexity parse it, but it should not be
expected to expand the SERP entry.

### Blog post dates

`BlogPosting` requires `datePublished`, and the posts carry no date in markup or
on screen. Values are taken from git history:

| Post | `datePublished` | `dateModified` |
|---|---|---|
| All three | `2025-07-29` | `2026-07-26` |

All three were committed together, so they share a publication date. That is the
truth and is recorded as such. A visible date line is added to each post as well
— an article with a concealed publication date reads as stale to humans too.

### Heading hierarchy on posts

Each blog post currently has **two `<h1>`s**: the "Trunk Blog" masthead and the
post title. The masthead becomes a styled `<div>`, leaving the post title as the
sole `<h1>`. Visually identical; `blog/index.html` correctly keeps "Trunk Blog"
as its own `<h1>`.

---

## 8 · Crawl infrastructure

**`sitemap.xml`** — three corrections:

- Namespace is `https://www.sitemaps.org/schemas/sitemap/0.9`; the registered
  identifier is the `http://` form. Namespace URIs are compared as literal
  strings, so strict parsers reject the current value.
- Add `<lastmod>` per URL.
- Deliberately omit `<changefreq>` and `<priority>` — Google has confirmed it
  ignores both.

**`robots.txt`** — correct as written. No change.

**`404.html`** — added at the repo root; GitHub Pages serves it automatically for
unknown paths. Carries `<meta name="robots" content="noindex">` and links to the
homepage and blog. Excluded from the sitemap.

---

## 9 · Images and Core Web Vitals

The blog thumbnails are full-resolution stock photography rendered at card size.
The blog index currently ships roughly 2.5 MB of images to display three cards.

| File | Current | Target |
|---|---|---|
| `packed_suitcase.jpg` | 5184×3888, 1.2 MB | ~800px wide, ~60 KB |
| `notepad.jpg` | 4331×6496, 990 KB | ~800px wide, ~60 KB |
| `lightbulb.jpg` | 3840×3840, 377 KB | ~800px wide, ~50 KB |
| `twitter_banner.png` | 1536×1024, 1.0 MB | 1200×630, ~120 KB |

The banner is also reshaped: 1536×1024 is 3:2, and social platforms crop against
a 1.91:1 target, so the current image is cropped badly wherever it appears.

Additionally:

- Explicit `width`/`height` on every `<img>` — eliminates layout shift (CLS)
- `loading="lazy"` and `decoding="async"` below the fold
- `fetchpriority="high"` on the hero LCP image, which stays eager
- Descriptive alt text replacing placeholders. `alt="App Screenshot Trips"`
  becomes `alt="Trunk trip list showing three upcoming trips with packing progress"`.

Filenames are preserved throughout, so no markup path changes are required.

WebP conversion is intentionally not included. Resizing and recompressing
captures the large majority of the saving; adding `<picture>` fallbacks to
hand-maintained HTML is complexity that should only be paid for if PageSpeed
still falls short afterward.

---

## 10 · Validation

**`scripts/check-seo.mjs`** — a small Node script that walks every `.html` file
and asserts the presence of `title`, `meta[name=description]`,
`link[rel=canonical]`, `meta[name=viewport]`, and an **absolute** `og:image`. It
additionally requires `og:title` and `twitter:title` to equal the page `<title>`
**exactly**, unless the file carries an explicit
`<!-- seo-check: allow-title-mismatch -->` opt-out.

Exact match rather than a fuzzy similarity test, deliberately. The live bug pairs
a page titled "Trunk – Smart Packing Assistant" with a Twitter title of "Trunk
Blog – Smart Packing Tips & Travel Advice" — those share both "smart" and
"packing", so any shared-word or overlap heuristic passes them and catches
nothing. Exact match catches it, is trivial to reason about, and the opt-out
comment keeps a deliberate divergence from being a fight with the tooling.

Run manually; suitable for a pre-commit hook later. No dependencies beyond Node's
standard library and regex matching — this validates presence, not correctness,
and does not warrant a DOM parser.

**Pre-deploy:** HTML validity on all 6 pages; every JSON-LD block through the
Schema Markup Validator (malformed schema is worse than none); internal link
check across the `blog/` and `blog/posts/` relative-path mix.

**Post-deploy:** Search Console URL Inspection on the homepage plus an indexing
request; sitemap resubmission; PageSpeed Insights on the **mobile** profile for
the homepage and blog index; Facebook Sharing Debugger and LinkedIn Post
Inspector for the OG cards. X retired its Card Validator but reads the same tags,
so those two tools give sufficient coverage.

---

## 11 · Assumptions to confirm before implementation

These are stated rather than deferred; each has a clear default and a defined
consequence if wrong.

1. **The base app is free.** Implied by the "Coming Soon: Trunk Pro" upsell.
   Drives `offers.price: "0"`, the word "free" in the meta description, and FAQ
   Q1. If there is a purchase price, all three change.
2. **The publisher entity is "Aquarius TX Labs."** Inferred from the
   `aquariustxlabs+support@gmail.com` support address. Used in
   `Organization.name` and `publisher`.
3. **Offline behavior.** Packing lists are assumed to work offline while
   destination search and weather require a network, per the privacy policy's
   description of WeatherAPI and WeatherKit. FAQ Q2 depends on this being right.

---

## 12 · Deliverables

1. `index.html` — new head, JSON-LD, ~880 words of new copy, `<h1>` restructure,
   image attributes
2. `privacy.html` — new head incl. missing viewport, `WebPage` schema
3. `blog/index.html` — new head incl. missing viewport, `Blog` schema, image
   attributes
4. `blog/posts/*.html` (×3) — new head, `BlogPosting` + `BreadcrumbList`, visible
   dates, `<h1>` fix
5. `sitemap.xml` — namespace fix, `lastmod`
6. `404.html` — new
7. `assets/images/` — 4 images resized and recompressed, filenames unchanged
8. `styles/styles.css` and `blog/styles/styles.css` — styles for the new homepage
   sections, `<h1>` subtitle, and the demoted blog masthead
9. `scripts/check-seo.mjs` — new
