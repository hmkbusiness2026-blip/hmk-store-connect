## Rebrand to HMK Visual Identity

Adopt the uploaded HMK brand guide: fiery orange/gold wings + blue diamond on a deep dark background, with Cairo as the primary Arabic/English font.

### 1. Add brand assets
- Copy `user-uploads://HMK_STORE_2.png` → `src/assets/hmk-logo.png` (transparent logo for headers, auth, favicon-style usage).
- Generate a small monochrome white variant for dark surfaces if needed (optional, can be done with CSS filter for now).
- Replace favicon + OG image in `index.html` with the HMK logo, update `<title>` to "HMK Store" and add a real meta description.

### 2. Update design tokens (`src/index.css`)
Switch the cyan/purple palette to the official HMK palette while keeping HSL semantic tokens:
- `--primary` → Golden `#FFB000` (fiery gold, main CTA)
- `--secondary` → Fire orange `#FF6A00`
- `--accent` → Diamond blue `#00C2FF`
- `--destructive` keep red, but tuned to fire-red `#E85C00` family for warnings vs. true destructive
- `--background` → deep near-black navy `#070710` (matches brand sheet)
- `--ring` follows primary gold
- Update `--glow-cyan`/`--glow-purple` semantics: rename utilities to `--glow-gold` / `--glow-blue` (keep old class names as aliases mapped to new colors so existing components keep working with one quick sweep).
- Update `.gradient-text` and `.gradient-cyan-purple` to a fire gradient: gold → orange (`#FFB000 → #FF6A00`), with an alternate `.gradient-fire-blue` for accents that include the diamond blue.

### 3. Update Tailwind config (`tailwind.config.ts`)
- Replace the literal `cyan` and `purple` color scales with `gold` (centered on `#FFB000`) and `fire` (centered on `#FF6A00`), plus a `diamond` blue scale (`#00C2FF` / `#0066CC`).
- Switch `fontFamily.display` and `fontFamily.body` to `"Cairo"` (per brand guide: Cairo Bold for headings, Cairo Regular for body). Keep Rajdhani as a Latin-only fallback.
- Update `@import` in `index.css` to load Cairo from Google Fonts (weights 400/600/700) instead of Rajdhani/Inter.

### 4. Wire the logo into the UI
- `src/App.tsx` top header: replace the text-only "HMK STORE" with the logo image + wordmark next to it.
- `src/pages/Index.tsx` header: same logo + storeName.
- `src/pages/AuthPage.tsx`: large centered logo above the form.
- `src/pages/staff/StaffLayout.tsx`: small logo in the sidebar.
- `src/components/PromoBanner.tsx`: keep dynamic banner image but ensure default fallback gradient uses the new fire palette.

### 5. Sweep hardcoded colors
Quick pass to swap any leftover literal `cyan-*` / `purple-*` / `from-primary to-primary-glow` style classes in pages/components to the new semantic tokens or the new `gold`/`fire`/`diamond` scales. Staff portal triage colors (red/yellow/green) stay as-is — they're functional, not brand.

### 6. SEO polish (since `index.html` is being touched)
- `<title>`: "HMK Store — شحن الألعاب الفوري"
- Meta description in Arabic + English (≤160 chars)
- `og:image` → uploaded logo on dark background (re-use logo asset via public path)
- Set `<html lang="ar" dir="rtl">` default (LanguageContext can flip on language change)

### Out of scope
- No backend/schema changes.
- No changes to staff portal logic, only logo + token sweep.
- Game card images stay as-is (managed via AdminCustomize).

### Files to touch
- `index.html`
- `src/index.css`
- `tailwind.config.ts`
- `src/App.tsx`, `src/pages/Index.tsx`, `src/pages/AuthPage.tsx`, `src/pages/staff/StaffLayout.tsx`
- `src/components/PromoBanner.tsx` (fallback only)
- New asset: `src/assets/hmk-logo.png`
