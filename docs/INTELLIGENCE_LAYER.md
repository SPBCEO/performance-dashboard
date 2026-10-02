# Intelligence Layer

## Messy Inputs
- CEO enters turnover as free text ("Salty Fork made $4,500 on Feb 14") → structured into tenant + date + amount.
- Later: receipt photos → AI-extracted amounts.

## Auto-Structure Schema
```json
{
  "tenant_name": "The Salty Fork",
  "entry_date": "2025-02-14",
  "amount": 4500.00,
  "source": "manual",
  "confidence": 1.0,
  "review_status": "approved"
}
```

## Events to Track
- `entry_created` — new turnover recorded
- `entry_updated` / `entry_deleted`
- `period_changed` — user toggles daily/monthly/annual
- `category_filtered`

## Scoring Rules (rule-based v1)
- **Tenant performance score** = current month turnover / trailing 3-month avg.
  - > 1.15 → "outperforming"
  - 0.85–1.15 → "on-track"
  - < 0.85 → "underperforming" (flag)
- **Category trend** = month-over-month % change for F&B vs non-F&B.

## What Gets Ranked
Tenants ranked by annual turnover (default). Underperforming tenants surfaced to top.

## v1 vs Later
- **v1:** pure SQL aggregation + rule-based performance flags shown as badges.
- **Later:** AI-extracted amounts from receipts, predictive trend forecasts.