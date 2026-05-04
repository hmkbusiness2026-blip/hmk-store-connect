# HMK STORE — Phase 3: Staff Operations Overhaul

This is a large, multi-area upgrade. Below is a scoped plan that maps each requirement onto the existing schema (`user_roles`, `orders`, `profiles`, `notifications`, `store_status`, `site_config`, `reviews`) and existing pages (`AdminPage`, `OwnerPage`, `AdminCustomize`, `CheckoutFlow`).

To keep this shippable, "Owner" is treated as Admin tier and current "admin" role becomes Moderator tier. We will add a new `moderator` role value.

---

## 1. Security & RBAC

**Database changes (migration):**
- Extend `app_role` enum: add `moderator`. Final tiers: `client`, `moderator`, `admin`, `owner` (owner = super-admin).
- Add helper `has_any_role(_user_id, variadic _roles app_role[])`.
- Add `audit_logs` table: `id, user_id, action, entity_type, entity_id, before jsonb, after jsonb, ip, user_agent, created_at`. RLS: only admin/owner SELECT; INSERT via SECURITY DEFINER function `log_audit(...)`.
- Add `deleted_at timestamptz` columns (soft delete) to `orders`, `reviews`, `site_config`. Update existing RLS SELECT policies to filter `deleted_at IS NULL` for non-admins; add `restore`/`purge` admin-only RPCs.
- Add triggers on `orders`, `user_roles`, `site_config`, `store_status` that call `log_audit` on INSERT/UPDATE capturing OLD/NEW.
- Add `staff_sessions` table: `id, user_id, session_token, device_id, started_at, last_ping, ended_at, ended_reason`. Enforce single active session per staff via partial unique index `WHERE ended_at IS NULL`.
- Add `staff_mfa` table: `user_id pk, secret, enabled bool, backup_codes text[]`. MFA verification edge function `verify-mfa` issues a short-lived "elevated" claim (stored in `staff_sessions.elevated_until`) required for refunds/role changes.

**Backend middleware (edge functions):**
- `staff-action` edge function: single entry-point that validates JWT + role + active session + (when needed) elevated MFA claim, then performs sensitive mutations (approve/reject/refund order, assign role, soft-delete). All "destructive" UI buttons call this function instead of touching tables directly. RLS already blocks direct writes for non-staff; this layer enforces business rules and writes audit logs.
- `staff-session` edge function: `start`, `ping`, `end`. Rejects start if another active session exists.

## 2. Admin (Owner) Interface

- New `src/pages/admin/Dashboard.tsx` (KPI home): revenue (sum approved orders), profit margin (price − cost stored in new `orders.cost` nullable column), conversion rate (orders/visits — visits stored in new `analytics_events` table or omit if no traffic source), top games. Charts via existing `recharts`.
- Sidebar with full navigation: Dashboard, Orders, Customers, Staff, Finance, Reviews, Site Config, Audit Logs, Shift Reports.
- `src/pages/admin/ShiftReports.tsx` (hidden link, reachable only by typing path `/owner/shifts`): joins `staff_sessions` aggregated per day vs a new `staff_schedules` table (`user_id, shift_start, shift_end`).
- Concurrent login already enforced server-side; UI shows "Signed out — session opened elsewhere" toast when ping returns 409.

## 3. Moderator Interface

- New `src/pages/mod/Dashboard.tsx`: queues — Pending Orders, Unread Messages, Low Stock (stock tracked via new `site_config` keys per game package or new `inventory` table — propose `inventory(package_id, stock int)`).
- Conditional rendering: components import a `usePermissions()` hook and use `<Can role="admin">…</Can>` wrappers that return `null` (not disabled) so admin-only JSX is removed from the tree entirely.
- Bulk processing: order list uses checkbox column + bulk action bar (Approve, Reject, Print Labels, Mark Shipped) → calls `staff-action` with array of IDs.
- Quick-action macros: e.g., "Cancel & Restock" button → edge function does refund + inventory increment + customer notification in one call.
- Keyboard shortcuts via `useHotkeys`: `g o` → orders, `g i` → inbox, `a` → approve focused row, `r` → reject, `/` → search.

## 4. Shift Management

- `staff_sessions.last_ping` updated every 60s by client hook `useStaffPresence` calling `staff-session/ping`. Hook also tracks `mousemove`/`keydown`; if no input for 10 min, sets `is_idle = true` (column added) and ping endpoint flips ticket routing off for that user.
- New `handovers` table: `from_user, to_user, notes, created_at, acknowledged_at`. Logout flow:
  1. Mod clicks "Clock Out".
  2. UI checks for another active mod session — if none, hard block with modal "No active replacement online."
  3. Mod fills handover notes → row inserted → modal pops on incoming mod's dashboard until acknowledged.
- Auto-pause: a `pg_cron` job every minute marks sessions idle when `last_ping < now() - interval '10 min'` and routes new tickets only to non-idle staff.

## 5. Customer Operations

- New `messages` table: `id, customer_id, channel ('whatsapp'|'app'|'email'), direction, body, order_id nullable, status ('new'|'open'|'closed'), assigned_to, created_at`. WhatsApp/email channels can be ingested later via webhook edge functions; for now app channel works end-to-end.
- Unified Inbox page `src/pages/mod/Inbox.tsx` with realtime subscription on `messages`.
- Color-coded triage: row classes by priority field (red=dispute, yellow=pending, green=closed). Priority derived from `status` + age.
- Progressive disclosure: clicking a row opens a right-side `<Sheet>` (existing shadcn) with full order/message details — no route change.
- Internal collaboration: new `order_notes` table `id, order_id, author_id, body, mentions uuid[], created_at`. `@mention` triggers a `notifications` row for the mentioned staff.

---

## Technical Notes

- Migrations: one migration per concern (enum, audit, soft-delete, sessions, mfa, inventory, messages, handovers, schedules, order_notes). Add triggers and RLS for each. All staff-write tables: SELECT for admin/owner, INSERT/UPDATE via SECURITY DEFINER RPCs called from `staff-action`.
- Edge functions: `staff-action`, `staff-session`, `verify-mfa`, `whatsapp-webhook` (stub).
- Frontend libs to add: `react-hotkeys-hook`, `otpauth` (TOTP), `qrcode.react` (MFA enrollment QR). Recharts already present.
- File structure: `src/pages/admin/*`, `src/pages/mod/*`, `src/hooks/usePermissions.ts`, `src/hooks/useStaffPresence.ts`, `src/components/staff/*`.
- Existing `AdminPage`/`OwnerPage` become thin redirects to `/mod` or `/admin` based on role.

## Suggested Build Order (so we can verify each phase)

1. Schema migration: enum + audit_logs + soft delete + triggers.
2. `staff-session` + `staff_sessions` + presence hook + concurrent-login enforcement.
3. MFA enrollment + `verify-mfa` + elevated-action gate.
4. `staff-action` edge function + refactor existing Approve/Reject to use it.
5. Admin Dashboard (KPIs) + Audit Logs viewer + Shift Reports.
6. Moderator Dashboard + bulk actions + hotkeys + macros.
7. Handovers + idle auto-pause cron.
8. Unified Inbox + order notes + @mentions.

## Open Questions

- Do you want WhatsApp ingestion wired via Twilio/360dialog now, or stub the inbox to app-channel only?
- For MFA, prefer TOTP (Google Authenticator) or email codes? (TOTP recommended; no SMS cost.)
- Should "owner" remain the only role that can assign `admin`/`moderator`, with admin able to assign `moderator` only? (Default: yes.)
- Do you want me to ship all 8 build-order steps in one go, or stop after step 4 for review?
