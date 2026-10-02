export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EntryInput = {
  tenant_id: string;
  entry_date: string;
  amount: number | string;
};

export type Validated =
  | { ok: true; value: { tenant_id: string; entry_date: string; amount: number } }
  | { ok: false; error: string };

const MIN_DATE = "2000-01-01";

/** Latest allowed date = tomorrow (UTC), so a typo like 2205 can't become every chart's anchor. */
function maxDate(now: Date) {
  return new Date(now.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10);
}

export function validateEntry(input: EntryInput, now: Date = new Date()): Validated {
  if (!UUID.test(String(input.tenant_id ?? ""))) return { ok: false, error: "Choose a tenant." };

  const date = String(input.entry_date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    return { ok: false, error: "Enter a valid date." };
  }
  if (date < MIN_DATE || date > maxDate(now)) {
    return { ok: false, error: "Date must be between 2000 and today." };
  }

  const raw = typeof input.amount === "number" ? String(input.amount) : String(input.amount ?? "");
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return { ok: false, error: "Amount must be a number, 0 or more." };
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, error: "Amount must be 0 or more." };
  if (amount >= 1e10) return { ok: false, error: "Amount is too large." };

  return { ok: true, value: { tenant_id: input.tenant_id, entry_date: date, amount: Math.round(amount * 100) / 100 } };
}
