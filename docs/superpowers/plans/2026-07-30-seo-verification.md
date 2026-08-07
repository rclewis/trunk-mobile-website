# SEO Enablement — Full-Site Verification Report

**Date:** 2026-07-30
**Branch:** `seo-enablement`
**Scope:** Task 8 of the SEO enablement project. No site files were modified by this task — it is read-only verification across the work completed in Tasks 1–7.

---

## Step 1: Full validation suite

### `node scripts/check-seo.mjs`

```
  ok    404.html
  ok    blog/index.html
  ok    blog/posts/001-packing-hacks.html
  ok    blog/posts/002-carryon-guide.html
  ok    blog/posts/003-smarter-with-trunk.html
  ok    index.html
  ok    privacy.html

All 7 page(s) passed.
```

Exit code: `0`.

**Result: matches expectation.** All 7 pages `ok`.

### `xmllint --noout sitemap.xml && echo "sitemap ok"`

```
sitemap ok
```

Exit code: `0`.

**Result: matches expectation.** `sitemap.xml` is well-formed.

---

## Step 2: Internal link checker

Ran the brief's Python snippet, which walks every `*.html` file outside `.git`, `docs`, and `node_modules`, and checks every `href=`/`src=` target (excluding absolute URLs, `mailto:`, `#`, and `data:`) resolves to a real file on disk.

Files scanned (confirmed via `find . -name "*.html" -not -path "./.git/*" -not -path "./docs/*" -not -path "./node_modules/*"`):

```
./404.html
./blog/index.html
./blog/posts/001-packing-hacks.html
./blog/posts/002-carryon-guide.html
./blog/posts/003-smarter-with-trunk.html
./index.html
./privacy.html
```

(7 files — the same 7 pages `check-seo.mjs` covers.)

### Output

```
all internal links resolve
```

**Result: matches expectation.** No broken internal links across `/`, `/blog/`, and `/blog/posts/`.

---

## Step 3: JSON-LD inventory (automatable half only)

Ran the brief's extraction script, which regex-extracts every `<script type="application/ld+json">` block from each page, parses it as JSON, and prints `page: @type`.

### Output (verbatim, 11 lines)

```
blog/index.html: Blog
blog/posts/001-packing-hacks.html: BlogPosting
blog/posts/001-packing-hacks.html: BreadcrumbList
blog/posts/002-carryon-guide.html: BlogPosting
blog/posts/002-carryon-guide.html: BreadcrumbList
blog/posts/003-smarter-with-trunk.html: BlogPosting
blog/posts/003-smarter-with-trunk.html: BreadcrumbList
index.html: MobileApplication
index.html: WebSite
index.html: FAQPage
privacy.html: WebPage
```

Total block count: **11**.

### Distribution vs. expectation

| Page | Expected | Actual |
|---|---|---|
| `index.html` | 3 (MobileApplication, WebSite, FAQPage) | 3 (MobileApplication, WebSite, FAQPage) ✓ |
| `privacy.html` | 1 (WebPage) | 1 (WebPage) ✓ |
| `blog/index.html` | 1 (Blog) | 1 (Blog) ✓ |
| `blog/posts/001-packing-hacks.html` | 2 (BlogPosting, BreadcrumbList) | 2 ✓ |
| `blog/posts/002-carryon-guide.html` | 2 (BlogPosting, BreadcrumbList) | 2 ✓ |
| `blog/posts/003-smarter-with-trunk.html` | 2 (BlogPosting, BreadcrumbList) | 2 ✓ |
| `404.html` | 0 (by design) | 0 (no `ld+json` script found) ✓ |
| **Total** | **11** | **11** ✓ |

**Result: matches expectation exactly.** Every block parsed as valid JSON, and every `@type` matched the plan's inventory. This confirms structural validity (well-formed JSON, correct `@type`) — it does **not** confirm Schema.org conformance of every property. See "Post-deploy: human verification" below; the validator.schema.org submission is an interactive web form this task cannot submit to, and it is recorded there as a pending human action, not claimed as done here.

---

## Step 4: Image directory size (page-weight improvement)

### Current state

```
$ du -sh assets/images
2.5M	assets/images
```

Breakdown of the current directory:

