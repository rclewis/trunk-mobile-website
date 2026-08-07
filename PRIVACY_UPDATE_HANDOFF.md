# Privacy Policy Update — Hand-off Spec

**For:** the website session that maintains `privacy.html` in this repo.
**Deliverable:** an updated `privacy.html` that truthfully discloses the analytics
and crash-reporting the Trunk app is about to add.
**This spec is self-contained** — you don't need any context from the app work.

---

## 1. Why this change is required (and the timing rule)

The Trunk mobile app is adding **Firebase Analytics** and **Firebase
Crashlytics**. As a result, the currently-published `privacy.html` is now
**factually false in two ways** and must be corrected:

1. **§1** says the only things Trunk sends off your device are weather lookups
   (and separately, device backups). That is no longer true — the app now also
   sends usage analytics and crash reports.
2. The policy discloses **no analytics or crash reporting at all**, which the
   app now does.

**Timing rule (do not violate):** the updated policy must be **published at or
before** the release of the app version that contains analytics — **never
after**. Publishing after would leave a false statement live. Set the
**Effective date** (currently line 13, "Effective July 22, 2026") to the date
you actually publish this update.

---

## 2. Hard rules for the wording

1. **Pseudonymous, NOT "anonymous."** Firebase assigns a **persistent
   per-install identifier** (an "App Instance ID"). That means the data is
   *pseudonymous*, not anonymous. Describe it as **"we never learn who you
   are"** and **"not linked to your identity."** **Do not call the analytics or
   crash data "anonymous."**
   - ⚠️ Exception: §2's weather section already uses the word "anonymous" for
     the *temporary AWS credentials* ("temporary, anonymous AWS credentials").
     That is a different thing and is accurate — **leave it unchanged.** The
     rule above is only about how you describe the **analytics/crash** data.
2. **Keep the existing true "we do not collect" claims.** The app genuinely
   (and these are enforced by automated tests in the app):
   - requests **no location permission** and collects no GPS/location;
   - collects **no advertising identifier** (so it does not trigger App
     Tracking Transparency);
   - never puts **user-typed text** (trip names, item names, notes,
     destinations, coordinates) into analytics events.
   Do not weaken or remove these — they remain true and are worth stating.
3. **Don't let the reader conflate two different IP claims.** §2 already says
   *our* weather service does not log your IP. Separately, Google (the analytics
   provider) *does* receive your IP with each request and uses it only to derive
   coarse (city-level) geography, then discards it. Keep these distinct and say
   so.

---

## 3. What the app actually collects (source of truth for your wording)

- **Usage events** — which screens are viewed and which features are used
  (e.g., a trip was created, a photo was attached, a saved list was applied,
  a setting was changed). Recorded as simple named events with only
  booleans/counts/fixed categories as parameters. **Never** any user-typed
  text, destination, or coordinate. Plus automatic events Firebase collects
  (app opens, session starts, screen views).
- **Crash & error diagnostics** — on a crash or error: the error, a stack
  trace, device model, OS version, app version. **Never** trips, items, lists,
  or photos.
- **A random per-install identifier** (Firebase App Instance ID) — lets repeat
  sessions be told apart (e.g., retention) **without** knowing who the user is.
  **Not** an advertising identifier; **not** linked to name/email/account.
- **IP address** — received by Google as part of each request, used only to
  estimate coarse city-level region, then discarded. We do not receive/store it.
- **Providers:** Google Analytics for Firebase, and Firebase Crashlytics (both
  Google). Google's retention for this property is **14 months**.
- **Opt-out:** a **"Share usage data"** toggle in the app's **Settings**. On by
  default; turning it off stops **both** analytics and crash reporting. One
  detail to disclose: at the moment the user turns it **off**, the app records
  that single setting change (so we can measure opt-out rate), and then collects
  nothing further. Turning it back on resumes collection.
- **Not used for tracking**, and **not sold.**

---

## 4. Edits to `privacy.html`

Structure decision: **add one new dedicated section, "Analytics and Crash
Reporting," as the new §3** (right after Weather), and renumber the sections
that follow. This is clearer for users and for App Store / Play review than
burying it in the weather list. Section 5 covers the exact renumbering and the
cross-references you must fix.

After this change, the policy discloses **six** third-party services total:
WeatherAPI, Apple WeatherKit, our AWS weather service, Apple App Store / Google
Play (all in §2), plus **Google Analytics for Firebase** and **Firebase
Crashlytics** (in the new §3).

### 4a. Effective date (line 13)

Change `Effective July 22, 2026` to the date you publish this update.

### 4b. §1 — fix the "everything Trunk sends is weather" sentence

