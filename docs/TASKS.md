# Tasks

## Sprint 1 — Database + Core CRUD + Daily Chart
**Goal:** record a turnover entry and see it in a chart.
- [ ] Create Supabase tables (properties, tenants, turnover_entries) + RLS + seed.
- [ ] Build `lib/data/` queries: list tenants, aggregate entries by day.
- [ ] Build `lib/actions/` for create/update/delete turnover entry.
- [ ] Dashboard page: property total turnover trend chart (daily).
- [ ] Add Entry modal: tenant select, date, amount → persists → chart updates.
- [ ] Loading / empty / error states on dashboard.

**DoD:** Add an entry via the UI; it appears in the daily chart. No login required.

## Sprint 2 — Periods, Categories, Full Dashboard ← v1 Functional
**Goal:** daily/monthly/annual toggle + F&B vs non-F&B breakdown.
- [ ] Period selector (Daily / Monthly / Annual) — re-aggregates charts.
- [ ] Category filter (All / F&B / Non-F&B) — filters chart + tenant cards.
- [ ] Per-tenant turnover cards with period toggle + performance badge.
- [ ] Edit / delete entries from a tenant detail view.
- [ ] All five states on every screen.

**DoD:** Success scenario runs end-to-end (see PRD). ← **v1 functional milestone**

## Sprint 3 — Lock It Down
**Goal:** auth + owner-scoped RLS.
- [ ] Add Supabase Auth (login/signup).
- [ ] Replace permissive RLS with `auth.uid() = user_id` on all tables.
- [ ] Assign `user_id` on insert for all new rows.
- [ ] Redirect unauthenticated users to login.

**DoD:** Logged-out user cannot see data; logged-in user sees only their own.

## Gantt
```
S1: DB + CRUD + daily chart  ████████
S2: Periods + categories    ████████  ← v1 functional
S3: Auth + RLS lock-down              ████████
```