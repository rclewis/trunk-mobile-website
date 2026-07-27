/* Trunk website analytics — GA4 with Google Consent Mode v2.
 *
 * Loaded on every page via <script src="/assets/js/analytics.js" defer></script>.
 * Self-contained on purpose: the site has two separate stylesheets, so the
 * banner's CSS is injected from here rather than maintained in both.
 *
 * Google Analytics is not contacted at all until the visitor accepts: no cookie,
 * no page_view, no request. See the note above loadGtag() for why.
 */
(function () {
  'use strict';

  /* Paste the Measurement ID from the GA4 "Trunk Website" web data stream.
     Until this is filled in, the whole module stays inert — no requests, no banner. */
  var MEASUREMENT_ID = 'G-L4315506XR';

  var PLACEHOLDER_ID = 'G-XXXXXXXXXX';
  var STORAGE_KEY = 'trunk_consent';
  var PRIVACY_URL = '/privacy.html';

  if (!MEASUREMENT_ID || MEASUREMENT_ID === PLACEHOLDER_ID) return;

  /* ---------------------------------------------------------------- consent */

  // localStorage throws in some private-browsing modes; a failure here should
  // degrade to "ask again next visit", never to a broken page.
  function readConsent() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------------ gtag */

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // Consent Mode v2 defaults, pushed before gtag.js loads. The ad signals stay
  // denied permanently — Trunk runs no advertising and never needs them.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID);

  // Everything above only queues into dataLayer — nothing leaves the browser until
  // gtag.js is actually fetched below.
  //
  // Google's stock Consent Mode loads gtag.js immediately in the denied state. That
  // sets no cookie, but it does send a cookieless page_view ping before the visitor
  // has answered, which we did not want to have to explain in the privacy policy.
  // So we hold the script back entirely until consent is granted. The cost is
  // Google's consent modelling, which needs far more traffic than this site sees to
  // produce anything. To go back to stock behaviour, call loadGtag() unconditionally.
  var gtagRequested = false;

  function loadGtag() {
    if (gtagRequested) return;
    gtagRequested = true;

    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(tag);
  }

  function grantAnalytics() {
    // Queued ahead of the script load, so gtag.js reads default-then-update in order.
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadGtag();
  }

  /* ---------------------------------------------------------------- banner */

  var BANNER_CSS = [
    '.trunk-consent{',
    'position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:9999;',
    'display:flex;flex-wrap:wrap;gap:1rem;align-items:center;justify-content:space-between;',
    'max-width:56rem;margin:0 auto;padding:1rem 1.25rem;',
    'background:var(--card,#FFFFFF);color:var(--ink,#16202B);',
    'border:1px solid var(--border,#E8ECF1);border-radius:var(--r-card,16px);',
    'box-shadow:var(--shadow-card,0 4px 16px rgba(22,32,43,.06));',
    "font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;",
    'font-size:.9rem;line-height:1.5;animation:trunk-consent-in .28s ease-out}',

    '@keyframes trunk-consent-in{from{opacity:0;transform:translateY(.75rem)}to{opacity:1;transform:none}}',
    '@media(prefers-reduced-motion:reduce){.trunk-consent{animation:none}}',

    '.trunk-consent__text{margin:0;flex:1 1 20rem;min-width:0}',
    '.trunk-consent__text a{color:var(--sky-text,#0883C2);text-decoration:underline}',

    '.trunk-consent__actions{display:flex;gap:.5rem;flex:0 0 auto}',
    '.trunk-consent__btn{',
    'font:inherit;font-weight:600;cursor:pointer;white-space:nowrap;',
    'padding:.55rem 1.15rem;border-radius:var(--r-btn,14px);',
    'border:1px solid transparent;background:none;color:inherit}',
    '.trunk-consent__btn:focus-visible{outline:2px solid var(--sky,#06A6F0);outline-offset:2px}',
    '.trunk-consent__btn--accept{background:var(--sky,#06A6F0);color:#fff}',
    '.trunk-consent__btn--accept:hover{filter:brightness(1.06)}',
    '.trunk-consent__btn--decline{',
    'border-color:var(--border,#E8ECF1);color:var(--ink-2,#6B7785)}',
    '.trunk-consent__btn--decline:hover{color:var(--ink,#16202B);background:var(--divider,#F0F2F5)}',

    '@media(max-width:32rem){',
    '.trunk-consent{flex-direction:column;align-items:stretch}',
    '.trunk-consent__actions{justify-content:stretch}',
    '.trunk-consent__btn{flex:1}}'
  ].join('');

  function showBanner() {
    var style = document.createElement('style');
    style.textContent = BANNER_CSS;
    document.head.appendChild(style);

    var banner = document.createElement('div');
    banner.className = 'trunk-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Analytics consent');

    var text = document.createElement('p');
    text.className = 'trunk-consent__text';
    text.appendChild(document.createTextNode(
      'We use Google Analytics to see how many people visit this site and which ' +
      'pages they read. Nothing is collected unless you accept. '
    ));

    var link = document.createElement('a');
    link.href = PRIVACY_URL;
    link.textContent = 'Privacy Policy';
    text.appendChild(link);

    var actions = document.createElement('div');
    actions.className = 'trunk-consent__actions';

    // Decline is given the same prominence as Accept; a hard-to-find refusal is
    // exactly what the consent rules exist to prevent.
    var decline = document.createElement('button');
    decline.type = 'button';
    decline.className = 'trunk-consent__btn trunk-consent__btn--decline';
    decline.textContent = 'Decline';

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'trunk-consent__btn trunk-consent__btn--accept';
    accept.textContent = 'Accept';

    function dismiss(choice) {
      writeConsent(choice);
      if (choice === 'granted') grantAnalytics();
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }

    decline.addEventListener('click', function () { dismiss('denied'); });
    accept.addEventListener('click', function () { dismiss('granted'); });

    actions.appendChild(decline);
    actions.appendChild(accept);
    banner.appendChild(text);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  var choice = readConsent();
  if (choice === 'granted') {
    grantAnalytics();
  } else if (choice !== 'denied') {
    showBanner();
  }

  /* ------------------------------------------------------- app store clicks */

  // Delegated so it covers the hero button and the in-post links alike, plus
  // anything added later, without touching the markup.
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;

    var link = target.closest('a[href*="apps.apple.com"]');
    if (!link) return;

    gtag('event', 'app_store_click', {
      link_url: link.href,
      link_text: (link.textContent || '').trim().slice(0, 100),
      page_path: window.location.pathname
    });
  });
})();