**Replace** the paragraph currently at line 24 (it begins *"There are two
exceptions to 'stays on your device,'…"*) with wording to this effect (match the
policy's existing plain, careful voice):

> Some things do leave your device. Two are about weather (section 2): what you
> type when searching for a destination, and a destination's coordinates with
> the trip's date range when we fetch a forecast. A third is the usage and crash
> reporting described in section 3, which you can turn off. Device backups are a
> separate matter, covered in section 6.

(Also acceptable: add a short sentence to §1's body stating that Trunk collects
limited, non-identifying usage and crash data that can be turned off, with a
pointer to section 3. Keep the existing "We do not collect" bullet list — name,
email, **advertising identifier**, and location — exactly as is; all still true.)

### 4c. Insert the new section (new §3)

Insert immediately **after** the current §2 (Weather and Third-Party Services),
**before** the current §3 (Photos and Camera). Suggested copy, in the policy's
voice — adjust wording to match house style, but preserve every disclosure:

```html
<h2>3. Analytics and Crash Reporting</h2>
<p>To understand which features people actually use and to find and fix bugs, Trunk collects a limited amount of information about how the app is used and about crashes. This is on by default, and you can turn it off at any time — see “Your choice” below.</p>
<p><span style="font-weight: bold;">What we collect</span></p>
<ul>
    <li><span style="font-weight: bold;">How the app is used</span> — which screens you open and which features you use, recorded as simple events (for example, that a trip was created, a photo was attached, or a saved list was applied). These events never include anything you typed: no trip names, item names, notes, destinations, or coordinates.</li>
    <li><span style="font-weight: bold;">Crash and error reports</span> — when the app crashes or hits an error, we receive a technical report so we can fix it: the error and its stack trace, your device model, operating-system version, and the app version. These reports do not include your trips, items, packing lists, or photos.</li>
    <li><span style="font-weight: bold;">A random per-install identifier</span> — so we can tell repeat visits apart (for example, whether people come back to plan a second trip) without knowing who you are. This is not an advertising identifier, and it is not linked to your name, email, or any account — Trunk has none.</li>
</ul>
<p><span style="font-weight: bold;">We never learn who you are.</span> This information is not tied to your identity, and we do not use it to track you across other apps or websites.</p>
<p><span style="font-weight: bold;">Location.</span> These features do not collect your location — as noted in section 1, Trunk never requests location permission. When usage and crash data are sent, our provider (Google) receives your device’s IP address as an ordinary part of the network request and uses it only to estimate a coarse, city-level region, then discards it. We do not receive or store your IP address or any precise location. This is separate from our weather service in section 2, which also does not log your IP.</p>
<p><span style="font-weight: bold;">Who handles it.</span> This is provided by Google Analytics for Firebase and Firebase Crashlytics, part of Google, and is governed by Google’s privacy policy. Google retains this data for up to 14 months. We do not sell it, and we do not share it beyond what is needed to provide these services.</p>
<p><span style="font-weight: bold;">Your choice.</span> You can turn all of this off in Settings, under “Share usage data.” Turning it off stops both usage analytics and crash reporting. So that we can measure how many people opt out, the app records that single setting change at the moment you turn it off, and then collects nothing further. You can turn it back on at any time.</p>
```

---

## 5. Section renumbering + cross-reference fixes (do all of these)

Inserting the new §3 shifts every following section number up by one. Update the
`<h2>` headings **and** the in-text references:

**Heading renumber:**
- Photos and Camera: **3 → 4**
- In-App Purchases: **4 → 5**
- Data Storage and Security: **5 → 6**
- Deleting Your Data: **6 → 7**
- Children's Privacy: **7 → 8**
- Changes to This Policy: **8 → 9**
- Contact Us: **9 → 10**

**In-text cross-reference fixes (search the whole file):**
- §1 paragraph (your rewrite in 4b): device backups → **section 6** (was 5).
- In "Deleting Your Data" (now §7): "subject to the device-backup note in
  **section 5**" → **section 6**.
- In "Deleting Your Data" (now §7): "contact us at the address in **section 9**"
  → **section 10**.
- Sanity-check: any other "section N" mention. References to **section 2**
  (weather) stay 2. There should be no others beyond those listed.

---

## 6. Verification checklist (before publishing)

- [ ] The word "anonymous" does **not** describe the analytics/crash data
      anywhere. (The AWS-credentials "anonymous" in §2 may remain.)
- [ ] The policy names both **Google Analytics for Firebase** and **Firebase
      Crashlytics**.
- [ ] §1 no longer implies weather/backups are the only things sent off-device.
- [ ] The opt-out (Settings → "Share usage data") is described, including that
      the opt-out itself is recorded once.
- [ ] The IP distinction (Google derives coarse geography then discards vs. our
      weather service does not log IP) is intact and not conflated.
- [ ] "No advertising identifier" and "no location permission" claims are still
      present and unchanged.
- [ ] All section numbers are sequential (1–10) and every in-text "section N"
      reference points to the right renumbered section.
- [ ] Effective date set to the publish date.
- [ ] `git diff` reviewed; publish **before or with** the app release.

---

## 7. NOT part of this write-up (separate, parallel task — for the app owner)

The app's **App Store Connect → App Privacy** and **Google Play → Data safety**
labels must be updated to match this policy. That is done in the store consoles,
not in this repo — flagging it so it isn't forgotten alongside the policy publish.

**App Store — the full set** (all marked *not linked to identity*, *not used for
tracking*, *collected but not shared*):

| Apple data type | Why |
|---|---|
| Usage Data ▸ Product Interaction | the 11 custom events + screen views |
| Diagnostics ▸ Crash Data | Crashlytics |
| Diagnostics ▸ Other Diagnostic Data | Crashlytics non-fatals |
| Diagnostics ▸ Performance Data | already declared; mild over-declaration, harmless |
| **Identifiers ▸ Device ID** | Firebase per-install App Instance ID (IDFV fallback on iOS) |
| **Location ▸ Coarse Location** | GA4 "granular location and device data collection" is **ON**, so city-level location is collected — see §3's Location paragraph |

**Play → Data safety equivalents:** *App activity ▸ App interactions*,
*App info and performance ▸ Crash logs* + *Diagnostics*, *Device or other IDs*,
and **Location ▸ Approximate location**.

> ⚠️ The last two rows are the easy ones to miss, and each creates a
> policy↔label contradiction if omitted: §3 discloses a per-install identifier
> **and** a kept city-level location estimate, so both must appear on the label.
> (Updated after Addendum D — an earlier version of this section listed only
> Usage Data, Diagnostics, and Identifiers.)

---

## ADDENDUM (added after the spec was handed over — please apply)

Three changes, all to the new §3. Context: we checked the GA4 property and
**"Granular location and device data collection" is ON and is staying on.** That
means Analytics collects more than the original §3 draft described — specifically
**city-level location** and **granular device details** (device brand, model,
name, screen resolution, OS/browser version numbers). The policy must say so.

### A. Add a "device information" bullet to §3's "What we collect" list

The original draft only mentioned device details in the *crash report* bullet.
Analytics also collects them for ordinary usage. Add this bullet after the
"How the app is used" bullet:

```html
<li><span style="font-weight: bold;">Your device and app version</span> — basic technical details such as your device brand and model, screen size, operating-system version, and which version of Trunk you’re running. We use this to know which devices and versions to support and test against.</li>
```

### B. Replace the §3 "Location." paragraph

The original draft said Google estimates a coarse region "then discards it,"
which understated things: the IP address is discarded, but the **derived
city-level location is kept** as part of the usage statistics. Replace that
paragraph with:

```html
<p><span style="font-weight: bold;">Location.</span> Trunk never requests location permission and never uses your device’s location services — as noted in section 1. Our provider (Google) does receive your device’s IP address as an ordinary part of the network request, and uses it to estimate an approximate location, typically down to the city, which is kept as part of the usage statistics. The IP address itself is then discarded. We never receive or store your IP address, and this estimate is not precise location data — it is derived from your network connection, not from your device. This is separate from our weather service in section 2, which does not log your IP at all.</p>
```

### C. Retention sentence — no change needed

The "up to 14 months / aggregate counts may be kept longer" wording already
agreed stays exactly as-is. GA4 retention is confirmed set to 14 months for
both Event and User data.

### Verification additions

Add to the §6 checklist:
- [ ] §3 discloses **device information** collected for usage (not only crashes).
- [ ] §3's Location paragraph says the approximate/city-level location **is kept**,
      while the **IP address is discarded** — and does not claim location is
      discarded.
- [ ] §3 still states Trunk requests **no location permission** and uses no
      location services.

### D. Close the §1 location seam (approved — please apply)

§1's "We do not collect" bullet currently reads *"Your GPS or background
location — Trunk never requests location permission."* That stays **literally
true**, but §1 is the most-skimmed section and §3 now discloses a **kept
city-level estimate** — and the App Store label will declare
`Location > Coarse Location`. A flat "we do not collect location" in §1 would
appear to contradict the store label. Close it, **without weakening the true
claim**. Replace that bullet with:

```html
<li>Your GPS or precise location — Trunk never requests location permission and never uses your device’s location services. (Our analytics provider does estimate an approximate area, typically your city, from your network connection — see section 3.)</li>
```

Checklist addition:
- [ ] §1's location bullet keeps the "no permission / no location services"
      claim **and** points to section 3 for the network-derived approximate
      area, so §1 alone cannot be read as "no location data at all."
