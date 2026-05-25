## Goal
Build an advanced shift-management & control hub for HMK Store admins, with off-duty enforcement on the customer side and shift financial reports.

## 1. Database (migration)

New tables:
- **`admin_profiles`** — `user_id` (uniq), `full_name`, `vodafone_cash`, `instapay_id`, `vault_key_hash` (bcrypt/sha), `updated_at`. RLS: admin reads/updates own; staff can read minimal fields (name, vodafone, instapay) of *active* admin via SECURITY DEFINER function.
- **`admin_shifts`** — `id`, `admin_id`, `status` ('open'|'closed'|'handover_pending'), `opened_at`, `closed_at`, `start_smile`, `start_wallet`, `start_instapay` (numeric), `start_smile_note`, `start_wallet_note`, `start_instapay_note`, `end_smile`, `end_wallet`, `end_instapay` (numeric, nullable), `end_*_note`, `handover_to` (uuid nullable), `closed_reason` ('end'|'handover').
- **`shift_handovers`** — `id`, `shift_id`, `from_admin`, `to_admin`, `status` ('pending'|'accepted'|'rejected'), `created_at`, `responded_at`.

SECURITY DEFINER helpers:
- `verify_vault_key(_user_id, _key)` returns boolean (compare hash).
- `set_vault_key(_key)` — hashes & stores for `auth.uid()`.
- `get_active_admin()` — returns row with `admin_id, full_name, vodafone_cash, instapay_id` of the single open shift (if any). Publicly executable so customers can read active admin's payment info.
- `is_store_on_duty()` — returns boolean (any open shift).
- RPCs: `open_shift(vault_key, start_smile, start_wallet, start_instapay, notes...)`, `close_shift(vault_key, end_smile, end_wallet, end_instapay, notes...)`, `request_handover(to_admin, vault_key_from, end_values, notes)`, `accept_handover(handover_id, vault_key_to, start_values, notes)`, `reject_handover(handover_id, vault_key_to)`.

All RPCs validate vault key + role, enforce single-open-shift, etc.

## 2. Admin UI

- **Profile page** (`AdminProfilePage.tsx`): add form for Full Name, Vodafone, InstaPay, Vault Key (set/change). Plus link to "تاريخ العمل / Work History".
- **Control Hub** — new route `/admin/control` with sections:
  - الدوام (Shift Ops): cards for Open / Handover / End — gated by current shift state. Modals collect vault key + start/end financials + notes.
  - Pending incoming handover requests (accept/reject with vault key + start values).
  - الاشعارات المهمة (placeholder card).
- **Work History** `/admin/history`: list of closed shifts with start/end values and notes.
- **AdminBottomNav**: add "التحكم" button.

## 3. Customer Off-Duty Enforcement

- Hook `useStoreOnDuty()` calls `is_store_on_duty()` + subscribes to `admin_shifts` realtime.
- `useActiveAdmin()` calls `get_active_admin()` for payment info.
- In `ProductsPage` / `CheckoutPage`: when off-duty, disable Player ID/Server inputs, hide proceed buttons, show overlay "نحن خارج أوقات العمل حالياً" + operational hours.
- Checkout page: replace static Vodafone/InstaPay numbers with active admin's values.

## 4. Files

**New:**
- `supabase/migrations/<ts>_admin_shifts.sql`
- `src/hooks/useStoreOnDuty.ts`
- `src/hooks/useActiveAdmin.ts`
- `src/hooks/useCurrentShift.ts`
- `src/pages/admin/AdminControlPage.tsx`
- `src/pages/admin/AdminWorkHistoryPage.tsx`
- `src/components/admin/OpenShiftDialog.tsx`
- `src/components/admin/CloseShiftDialog.tsx`
- `src/components/admin/HandoverDialog.tsx`

**Edited:**
- `src/App.tsx` — new routes under `/admin`.
- `src/components/AdminBottomNav.tsx` — add Control link.
- `src/pages/admin/AdminProfilePage.tsx` — profile editor + vault key + history link.
- `src/pages/CheckoutPage.tsx` — dynamic admin payment info + off-duty guard.
- `src/pages/ProductsPage.tsx` — off-duty disables inputs + proceed button.

## Notes
- Vault key stored as SHA-256 hash (via `digest` from `pgcrypto`) — never returned to clients.
- All financial RPCs require role admin/owner and valid vault key.
- Single active shift invariant enforced via partial unique index on `admin_shifts(status) WHERE status='open'`.
