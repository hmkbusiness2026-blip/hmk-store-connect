
# Mobile UI Refactor — Dark Gaming App Layout

Visual-only refactor of the storefront. No backend, schema, auth, or data changes. Existing HMK brand colors (fire gold `--primary`, fiery orange `--secondary`, diamond blue `--accent`) stay the source of truth — all accents, active states, and the floating button map to `--primary`. No neon green/yellow.

## 1. Global background
- `src/index.css`: deepen `--background` to ~`#121212` (HSL `0 0% 7%`) so game art pops. Keep card/popover one step lighter for separation. Update `body` fallback color to match.

## 2. Sticky header (`src/pages/Index.tsx`)
- Convert the existing `<header>` to `sticky top-0 z-40` with a blurred dark background and bottom hairline border.
- Left: HMK logo + "HMK STORE" wordmark (existing `hmk-logo.png`).
- Right: keep language toggle + notification bell, then a **circular profile avatar placeholder** (40px) with a subtle `--primary`-tinted ring, linking to `/profile`. Admin "Customize" link stays for admins, restyled as an icon button.
- Consistent 16–20px horizontal padding.

## 3. Promo carousel (replaces `PromoBanner.tsx`)
- Refactor `PromoBanner` into a swipeable carousel using the existing shadcn `carousel` component (Embla, already in repo).
- 2–3 slides pulled from `site_config` keys (`banner_main`, plus new optional `banner_2`, `banner_3` — read-only, no schema change; missing keys just fall back to defaults).
- Each slide: rounded-2xl, full-bleed game art (Honor of Kings, MLBB), gradient overlay, stylized title, subtitle, and a **"TOP UP" pill button** in `--primary` that scrolls to the games grid.
- Auto-advance every 5s, dot indicators in muted/`--primary`.

## 4. Category tabs (`src/components/CategoryFilter.tsx`)
- Replace pill buttons with a horizontally scrollable **text menu with underline indicator**.
- Active tab: `text-foreground` + 2px underline bar in `--primary` (animated with `layoutId` via framer-motion, already a dep).
- Inactive: `text-muted-foreground`.
- Labels: keep current translation keys (`allGames`, `uidGame`, `loginGame`, `other`); map visually to the "Best Seller / TopUp Game / E-Wallet" style. No new categories added — just restyled.

## 5. Content grid (`src/components/GameGrid.tsx`)
- Keep current 3-col grid but upgrade card styling:
  - Rounded-2xl, full-bleed game icon, subtle glass effect (`backdrop-blur`, `border-white/5`, soft inner shadow), elevation on hover/active.
  - Title chip overlaid on bottom with gradient scrim.
  - UID badge restyled to match new palette (use `--primary` instead of hardcoded green).
- Ensure MLBB and Honor of Kings appear first in `gameData.ts` ordering (reorder array only — no data added).
- Add active/tap scale + ring in `--primary`.

## 6. Bottom navigation (`src/components/BottomNav.tsx`)
- Rebuild as a fixed bottom bar with **5 slots**: Home, Game, [floating Search], Messages, Profile.
  - "Game" = link to `/` games section (or reuse Home with a games anchor).
  - "Messages" = link to `/orders` (closest existing route) — keeps existing routing untouched.
  - VIP tab (logged-in only) moves into an overflow or is dropped from bottom bar per the new 5-slot spec; VIP page remains reachable from profile. **Confirm below.**
- Center **floating circular Search button**: 56px, `--primary` fill, elevated shadow/glow, overlaps top edge of the bar (`-translate-y-1/2`). Opens a search overlay that focuses the existing `SearchBar` (reuses current state — no new logic).
- Tiny text labels under the 4 standard icons; active icon + label tint in `--primary`.

## 7. Styling polish
- Standardize 16–20px page padding (`px-4` → `px-5` where appropriate).
- Tap states: `active:scale-95`, focus rings in `--primary/40`.
- Typography: keep Rajdhani/Cairo; bump contrast on muted text for legibility on the darker background.

## Files touched
- `src/index.css` — background token + minor utility tweaks
- `src/pages/Index.tsx` — sticky header, layout padding, profile avatar
- `src/components/PromoBanner.tsx` — convert to carousel
- `src/components/CategoryFilter.tsx` — underline tab style
- `src/components/GameGrid.tsx` — card restyle, badge color
- `src/components/BottomNav.tsx` — 5-slot nav + floating search button
- `src/lib/gameData.ts` — reorder games (MLBB, HOK first); no field changes

## Out of scope
- No new routes, tables, RPCs, or auth changes.
- No new translations beyond reusing existing keys.
- No changes to admin, staff, VIP, checkout, or auth flows.

## One question before I build
The new bottom bar spec has exactly 5 slots (Home, Game, Search, Messages, Profile) and doesn't include VIP. Two options:
- **A:** Drop VIP from the bottom bar entirely; access VIP from the Profile page (cleanest, matches reference).
- **B:** Keep VIP as a 6th slot for logged-in users (breaks the symmetric 5-slot look).

I'll default to **A** unless you say otherwise.
