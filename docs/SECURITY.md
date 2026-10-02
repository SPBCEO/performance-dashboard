# Security

## Secret Handling
- Supabase URL + anon key in `NEXT_PUBLIC_` env vars (safe for frontend).
- Service role key server-side only — never exposed to client.
- No secrets in repo or committed `.env`.

## Permission Model
- **v1 (demo):** permissive RLS — all tables open read/write, no login required. Seed data renders for anonymous visitors.
- **Lock-down sprint:** owner-scoped RLS — `auth.uid() = user_id` on all tables. Users see only their properties/tenants/entries.
- Agent inherits the logged-in user's permissions — never elevated.

## Approved-Tools Rule
- Agent may only call explicitly named tools (`parse_turnover_text`, `create_entry_from_draft`, `flag_underperforming`, `delete_entry`).
- No raw `run_any` / `send_any` — every action is a bounded, audited function.
- Delete and external sends are human-only.

## Audit Principle
- Every meaningful write (create/update/delete entry, approve draft) logs actor, action, target, tool, risk level, timestamp.
- Logs are append-only — no mutation or deletion of audit rows.
- v1: manual CRUD has no agent actions to audit yet; audit table activated with the agentic layer.