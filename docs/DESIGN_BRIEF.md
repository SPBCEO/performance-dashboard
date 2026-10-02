# Design Brief — Performance Dashboard

## What it is
A web dashboard for a property CEO / asset manager to see how each tenant, and the whole property, performs over time. The unit of data is a **turnover entry**: a dated dollar amount recorded for a tenant. Everything on screen is an aggregation of those entries.

## Who it's for
- **Primary:** Property CEO / asset manager overseeing several tenants. Time-poor, checks on phone and laptop, wants the answer in seconds, not a data-analysis tool.
- **Planned next:** teammates (Owner / Admin / Viewer) sharing a team workspace, each team seeing only its own data.

## Core objects
- **Property** — the asset (e.g. Harborfront Plaza). Aggregates all tenant turnover.
- **Tenant** — a leased unit, either **F&B** or **Non-F&B** (e.g. The Salty Fork, Brew & Co, Lifestyle Apparel).
- **Turnover entry** — date + USD amount for one tenant.

## The one job (success scenario, under 60 seconds)
CEO opens the dashboard, sees total property turnover trending, toggles **Daily / Monthly / Annual**, filters to **F&B**, taps **Add Entry**, records $4,500 for The Salty Fork on 14 Feb 2025, and the chart updates immediately.

## Screens
1. **Overview (home):** property name, period toggle (Daily/Monthly/Annual), category filter (All/F&B/Non-F&B), 3 KPIs (total turnover, latest period + % change vs prior, F&B share), stacked trend chart (F&B vs Non-F&B), F&B vs Non-F&B breakdown (donut + month-over-month %), grid of tenant cards.
2. **Tenant card:** name, category tag, performance badge, own period toggle, latest turnover, % vs prior, mini sparkline, annual total, link to entries.
3. **Tenants list:** same cards, filterable.
4. **Tenant detail:** header with badge, period chart, entries table (date, amount, Edit, Delete).
5. **Add / Edit entry:** modal (bottom sheet on mobile): tenant, date, amount. Delete asks for confirmation.
6. **Planned:** sign in / create team, team switcher, members and roles, invite links.

## Performance badge (rule-based)
Current month ÷ trailing 3-month average: **Outperforming** (>1.15, green), **On track** (0.85–1.15, neutral), **Underperforming** (<0.85, red, sorted to top). Also **No baseline yet** and **No data**. Badge must never rely on colour alone (icon + text).

## Required UI states, on every screen
Loading (skeletons), Empty ("No turnover recorded yet" + Add Entry prompt), Error ("Could not load performance data." + Retry), Partial (some tenants have no entries), Ready.

## Design goals
- Executive-calm, data-first: the chart and the headline number dominate; chrome is quiet.
- Feels like a premium property/finance product, not a generic admin template.
- **Mobile-first**: most checks happen on a phone. Bottom tab bar (Overview, Tenants, Team), sticky floating **Add Entry**, bottom-sheet forms, 44px+ tap targets, cards instead of tables, no horizontal page scroll.
- Desktop: left sidebar (Overview, Tenants, Team, Add Entry), generous whitespace, max content width ~1200px.
- Light and dark mode.
- Accessible: WCAG AA contrast, keyboard operable, charts have text alternatives, colour-blind-safe F&B vs Non-F&B colours (currently amber vs indigo; free to improve).

## Data realities to design for
- Amounts are USD, from tens to tens of thousands per entry; use compact axis labels ($4.0k).
- Daily view is sparse (only days with entries); monthly fills empty months.
- 3–10 tenants per property today; design should still hold at ~50.
- Currency/number formatting: `$12,500`, entries show cents `$3,800.00`.

## Not in scope
Automated alerts, budgets vs actuals, multi-property roll-up, receipt OCR/AI extraction.

## Current state (for reference)
Live app is built with Next.js, Tailwind, Recharts, Supabase. Current UI is a functional baseline in slate/indigo with amber for F&B; it works but is visually plain. Mockups so far: `docs/mockups/teams.html` (rough, to be replaced). The design agent owns visual direction, type, colour, charts styling, iconography, and component states.

## Deliverables requested
High-fidelity designs (mobile 390px and desktop 1440px, light and dark) for screens 1–6 incl. all UI states, a small component/token set (colour, type scale, spacing, chart palette, badges, buttons, inputs, modal/sheet), and the key interaction notes (period toggle, filter, add-entry flow).
