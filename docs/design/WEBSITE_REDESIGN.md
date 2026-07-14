# Website Redesign — section-by-section CSS deltas

Re-skin `trunk-mobile-website` to the app's **"Checklist"** design system. This is the exact,
per-selector spec that pairs with `CLAUDE_CODE_PROMPT.md`. **CSS + fonts only — no HTML restructuring**
except (a) adding font `<link>`s, (b) renaming the icon class, (c) re-pointing image `src`s once new
screenshots exist. Keep all existing selectors, hrefs, form actions, and meta tags.

---

## 0 · Tokens

Add to the **top of `styles/styles.css`** and (repeated) the **top of `blog/styles/styles.css`** —
they are separate stylesheets:

```css
:root{
  --bg:#F5F7FA;   --card:#FFFFFF;  --ink:#16202B;  --ink-2:#6B7785;  --ink-3:#9AA4B0;
  --border:#E8ECF1;  --divider:#F0F2F5;
  --sky:#06A6F0;  --on-sky:#0A2A3D;  --sky-tint:#E7F6FE;  --sky-text:#0883C2;
  --coral:#FF6B4A;  --coral-tint:#FFEDE7;  --coral-text:#E8512F;
  --r-card:16px;  --r-btn:14px;
  --shadow-card:0 4px 16px rgba(22,32,43,.06);
}
```

### Fonts & icons — every page `<head>` (`index.html`, `privacy.html`, `blog/index.html`, `blog/posts/*.html`)

```html
<!-- add -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<!-- change the icon family: Outlined -> Rounded -->
<!-- Material+Symbols+Outlined ... -> Material+Symbols+Rounded ... -->
<!-- then rename the markup class: material-symbols-outlined -> material-symbols-rounded -->
```

Icon-variation settings stay the same (`FILL 1` for filled). Renaming the class also **fixes a live
bug**: `.feature .material-symbols-rounded` is already the CSS selector, so the feature-icon color
never applied while the markup said `-outlined`.

---

## Hard rules (apply throughout)

0. **Color roles (the system).** **Sky = brand & wayfinding** — the app-icon logo, links, feature
   icons, progress/active states. **Coral = take action** — the primary CTAs (hero Download, Pro
   “Notify Me”) and the Pro badge. Keep them in their lanes: don't make CTAs blue or feature icons
   coral.
