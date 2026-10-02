# Agentic Layer

## Draftable Actions (low risk — auto)
- Tag a tenant as underperforming / outperforming (badge only, no data change).
- Generate a monthly summary text block per tenant.

## Executable After Approval (medium risk)
- Create a turnover entry from a parsed free-text input → shows draft, CEO approves → persists.
- Update tenant category suggestion.

## Human-Only Actions (critical)
- Delete a turnover entry.
- Delete a tenant.
- Send a performance report externally.

## Named Tools
- `parse_turnover_text` — free text → structured draft (low).
- `create_entry_from_draft` — writes approved draft to DB (medium).
- `flag_underperforming` — sets badge (low).
- `delete_entry` — human-only (critical).

## Audit Log Fields
| Field | Type |
|------|------|
| id | uuid PK |
| actor | text (user / agent) |
| action | text |
| target_table | text |
| target_id | uuid |
| tool_name | text |
| risk_level | text |
| approved_by | uuid nullable |
| created_at | timestamptz |

## v1 vs Later
- **v1:** no agentic actions — manual CRUD only. Badges are computed, not agent-driven.
- **Later:** free-text parsing, draft approvals, audit logging.