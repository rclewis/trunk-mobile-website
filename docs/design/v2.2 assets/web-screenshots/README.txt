Trunk website — updated app screenshots
=======================================
Generated from "App Screenshots.dc.html" (board reflects current code:
4-tab bottom nav — Trips, Lists, Items, Settings).

WHAT CHANGED
  Only the three screens that show the bottom tab bar. A 4th "Settings"
  tab was added. Nothing else in any screen changed.

FILES (drop-in replacements, keep the same names)
  screenshot_1.png   Trips screen      -> assets/images/screenshot_1.png
  screenshot_2.png   Lists screen      -> assets/images/screenshot_2.png
  screenshot_3.png   Items screen      -> assets/images/screenshot_3.png

  660px wide, 2x-rendered then downscaled. Height is 1431px (previous
  files were 1400px) because the frame aspect is preserved — the site
  sizes these by width with height:auto, so no CSS change is needed.

NOT INCLUDED
  screenshot_4.png and screenshot_5.png (Create a Trip, Trip Details)
  are unchanged — no tab bar — so leave the existing files in place.

INSTALL
  Copy the three PNGs into trunk-mobile-website/assets/images/,
  overwriting the existing files. No markup or CSS changes required.
