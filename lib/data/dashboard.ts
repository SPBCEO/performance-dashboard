import { requireTeam } from "@/lib/teams";
import { listEntries, listProperties, listTenants } from "./queries";
import {
  aggregate,
  latestDate,
  monthOverMonth,
  scoreTenant,
  STATUS_ORDER,
  type TenantPerformance,
} from "./aggregate";
import type { CategoryFilter, Period, Property, Tenant, TurnoverEntry } from "./types";

export function parsePeriod(v: string | string[] | undefined): Period {
  return v === "monthly" || v === "annual" || v === "daily" ? v : "daily";
}

export function parseCategory(v: string | string[] | undefined): CategoryFilter {
  return v === "fb" || v === "non-fb" ? v : "all";
}

export type DashboardData = {
  properties: Property[];
  property: Property | null;
  tenants: Tenant[];
  entries: TurnoverEntry[];
};

export async function loadDashboard(propertyParam?: string | string[]): Promise<DashboardData> {
  const { active } = await requireTeam();
  const properties = await listProperties(active.team_id);
  const wanted = Array.isArray(propertyParam) ? propertyParam[0] : propertyParam;
  const property = properties.find((p) => p.id === wanted) ?? properties[0] ?? null;
  if (!property) return { properties, property: null, tenants: [], entries: [] };
  const tenants = await listTenants(property.id, active.team_id);
  const entries = await listEntries(tenants.map((t) => t.id));
  return { properties, property, tenants, entries };
}

export type PeriodStat = {
  label: string;
  value: number;
  deltaPct: number | null;
  spark: { label: string; value: number }[];
};

export type TenantView = {
  tenant: Tenant;
  entryCount: number;
  annualTotal: number;
  /** trailing 12 calendar months ending at the property's latest month */
  ttmTotal: number;
  ttmCount: number;
  /** last 3 calendar months ending at the property's latest month (oldest first) */
  flow: number[];
  performance: TenantPerformance;
  periods: Record<Period, PeriodStat | null>;
};

function periodStat(entries: TurnoverEntry[], tenant: Tenant, period: Period): PeriodStat | null {
  const buckets = aggregate(entries, [tenant], period);
  if (buckets.length === 0) return null;
  const last = buckets[buckets.length - 1];
  const prev = buckets.length > 1 ? buckets[buckets.length - 2] : null;
  return {
    label: last.label,
    value: last.total,
    deltaPct: prev && prev.total > 0 ? ((last.total - prev.total) / prev.total) * 100 : null,
    spark: buckets.slice(-6).map((b) => ({ label: b.label, value: b.total })),
  };
}

/** Per-tenant view models: performance badge, annual turnover and latest-bucket stats per period. */
export function buildTenantViews(
  tenants: Tenant[],
  entries: TurnoverEntry[],
  anchorEntries: TurnoverEntry[] = entries,
): TenantView[] {
  // "Current" month/year is the property's latest recorded date, not the filtered subset's.
  const anchor = latestDate(anchorEntries);
  const anchorMonth = anchor ? anchor.slice(0, 7) : null;
  const anchorYear = anchor ? anchor.slice(0, 4) : null;
  const monthIdx = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
  const anchorIdx = anchor ? monthIdx(anchor) : null;
  const byTenant = new Map<string, TurnoverEntry[]>();
  for (const e of entries) {
    const list = byTenant.get(e.tenant_id);
    if (list) list.push(e);
    else byTenant.set(e.tenant_id, [e]);
  }
  const views = tenants.map<TenantView>((tenant) => {
    const own = byTenant.get(tenant.id) ?? [];
    const ttm =
      anchorIdx === null
        ? []
        : own.filter((e) => {
            const d = anchorIdx - monthIdx(e.entry_date);
            return d >= 0 && d <= 11;
          });
    const flow = [2, 1, 0].map((back) =>
      anchorIdx === null
        ? 0
        : own.filter((e) => monthIdx(e.entry_date) === anchorIdx - back).reduce((s, e) => s + e.amount, 0),
    );
    return {
      tenant,
      entryCount: own.length,
      annualTotal: own.filter((e) => e.entry_date.startsWith(anchorYear ?? "")).reduce((s, e) => s + e.amount, 0),
      ttmTotal: ttm.reduce((s, e) => s + e.amount, 0),
      ttmCount: ttm.length,
      flow,
      performance: scoreTenant(own, anchorMonth),
      periods: {
        daily: periodStat(own, tenant, "daily"),
        monthly: periodStat(own, tenant, "monthly"),
        annual: periodStat(own, tenant, "annual"),
      },
    };
  });
  // Ranked by annual turnover; underperforming tenants surface to the top.
  return views.sort(
    (a, b) =>
      (a.performance.status === "underperforming" ? 0 : 1) - (b.performance.status === "underperforming" ? 0 : 1) ||
      b.annualTotal - a.annualTotal ||
      a.tenant.name.localeCompare(b.tenant.name),
  );
}

export { monthOverMonth, STATUS_ORDER };
