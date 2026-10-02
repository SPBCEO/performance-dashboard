# Data Model

## properties
| Field | Type |
|------|------|
| id | uuid PK |
| name | text not null |
| user_id | uuid nullable |
| created_at | timestamptz |

## tenants
| Field | Type |
|------|------|
| id | uuid PK |
| property_id | uuid → properties(id) |
| name | text not null |
| category | text — `fb` / `non-fb` (CHECK constraint) |
| user_id | uuid nullable |
| created_at | timestamptz |

## turnover_entries
| Field | Type |
|------|------|
| id | uuid PK |
| tenant_id | uuid → tenants(id) |
| entry_date | date not null |
| amount | numeric(12,2) not null, ≥ 0 |
| source | text default `'manual'` |
| confidence | numeric nullable (0–1) |
| review_status | text default `'unreviewed'` |
| user_id | uuid nullable |
| created_at | timestamptz |

AI fields: `source` (`manual` / `ai-extracted`), `confidence` (0–1), `review_status` (`unreviewed` / `approved` / `rejected`). All null/default for manual entries.

## Relationships
- property 1—N tenants
- tenant 1—N turnover_entries

## Constraints
- `category` CHECK in (`fb`,`non-fb`)
- `amount` CHECK ≥ 0
- `entry_date` NOT NULL

## RLS (v1 — permissive, no login)
Every table: open SELECT + open write. Replaced with owner-scoped (`auth.uid() = user_id`) policies at lock-down sprint.