```
960K  assets/images/v2.0
288K  assets/images/app_icon_carryon.png
256K  assets/images/screenshot_1.png
236K  assets/images/screenshot_2.png
180K  assets/images/screenshot_5.png
152K  assets/images/screenshot_3.png
136K  assets/images/screenshot_4.png
100K  assets/images/packed_suitcase.jpg
 80K  assets/images/notepad.jpg
 64K  assets/images/twitter_banner.jpg
 60K  assets/images/lightbulb.jpg
 16K  assets/images/favicon.ico
4.0K  assets/images/app_icon.svg
4.0K  assets/images/app_icon_new.svg
```

**Current size matches the brief's expectation of ~2.5 MB.**

### Before-state — discrepancy found

The brief and the master plan (`docs/superpowers/plans/2026-07-30-seo-enablement.md`, Step 4 of Task 8) both state the directory held **~9.6 MB before Task 2**. To verify this independently rather than take it on faith, I reconstructed `assets/images` at every commit in the repository's history using `git archive <commit> -- assets/images | tar -x` into a scratch directory, then ran `du -sh` on each:

```
14adc23 (initial commit): assets/images not present in this commit
5cefe86: 1.5M
d211551: 5.2M
e6612ba: 5.2M
bbb448e: 5.2M
882d933: 5.2M
432c0cf: 5.2M
818c488: 4.2M
a54539b: 5.6M
5219e00: 5.6M
c861a62 (main tip pre-branch): 5.6M
d05185a (SEO plan added): 5.6M
2df489c (SEO metadata script added, immediately before Task 2): 5.6M
4b751f5 (Task 2's resize commit — "after"): 2.5M
```

**Finding:** the largest `assets/images` ever measures in the full git history is **5.6 MB**, at the commit immediately preceding Task 2's resize commit (`2df489c`). The size never reaches 9.6 MB at any point in history. The plan/brief's "~9.6 MB before Task 2" figure is **not corroborated** by the repository's history — the actual, reconstructable before/after for Task 2 is **5.6 MB → 2.5 MB** (a 55% reduction), not 9.6 MB → 2.5 MB (a 74% reduction).

This does not change the bottom-line conclusion — the directory is substantially smaller than any historical state, and Task 2's own report (`​.superpowers/sdd/2026-07-30-seo-enablement/task-2-report.md`) independently documents a ~3.46 MB → ~298 KB reduction across the four files it touched, which is consistent with the 5.6 MB → 2.5 MB whole-directory figures above. But the specific "~9.6 MB" baseline number cited in the brief and the master plan does not match any measurable point in git history, so I am flagging it here as a discrepancy rather than repeating it as fact. No site file was changed to investigate this; the scratch checkouts were done in `/tmp` and discarded.

**Result: current size matches expectation (~2.5 MB). The historical baseline number in the brief (~9.6 MB) does not match what git history shows (max 5.6 MB) — flagged as a discrepancy, not corrected in any project file.**

---

## Summary table

| Check | Expected | Actual | Status |
|---|---|---|---|
| `check-seo.mjs` | 7/7 `ok`, exit 0 | 7/7 `ok`, exit 0 | Match |
| `xmllint --noout sitemap.xml` | well-formed | well-formed | Match |
| Internal link checker | `all internal links resolve` | `all internal links resolve` | Match |
| JSON-LD block count | 11 | 11 | Match |
| JSON-LD distribution | 3/1/1/2/2/2/0 | 3/1/1/2/2/2/0 | Match |
| `du -sh assets/images` (current) | ~2.5 MB | 2.5 MB | Match |
| `du -sh assets/images` (historical baseline, "before Task 2") | ~9.6 MB (per brief) | 5.6 MB (per git history reconstruction) | **Discrepancy — brief's number not corroborated** |

---

## Post-deploy: human verification

These require the live site and the owner's Google/Facebook/LinkedIn accounts. They happen **after** this branch merges and GitHub Pages redeploys — none of them have been performed as part of this task, and none can be automated from this environment.

