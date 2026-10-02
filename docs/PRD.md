# Performance Dashboard — PRD

## Problem
A CEO needs to see how each tenant and the entire property perform over time — turnover in dollars, broken down by F&B vs non-F&B categories, across daily, monthly, and annual periods, plus when spending occurs.

## Target User
Property CEO / asset manager overseeing multiple tenants across one or more properties.

## Core Objects
- **Property** — the entire asset; aggregates all tenant turnover.
- **Tenant** — a leased unit; categorised as F&B or non-F&B; belongs to a property.
- **Turnover Entry** — a dated dollar amount recorded for a tenant; the atomic unit every chart aggregates.

## MVP (v1) Checklist
- [ ] Dashboard page showing total property turnover with a trend chart.
- [ ] Per-tenant turnover cards with daily/monthly/annual toggle.
- [ ] F&B vs non-F&B category breakdown chart.
- [ ] Add / edit / delete a turnover entry (persists to DB, chart updates live).
- [ ] Period selector: Daily / Monthly / Annual.
- [ ] All five UI states per screen: loading, empty, error, partial, ready.
- [ ] Seeded demo data so the dashboard renders for anonymous visitors.

## Non-goals (v1)
- Login / signup / per-user data isolation.
- Automated alerts or anomaly detection.
- Budget vs actual comparison.
- Multi-property portfolio roll-up.
- Receipt OCR or AI-extracted amounts.

## Success Criteria
CEO opens the dashboard (no login), sees Harborfront Plaza total turnover trend, toggles to Monthly, filters to F&B category, clicks "Add Entry", records $4,500 for The Salty Fork on 2025-02-14, and the monthly F&B chart updates to reflect the new amount — all in under one minute.