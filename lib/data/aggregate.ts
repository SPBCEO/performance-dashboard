import type {
  Category,
  CategoryFilter,
  Period,
  PerformanceStatus,
  Tenant,
  TurnoverEntry,
} from "./types";

export type Bucket = {
  key: string; // sortable: YYYY-MM-DD | YYYY-MM | YYYY
  label: string;
  fb: number;
  nonFb: number;
  total: number;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function bucketKey(date: string, period: Period): string {
  if (period === "daily") return date;
  if (period === "monthly") return date.slice(0, 7);
  return date.slice(0, 4);
}

export function bucketLabel(key: string, period: Period): string {
  if (period === "annual") return key;
  const [y, m, d] = key.split("-");
  const month = MONTHS[Number(m) - 1];
  if (period === "monthly") return `${month} ${y}`;
  return `${month} ${Number(d)}, ${y}`;
}

export function filterEntries(
  entries: TurnoverEntry[],
  tenants: Tenant[],
  category: CategoryFilter,
): TurnoverEntry[] {
  if (category === "all") return entries;
  const ids = new Set(tenants.filter((t) => t.category === category).map((t) => t.id));
  return entries.filter((e) => ids.has(e.tenant_id));
}

/** Sum entries into period buckets, split by category. Sorted ascending. */
export function aggregate(
  entries: TurnoverEntry[],
  tenants: Tenant[],
  period: Period,
): Bucket[] {
  const catById = new Map<string, Category>(tenants.map((t) => [t.id, t.category]));
  const map = new Map<string, Bucket>();
  for (const e of entries) {
    const cat = catById.get(e.tenant_id);
    if (!cat) continue;
    const key = bucketKey(e.entry_date, period);
    let b = map.get(key);
    if (!b) {
      b = { key, label: bucketLabel(key, period), fb: 0, nonFb: 0, total: 0 };
      map.set(key, b);
    }
    if (cat === "fb") b.fb += e.amount;
    else b.nonFb += e.amount;
    b.total += e.amount;
  }
  const buckets = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  return period === "monthly" ? fillMonths(buckets) : buckets;
}

/** Monthly view reads better with empty months kept in the series. */
function fillMonths(buckets: Bucket[]): Bucket[] {
  if (buckets.length < 2) return buckets;
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  const out: Bucket[] = [];
  let [y, m] = buckets[0].key.split("-").map(Number);
  const last = buckets[buckets.length - 1].key;
  for (;;) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push(byKey.get(key) ?? { key, label: bucketLabel(key, "monthly"), fb: 0, nonFb: 0, total: 0 });
    if (key >= last) break;
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

export function sum(entries: TurnoverEntry[]): number {
  return entries.reduce((s, e) => s + e.amount, 0);
}

export function latestDate(entries: TurnoverEntry[]): string | null {
  let max: string | null = null;
  for (const e of entries) if (!max || e.entry_date > max) max = e.entry_date;
  return max;
}

/** Month-over-month % change of the latest two months in a series (null if not computable). */
export function monthOverMonth(entries: TurnoverEntry[]): number | null {
  const months = new Map<string, number>();
  for (const e of entries) {
    const k = e.entry_date.slice(0, 7);
    months.set(k, (months.get(k) ?? 0) + e.amount);
  }
  const keys = [...months.keys()].sort();
  if (keys.length < 2) return null;
  const cur = months.get(keys[keys.length - 1])!;
  const prev = months.get(keys[keys.length - 2])!;
  if (prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

export type TenantPerformance = {
  status: PerformanceStatus;
  /** current month turnover / trailing-3-month average; null without a baseline */
  ratio: number | null;
  currentMonth: string | null;
};

/**
 * Rule-based score (docs/INTELLIGENCE_LAYER.md):
 * current month / trailing 3-month avg. >1.15 outperforming, 0.85–1.15 on-track, <0.85 underperforming.
 * "Current month" is the latest month with data in the property (anchorMonth); the trailing
 * average uses the up-to-3 months before it in which the tenant actually recorded turnover.
 */
export function scoreTenant(
  tenantEntries: TurnoverEntry[],
  anchorMonth: string | null,
): TenantPerformance {
  if (tenantEntries.length === 0 || !anchorMonth) {
    return { status: "no-data", ratio: null, currentMonth: anchorMonth };
  }
  const months = new Map<string, number>();
  for (const e of tenantEntries) {
    const k = e.entry_date.slice(0, 7);
    months.set(k, (months.get(k) ?? 0) + e.amount);
  }
  const prior = [...months.keys()]
    .filter((k) => k < anchorMonth)
    .sort()
    .slice(-3);
  if (prior.length === 0) {
    return { status: "no-baseline", ratio: null, currentMonth: anchorMonth };
  }
  const avg = prior.reduce((s, k) => s + months.get(k)!, 0) / prior.length;
  if (avg === 0) return { status: "no-baseline", ratio: null, currentMonth: anchorMonth };
  const ratio = (months.get(anchorMonth) ?? 0) / avg;
  const status: PerformanceStatus =
    ratio > 1.15 ? "outperforming" : ratio < 0.85 ? "underperforming" : "on-track";
  return { status, ratio, currentMonth: anchorMonth };
}

export const STATUS_ORDER: Record<PerformanceStatus, number> = {
  underperforming: 0,
  "no-baseline": 1,
  "on-track": 2,
  outperforming: 3,
  "no-data": 4,
};