- [ ] Search Console → URL Inspection on `https://trunkmobile.app/` → **Request indexing**.
- [ ] Search Console → Sitemaps → resubmit `https://trunkmobile.app/sitemap.xml`. Confirm it reports 6 discovered URLs and no parse error.
- [ ] Rich Results Test (<https://search.google.com/test/rich-results>) on the homepage and one blog post. Confirm the app, FAQ, and article entities are detected.
- [ ] PageSpeed Insights, **Mobile** tab, on `/` and `/blog/`. Compare against the Pre-flight baselines — the blog index is where the image work should show the largest gain.
- [ ] Facebook Sharing Debugger (<https://developers.facebook.com/tools/debug/>) on the homepage. Click **Scrape Again** to clear the cached blank card from the old relative `og:image`.
- [ ] LinkedIn Post Inspector (<https://www.linkedin.com/post-inspector/>) on the homepage. X retired its Card Validator but reads the same tags, so these two cover it.
- [ ] Four weeks after deploy, compare Search Console impressions and average position against the baseline. Ranking movement on the head term realistically takes 2–3 months; long-tail queries move first.
- [ ] Paste each of the 11 JSON-LD blocks inventoried above into <https://validator.schema.org/> and confirm each returns clean (warnings about recommended-but-absent properties are acceptable; errors are not). This task confirmed the 11 blocks are well-formed JSON with the expected `@type` values, but did **not** submit them to the validator — that requires an interactive web form this task cannot fill out.

---

## Deferred, deliberately (carried forward from the brief, unchanged by this task)

- **Blog post URL restructuring.** `/blog/posts/001-packing-hacks.html` buries the keyword behind a numeric prefix. Renaming needs redirects, and GitHub Pages cannot issue them server-side. Future posts should use keyword-first paths.
- **WebP conversion.** Resizing captures most of the saving. Revisit only if PageSpeed still falls short after Task 2.
- **Swapping in the `assets/images/v2.0/` screenshots.** The live `screenshot_1–5.png` files show the old app UI. A content decision, not an SEO one.
- **`aggregateRating` in the app schema.** Only worth adding against a verifiable, maintained source.

---

## Post-launch: homepage performance fix (2026-08-06)

The first live PageSpeed run scored the homepage **55 on mobile**. Diagnosis:

- LCP was `screenshot_1.png`, a 258 KB PNG, painting at 2,276 ms unthrottled
- Five homepage screenshots totalled **960 KB — 98.5% of the page payload**
- They were 1290px intrinsic but displayed at 180–248px CSS, roughly 2.4×
  oversized even allowing for a 3× DPI screen

**Root cause of the miss:** this plan's §9 scoped image optimization to the three
blog thumbnails and the social banner — the largest files *on disk*. The homepage
screenshots were never in scope, despite the homepage being the conversion
target. Task 3 gave them `width`/`height` (correct for CLS) but nothing reduced
their bytes. Sizing images by their on-disk rank rather than by their served
weight on the most important page was the error.

Measured comparison at the correct target widths (600px for the hero trio,
744px for the row pair — 3× the largest CSS width across breakpoints):

| Format | Total | vs. before |
|---|---|---|
| PNG resized | 771 KB | 81.5% — barely helps |
| JPEG q82 | 266 KB | 28.1% |
| **WebP q85** | **148 KB** | **15.7%** |

PNG resizing barely helps because these are gradient-heavy UI captures that PNG
encodes badly. WebP q85 was adopted: site-origin payload went **960 KB → 204 KB
(-78.7%)**. Layout dimensions are unchanged, so there is no visual difference.

This satisfies the WebP deferral recorded below on its own terms — that entry
said to revisit "only if PageSpeed still falls short," and it did. No `<picture>`
fallback was added: WebP has been universal since Safari 14 (2020), and avoiding
that markup complexity was the deferral's stated reason.

The superseded PNGs were deleted. They remain in git history, and
`assets/images/v2.0/` already holds newer captures flagged to replace them.

### Round two: fonts (score 55 → 72 → pending)

The image fix took the score to 72. PageSpeed then reported render-blocking
requests at ~1,700 ms as the dominant remaining cost, plus a font-display
warning and a network dependency tree.

Measured cause:

| Resource | Size |
|---|---|
| Material Symbols Rounded woff2 | **5,348,916 bytes (5.1 MB)** |
| Plus Jakarta Sans, latin subset | 27,272 bytes |

The homepage pulled the entire Material Symbols variable font — every icon in
the library, every variable axis — to draw **four** feature icons. Its stylesheet
URL also omitted `&display=swap`, so those icons blocked on that download.

Both external stylesheets were also cross-origin, creating the serial chain
PageSpeed flagged: `fonts.googleapis.com` for the CSS, then `fonts.gstatic.com`
for the file, each paying its own DNS and TLS before first paint.

Fixes applied:

- **The four icons are now inline SVG** (Material Symbols Rounded, Apache 2.0),
  eliminating the 5.1 MB font and one render-blocking request outright. Google's
  `icon_names=` subsetting was measured as an alternative — it reaches 6,432
  bytes — but it keeps the cross-origin blocking request, and render-blocking was
  the headline cost.
- **Plus Jakarta Sans is self-hosted** at `/assets/fonts/`, latin subset only,
  with `font-display: swap` and a `<link rel="preload">`. Verified in a browser
  that the file is a genuine variable font (weights 200/400/700/800 render at
  four distinct widths), so `font-weight: 200 800` is correct and headings are
  not faux-bolded.
- Both `<link>`s to Google Fonts and both `preconnect`s were removed from all
  seven pages.

The homepage now issues **zero cross-origin requests**.

---

## Follow-ups found by the final whole-branch review

Two findings from that review were fixed before merge: the three blog posts'
social and schema images (which the Task 2 resize had pushed below Google's
1200px Article guidance) now point at the 1200×630 banner, and the site-wide
copyright year was updated to 2026. What remains is deliberately deferred.

### Worth doing next: widen `scripts/check-seo.mjs`

The script is the only automated check, and the sole safety net for the
deliberate choice to duplicate the `<head>` across six pages. It does not yet
catch the two failure modes that duplication most reliably produces. In
priority order:

1. **A stray `noindex` on an indexable page passes silently.** The script gates
   on a filename-based `NOINDEX` set, never on the actual robots meta. A
   misplaced `noindex` is the most damaging SEO defect possible and this is a
   two-line check.
2. **Nothing cross-checks `sitemap.xml` against the real page set.** Add a page
   and forget the sitemap, or delete one and leave a stale `<loc>`, and the
   script reports success either way.
3. **Same-origin URLs are checked for an `https://` prefix but never for
   whether the file exists.** The `twitter_banner.png` → `.jpg` rename was safe
   only because of a hand-reasoned ordering argument; the harness could not have
   enforced it.
4. **Canonical uniqueness** — two pages sharing a canonical silently deindexes
   one, and both would currently report `ok`.
5. **Description uniqueness** — the classic regression from head duplication.

### Minor, unfixed

- Dead CSS: `styles/styles.css:150` and `:166` set `font-size:3.5rem` on
  `.hero-title h1` / `.hero-text h1` and are now inert, shadowed ~380 lines
  later. Renders correctly; editing line 150 would appear to do nothing.
- A second `@media (max-width:767px)` block duplicates the query already present
  earlier in the file.
- `list-style:none` on the steps `<ol>` drops list semantics in Safari/VoiceOver.
  The visible step numbers carry the ordinal, so no information is lost;
  `role="list"` would restore both.
- Internal links use `index.html` forms while canonicals use the directory form
  (`/`, `/blog/`). Google resolves this via the canonicals, but it splits
  internal link signal to the conversion target.
- `styles/styles.css` uses the raw hex `#CFE8F5` twice for hero sub-text,
  against the plan's own design-token constraint. The plan's prescribed CSS
  contained the literal, so this is a plan self-contradiction — either add a
  token or amend the constraint.
- The design spec listed a standalone `Organization` node for the homepage;
  only the nested `publisher` exists. Nothing is broken (`WebSite.name` serves
  the SERP site name), but the drift is undocumented.
- `BlogPosting.author` is an orphan entity with no `url` or `@id`.
- The blog posts carry `BreadcrumbList` markup with no corresponding visible
  breadcrumb trail.
- `assets/images/lightbulb.jpg` is referenced by nothing in the repo.
- The homepage meta description says "On iPhone" while FAQ Q6 says "iPhone and
  iPad today."
- Indentation: new `<head>` blocks use 2-space indent while page bodies use
  4-space.

### One finding investigated and withdrawn

An earlier review flagged `.hero-lede` as losing block-centering between ~590px
and 767px. The final review tested it in a real browser and disproved it. The
specificity analysis was correct — the appended rule does win, and computed
margins are `0px` — but the conclusion ignored flexbox: `.hero-text-inner` is
`display:flex; flex-direction:column` with `align-items:center` inside the
mobile query, so the element is cross-axis centered regardless, and the auto
margins are merely redundant. Measured centers at 375/700/760px are identical to
the pixel. No fix was needed. Recorded here so the same analysis is not redone.
