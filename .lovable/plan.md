## Problem

Carousel renders 3 dots on the Home page even though only 1 banner has a real image. Slides 2/3 appear black because `PromoBanner` falls back to `HOME_DEFAULTS` (game card images) for any slot where the DB value is empty — those defaults render as "phantom" slides, and in some viewports they appear blank/black.

Same root cause on the game pages: any empty `hok_banner_*` / `mlbb_banner_*` row is still being treated as a renderable slide because of stale fallback logic.

In the admin screenshot, only 2 of 4 slots actually have images saved — but the home carousel still shows 3 dots.

## Fix

Edit only `src/components/PromoBanner.tsx`:

1. Remove the per-slot `HOME_DEFAULTS` fallback. A slide is rendered **only** when its DB image URL is a non-empty trimmed string. Empty strings (saved by the banners manager when a slot is cleared) → slide is skipped entirely.
2. Keep a single first-time fallback: if **zero** valid slides come back from DB (i.e. the owner has never saved anything for this scope), show one default hero image so the page isn't empty. For `scope='home'` use the existing `bannerImg`; for game scopes show nothing (game pages already have their own hero header).
3. Dots count, arrows, and autoplay continue to derive from the filtered `slides` array, so 1 valid slide → no dots/arrows/autoplay (already implemented, will now work correctly because phantom slides are gone).
4. No changes to `BannersManagerDialog` (the last fix already persists empty strings for cleared slots, which this change now respects).
5. No DB or RLS changes.

## Verification

- Home with 1 saved banner → 1 slide, no dots, no arrows.
- Home with 2 saved banners → 2 slides, 2 dots, arrows, 15 s autoplay.
- HoK / MLBB tabs with 0 saved banners → carousel hidden (owner still sees the "تعديل البانرات" button to add one).
- Clearing a slot in the dialog and saving → that slide disappears on next load.