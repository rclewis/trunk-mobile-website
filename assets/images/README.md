# assets/images

**This folder is the single home for every image the site serves.** Flat, no
subfolders. If a file is here, some page references it; if nothing references it,
it should be deleted rather than left to accumulate.

## Design bundles are delivery, not storage

When Design hands over a bundle (`v2.0 assets`, `v2.2 assets`, …), treat it as a
transfer mechanism with a short life:

1. Drop it anywhere convenient — it does not matter, it is temporary.
2. Encode the delivered files into this folder, under the names the site already
   uses (see the recipe below).
3. Update the `width`/`height` attributes in the markup to the real dimensions of
   what you produced.
4. Verify, commit, then **delete the bundle folder**.

Do not commit bundles as long-lived "masters" here. Design holds the masters; git
history holds every version this site has ever shipped. Two copies is enough.

## Screenshot recipe

The five app screenshots fill two slots, which render at different sizes:

| Files | Slot | CSS width | Ship at |
|---|---|---|---|
| `screenshot_1–3` | hero trio | 180px desktop, 200px mobile | ~600px wide |
| `screenshot_4–5` | mid-page row | 248px desktop, 220px mobile | ~744px wide |

Target roughly **3× the largest CSS width** the slot renders at, to cover 3× DPI
screens. If the delivered source is already near that width, ship it at native
size instead of resampling — re-downscaling an already-downscaled capture costs
quality for a trivial byte saving.

Encode **WebP q85**. PNG is a poor fit: these are gradient-heavy UI captures, and
PNG lands at roughly 5× the size for no visible gain. Measured on the v2.0 set:
946 KB as resized PNG versus 148 KB as WebP.

```python
from PIL import Image
im = Image.open('delivered.png')
im.save('assets/images/screenshot_1.webp', 'WEBP', quality=85, method=6)
# then set width/height in index.html to im.width / im.height
```

## Two things that will bite you

**The markup carries explicit `width`/`height`.** They exist to reserve layout
space and keep CLS at zero. They are not decorative — if you swap an image for one
with a different aspect ratio and leave them stale, the browser will stretch it.
Always update them to the real file dimensions.

**CSS must pair a width with a height.** `width` and `height` attributes are
presentational hints, and CSS only displaces the properties it actually sets. A
rule that sets `width` alone leaves the `height` attribute in force, which once
rendered a 248px-wide screenshot at 2796px tall. Every image rule in
`styles/styles.css` pairs its width with `height: auto` or an explicit height.

## Verifying

`node scripts/check-seo.mjs` asserts every `<img>` has `alt`, `width` and
`height`. It does **not** check that the dimensions are accurate or that files are
optimally sized — run PageSpeed on the homepage after any asset change.