1. **Accessible fills.** Never small white text on `--sky` **or** `--coral` (both fail WCAG AA). On a
   sky fill use dark `--on-sky` (#0A2A3D); on a coral fill use dark `--ink` (#16202B). Sky as a
   **text/link** color is the darker `--sky-text` (#0883C2). Replace every `#007acc` (main) and
   `#0077cc` (blog) with `--sky-text`.
2. **No cyan gradient.** Remove the old `linear-gradient(135deg,#4FACFE,#00F2FE)` everywhere. The
   **hero** becomes an immersive dark sky→ink gradient (§1); the **blog masthead** goes to light `--bg`.
3. **Cards:** `--card` bg, `1px solid --border`, `--r-card` (16px), `--shadow-card`. Buttons/inputs
   `--r-btn` (14px).
4. **Coral CTAs + Pro accents.** Both action buttons (`.button`, `.signup-form button`) are coral with
   dark `--ink` text; the Pro badge is coral; Pro feature titles carry a coral accent. Everything else
   — hero logo, Features grid icons, links — stays sky.
5. **Logo stays the real app icon.** Keep `app_icon_new.svg` in its **sky-gradient tile** (its true
   brand form, see §1 Hero) — it pops on the dark hero.
6. **Color &amp; depth (selected: B + C + D).** The hero is immersive dark (B, §1); the feature icons get
   tinted chips (C); the app-screenshot row gets a full-bleed sky-tint band (D). Net rhythm:
   **dark hero → light features → sky-tint band → ink Pro**. Don't leave the whole page flat-white.
7. **Keep image filenames.** `screenshot_1–5.png` + `twitter_banner.png` show the OLD app UI — flag
   for re-capture from the redesigned build, but don't rename.

---

## 1 · Main page — `styles/styles.css`

### Global — `body`
```css
/* was: font-family:system-ui; color:#333; background:#fff */
body{
  font-family:'Plus Jakarta Sans',-apple-system,sans-serif;
  color:var(--ink);        /* #16202B */
  background:var(--bg);     /* #F5F7FA */
}
```

### Top nav — `.hero-nav nav a`  (sits on the dark hero)
```css
/* light links on the dark hero */
.hero-nav nav a{ color:#EAF6FD; font-weight:600; }
.hero-nav nav a:hover{ color:#fff; }
```

### Hero — IMMERSIVE DARK (the selected direction) · `.hero`, `.hero-title h1`, `.tagline`, `.icon-logo`
```css
/* was: linear-gradient(135deg,#4FACFE,#00F2FE); white text.
   Now a deep sky→ink gradient with soft sky + coral glows. White text; the coral CTA is
   the single focal point; bright app screens pop against the dark. Lower page stays light. */
.hero{
  background:
    radial-gradient(55% 60% at 88% 12%, rgba(6,166,240,.42), transparent 62%),
    radial-gradient(48% 55% at 82% 98%, rgba(255,107,74,.30), transparent 60%),
    radial-gradient(130% 130% at 12% 8%, #0E5E86, #0A3A54 46%, #062336 100%);
  color:#fff; overflow:hidden;
}
.hero-title h1{ color:#fff; font-weight:800; letter-spacing:-.03em; }
.tagline{ color:#CFE8F5; font-weight:700; }        /* headline weight, was ink-2 */

/* LOGO — keep the real Trunk app icon: sky-gradient tile, white glyph. Pops on the dark. */
.icon-logo{
  height:28px; width:auto; box-sizing:content-box;
  padding:11px 15px;
  background:linear-gradient(135deg,#06A6F0,#00D0FF);
  border-radius:13px;
  box-shadow:0 4px 12px rgba(6,166,240,.35);
}

/* product screens pop on the dark: deeper shadow + hairline edge (tilt/overlap optional, below) */
.hero-screenshots img{
  box-shadow:0 26px 55px rgba(0,0,0,.45);
  border:1px solid rgba(255,255,255,.08);
}
```

**Optional polish (CSS only).** Tilt + overlap the two hero phones so they read with depth:
```css
.hero-screenshots img:nth-child(1){ transform:rotate(-4deg) translateY(10px); }
.hero-screenshots img:nth-child(2){ transform:rotate(3deg); margin-left:-40px; position:relative; z-index:2; }
```

> **Lighter alternative (A)** if you ever want to soften the top instead of going dark:
> `.hero{ background:radial-gradient(115% 85% at 88% -5%, #CFEBFB, #E6F4FB 32%, var(--bg) 68%); }`
> with `.hero-title h1`/`.tagline` staying dark (ink). Don't combine A and B.

### Download button — `.button`  ← CORAL (the primary CTA)
```css
/* was: white bg, #007acc text. Now coral: distinct from the blue logo, and coral = "take action". */
.button{
  background:var(--coral); color:var(--ink);      /* dark text on coral — AA safe (white fails) */
  font-weight:700; border-radius:var(--r-btn);     /* 14px */
  box-shadow:0 10px 30px rgba(255,107,74,.5);      /* strong glow — it's the hero focal point */
}
.button:hover{ background:#FF7D5E; }
```

### Hero screenshots — `.hero-screenshots img`
```css
/* was: radius 12px, 0 4px 12px rgba(0,0,0,.2) */
.hero-screenshots img{
  border-radius:22px;
  box-shadow:0 10px 28px rgba(22,32,43,.12);       /* softer, ink-tinted */
}
/* re-export from the redesigned app first */
```

### Section headings — `section h2`
```css
/* was: 2rem, centered, default weight */
section h2{ font-weight:800; letter-spacing:-.02em; color:var(--ink); }
```

### Feature cards — `.feature`
```css
/* was: #f9f9f9 bg, 0 2px 8px rgba(0,0,0,.04), radius 12px */
.feature{
  background:var(--card); border:1px solid var(--border);
  border-radius:var(--r-card);                     /* 16px */
  box-shadow:var(--shadow-card);
}
.feature h3{ font-weight:700; color:var(--ink); }
.feature p{ color:var(--ink-2); }
```

### Feature icons — `.feature .material-symbols-rounded`  (tinted chips — move C)
```css
/* works once the markup class is renamed to -rounded (see §0).
   Rounded tinted TILE behind each glyph — grounds the icons and adds color to the white grid. */
.feature .material-symbols-rounded{
  display:flex; align-items:center; justify-content:center;
  width:60px; height:60px; margin:0 auto .9rem; border-radius:18px;
  font-size:30px;
  background:var(--sky-tint); color:var(--sky-text);
}
/* alternate two cards to coral for rhythm */
.feature-grid .feature:nth-child(2) .material-symbols-rounded,
.feature-grid .feature:nth-child(4) .material-symbols-rounded{
  background:var(--coral-tint); color:var(--coral-text);
}
```

### Screenshot row — `.screenshot-row` + `img`  (full-bleed sky-tint band — move D)
```css
/* full-width sky-tint stage breaks the white expanse between Features and the Pro banner */
.screenshot-row{
  background:var(--sky-tint);
  margin-left:calc(50% - 50vw); margin-right:calc(50% - 50vw);
  width:100vw; padding:3.5rem 1.5rem; box-sizing:border-box;
}
.screenshot-row img{ border-radius:22px; box-shadow:0 10px 28px rgba(22,32,43,.12); }
```

### Pro banner — `.pro-banner`, `.pro-badge`, `.pro-features`  ← coral lives here
```css
/* was: #0A2540 navy bg; #03A9F4 badge */
.pro-banner{ background:var(--ink); }              /* #16202B */

/* CORAL: the Pro tier is the site's coral moment (app uses coral for the smart/suggestion layer).
   Solid vivid coral with dark --ink text = AA-safe and pops on the ink banner. NOT white-on-coral. */
.pro-badge{ background:var(--coral); color:var(--ink); border-radius:9px; font-weight:700; }

.pro-features li{ background:rgba(255,255,255,.06); border-radius:12px; }
.pro-features li strong{ color:var(--coral); }    /* second, subtle coral accent on the feature titles */
```

### Signup form — `.signup-form input / button`
```css
/* was: radius 6px; white btn, #007acc text */
.signup-form input[type=email]{ border-radius:var(--r-btn); }
.signup-form button{
  background:var(--coral); color:var(--ink);        /* coral CTA, matches the hero Download button */
  font-weight:700; border-radius:var(--r-btn);
}
.signup-form button:hover{ background:#FF7D5E; }
```

### Footer + global links — `footer`, `a:hover`
```css
/* was: default text; a:hover #007acc */
footer{ color:var(--ink-2); }
footer a:hover,
a:hover{ color:var(--sky-text); }                  /* replace every #007acc */
```

---

## 2 · Privacy — `privacy.html` (reuses `styles/styles.css`)

Inherits everything above automatically (same stylesheet, `.privacy-policy-content` body). Only add:

```css
.privacy-policy-content h1{ font-weight:800; letter-spacing:-.02em; }
.privacy-policy-content h2{ font-weight:700; }
.privacy-policy-content a{ color:var(--sky-text); }   /* back link + contact */
```

---

## 3 · Blog — `blog/styles/styles.css`

> Separate stylesheet — **repeat the `:root` block from §0 at the top of this file too.**
> Blog links use `#0077cc` (note: main page uses `#007acc`) — both → `--sky-text`.

### Global — `body`
```css
/* was: font-family:system-ui; color:#333; background:#fff */
body{ font-family:'Plus Jakarta Sans',-apple-system,sans-serif; color:var(--ink); background:var(--bg); }
```

### Masthead — `.site-header` + nav links
```css
/* was: linear-gradient(135deg,#4FACFE,#00F2FE); white heading & nav links */
.site-header{ background:var(--bg); color:var(--ink); }
.site-header h1{ font-weight:800; letter-spacing:-.02em; }
.site-header nav ul li a{ color:var(--ink); font-weight:600; }
.site-header nav ul li a:hover{ color:var(--sky-text); }
```

### List cards — `.blog-list article` + `h2` / `p` / `.thumbnail`
```css
/* was: #f9f9fb card, radius 12px, 0 2px 8px rgba(0,0,0,.04); h2 #222; p #444; thumb radius 8px */
.blog-list article{
  background:var(--card); border:1px solid var(--border);
  border-radius:var(--r-card);                     /* 16px */
  box-shadow:var(--shadow-card);
}
.blog-list article:hover{ box-shadow:0 8px 22px rgba(22,32,43,.10); }  /* keep the -4px lift */
.blog-list h2{ color:var(--ink); font-weight:700; }
.blog-list p{ color:var(--ink-2); }
.blog-list img.thumbnail{ border-radius:12px; }
```

### Footer — `.site-footer` + link
```css
/* was: #f9f9fb bg, #e0e0e0 top border, #666 text, links #0077cc */
.site-footer{ background:var(--card); border-top:1px solid var(--border); color:var(--ink-2); }
.site-footer a{ color:var(--sky-text); }
```

### Post body — `main.blog-post` h1 / h2 / a
```css
/* was: default heading weight; links #0077cc underlined */
main.blog-post h1{ font-weight:800; letter-spacing:-.02em; }
main.blog-post h2{ font-weight:700; }
main.blog-post a{ color:var(--sky-text); }         /* keep the underline for in-body links */
```

---

## Order of work

1. Add Plus Jakarta Sans `<link>` + swap Material Symbols Outlined → Rounded across all pages.
2. Drop the `:root` block into `styles/styles.css`.
3. Build the **immersive dark hero** (§1): sky→ink gradient + glows, white text/nav, `.icon-logo`
   stays the sky app-icon tile, `.button` CORAL with `--ink` text + glow, deeper shadow on the phones.
4. Convert `.feature` cards + `section h2` to the card/type system; give the feature icons
   **tinted chips** (C, alternating sky/coral).
5. Re-skin `.pro-banner` (ink); **`.pro-badge` → solid `--coral` + `--ink` text**,
   `.pro-features li strong` → `--coral`, and **`.signup-form button` → CORAL** (matches the hero CTA);
   put the **`.screenshot-row` on a full-bleed sky-tint band** (D); `footer`; replace every `#007acc`
   with `--sky-text`.
6. Repeat the `:root` block in `blog/styles/styles.css`; re-skin masthead, list cards, footer, post body;
   add the `privacy.html` heading/link polish.
7. Rename `.material-symbols-outlined` → `-rounded` in markup (activates the dead icon-color rule).
8. Swap in freshly-captured redesigned screenshots + updated OG/Twitter banner (same filenames).
9. Verify: logo shows as the sky app-icon tile, both CTAs are coral, no white-on-sky/white-on-coral,
   links are `--sky-text`, mobile breakpoint at `767px` still holds.

Ask before adding any new content, sections, or copy — this task changes presentation only.
Optional follow-up: a `prefers-color-scheme: dark` block (the app ships a full dark theme; the token
vars make it easy later — dark values are in the app's `DESIGN_SYSTEM.md`).
