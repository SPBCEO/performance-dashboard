# Architecture

## Stack
- **Frontend:** Next.js (App Router) + Recharts, deployed on Vercel.
- **Backend:** Supabase (Postgres + RLS).
- **Data access:** all DB reads/writes through `lib/data/` — never inline in components.

## Build Sequence
1. **Now:** DB schema + data layer + turnover CRUD + dashboard charts (daily/monthly/annual, category breakdown).
2. **Next:** Anomaly flags for underperforming tenants, CSV export.
3. **Later:** Login + owner-scoped RLS, automated alerts, budget tracking.

## Key User Action Flow
1. CEO opens `/` → dashboard loads seeded turnover data.
2. Selects period (Daily/Monthly/Annual) and category filter.
3. Clicks "Add Entry" → form opens → picks tenant, date, amount → saves.
4. Chart re-renders with the new entry aggregated into the selected period.

## Responsive Shell
Persistent left sidebar: Overview, Tenants, Add Entry. Collapses to hamburger on mobile.

## Layer Plan
- **Data first:** schema, seed, data-access functions.
- **App logic:** CRUD actions (server-side), aggregation queries, period/category filtering.
- **Smart features later:** anomaly detection, auto-flagging — core dashboard works without it.

## Why Core Works Without AI
Every value is a manually-entered dollar amount. Aggregation is pure SQL. No AI needed for the dashboard to function.

## Repo Structure
```
lib/data/        # all DB queries
lib/actions/     # server actions (CRUD)
lib/ai/          # anomaly detection (later)
components/      # UI components
app/             # routes
tests/           # beside code
```

## Module Map
| Module | Owns | Order |
|--------|------|-------|
| `data` | DB schema, queries, seed | 1 |
| `actions` | CRUD for turnover entries | 2 |
| `dashboard` | charts, period/category views | 3 |
| `tenants` | tenant list, detail cards | 4 |
| `ai` | anomaly flags (later) | 5 |