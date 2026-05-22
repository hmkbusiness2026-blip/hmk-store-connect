## Goal
1. Let guests (not-logged-in users) browse game prices/packages without being blocked.
2. Hide the VIP tab in the bottom nav until the user is logged in.

## Changes

### 1. `src/components/CheckoutFlow.tsx` — show prices to guests
- Remove the early "Login required" gate that currently blocks the entire modal when `!user`.
- Allow guests to navigate through **Step 1 (server/UID)** and **Step 2 (package list with prices)** normally.
- Move the login gate to **Step 3 (payment/receipt submission)**: when a guest tries to advance to step 3 (or sits on step 3), render the existing Login/Register card instead of the payment form, so prices are visible but checkout still requires an account.

### 2. `src/components/BottomNav.tsx` — conditional VIP tab
- Read `user` from `useAuth()`.
- Build the `navItems` array conditionally: include the VIP entry only when `user` is truthy. Home / Orders / Profile remain as-is (Orders/Profile already redirect to `/auth` when not logged in, per `App.tsx`).

## Out of scope
- No backend, schema, auth, or pricing-data changes.
- No visual restyling beyond what's needed to keep the layout consistent when VIP is hidden.
