# Test Plan

## v1 Success Scenario
1. Open `/` (no login) → dashboard loads with seeded Harborfront Plaza data.
2. Verify daily turnover trend chart shows bars for Jan–Mar 2025.
3. Toggle period to **Monthly** → chart re-aggregates into monthly bars.
4. Filter to **F&B** → chart shows only F&B tenants.
5. Click **Add Entry** → select "The Salty Fork", date 2025-02-14, amount $4,500 → Save.
6. Monthly F&B chart updates to include the new amount.
7. Open tenant card for "The Salty Fork" → badge shows performance status.

## Empty State
1. Delete all entries for a tenant (or seed a new tenant with no entries).
2. Open dashboard → that tenant card shows "No turnover recorded yet" with an Add Entry prompt.

## Error State
1. Disconnect network / stop Supabase → refresh dashboard.
2. Dashboard shows error banner: "Could not load performance data. Retry."
3. Retry button re-fetches.

## Loading State
1. Slow network → skeleton chart placeholder + spinner on cards.

## CRUD Verification
1. Add entry → appears in list + chart.
2. Edit entry amount → chart updates.
3. Delete entry → chart removes it.