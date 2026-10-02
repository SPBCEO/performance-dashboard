import { AddEntryButton } from "@/components/AddEntryButton";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { DashboardControls } from "@/components/Controls";
import { TenantCard } from "@/components/TenantCard";
import { TrendChart } from "@/components/TrendChart";
import { aggregate, filterEntries, monthOverMonth, sum } from "@/lib/data/aggregate";
import { buildTenantViews, loadDashboard, parseCategory, parsePeriod } from "@/lib/data/dashboard";
import { CATEGORY_LABEL } from "@/lib/data/types";
import { money } from "@/lib/format";

type SP = Promise<Record<string, string | string[] | undefined>>;

const PERIOD_NOUN = { daily: "day", monthly: "month", annual: "year" } as const;

export default async function Overview({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const category = parseCategory(sp.category);
  const { properties, property, tenants, entries } = await loadDashboard(sp.property);

  if (!property) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="font-medium text-slate-800">No properties found</p>
        <p className="mt-1 text-sm text-slate-500">Add a property to the database to start tracking turnover.</p>
      </div>
    );
  }

  const visibleTenants = category === "all" ? tenants : tenants.filter((t) => t.category === category);
  const visibleEntries = filterEntries(entries, tenants, category);
  const series = aggregate(visibleEntries, tenants, period);
  const last = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : null;
  const delta = last && prev && prev.total > 0 ? ((last.total - prev.total) / prev.total) * 100 : null;

  const fbIds = new Set(tenants.filter((t) => t.category === "fb").map((t) => t.id));
  const fbEntries = entries.filter((e) => fbIds.has(e.tenant_id));
  const nonFbEntries = entries.filter((e) => !fbIds.has(e.tenant_id));

  const views = buildTenantViews(visibleTenants, visibleEntries, entries);
  const emptyTenants = views.filter((v) => v.entryCount === 0).length;
  const filterLabel = category === "all" ? "All categories" : CATEGORY_LABEL[category];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{property.name}</h1>
          <p className="text-sm text-slate-500">Turnover performance</p>
        </div>
        <AddEntryButton />
      </div>

      <DashboardControls period={period} category={category} properties={properties} propertyId={property.id} />

      {tenants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-800">This property has no tenants yet</p>
          <p className="mt-1 text-sm text-slate-500">Tenants must exist before turnover can be recorded.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-800">No turnover recorded yet</p>
          <p className="mt-1 text-sm text-slate-500">Add the first entry to see the trend.</p>
          <div className="mt-4"><AddEntryButton /></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label={`Total turnover · ${filterLabel}`} value={money(sum(visibleEntries))} />
            <Kpi
              label={last ? `Latest ${PERIOD_NOUN[period]} · ${last.label}` : `Latest ${PERIOD_NOUN[period]}`}
              value={last ? money(last.total) : "—"}
              delta={delta}
            />
            <Kpi
              label="F&B share of turnover"
              value={entries.length ? `${Math.round((sum(fbEntries) / Math.max(sum(entries), 1)) * 100)}%` : "—"}
            />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">
              Turnover trend · {period[0].toUpperCase() + period.slice(1)} · {filterLabel}
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              {period === "daily" ? "Days with recorded turnover" : "Sum of recorded turnover per " + PERIOD_NOUN[period]}
            </p>
            {series.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-500">No turnover recorded for this filter.</p>
            ) : (
              <TrendChart data={series} category={category} />
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">F&B vs non-F&B</h2>
            <CategoryBreakdown
              fb={{ total: sum(fbEntries), momPct: monthOverMonth(fbEntries) }}
              nonFb={{ total: sum(nonFbEntries), momPct: monthOverMonth(nonFbEntries) }}
            />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Tenants · {filterLabel}</h2>
            {emptyTenants > 0 ? (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
                {emptyTenants} of {views.length} tenants have no turnover recorded yet.
              </p>
            ) : null}
            {views.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No {filterLabel} tenants in this property.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {views.map((v) => (
                  <TenantCard key={`${v.tenant.id}-${period}`} view={v} initialPeriod={period} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta?: number | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {delta !== null && delta !== undefined ? (
        <div className={`text-xs ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs prior
        </div>
      ) : null}
    </div>
  );
}
