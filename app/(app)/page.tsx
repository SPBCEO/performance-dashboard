import { AddEntryButton } from "@/components/AddEntryButton";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { DashboardControls } from "@/components/Controls";
import { IconArrowDown, IconArrowUp, IconPlus } from "@/components/icons";
import { TenantList } from "@/components/TenantList";
import { TrendChart } from "@/components/TrendChart";
import { aggregate, filterEntries, latestDate, monthOverMonth, sum } from "@/lib/data/aggregate";
import { buildTenantViews, loadDashboard, parseCategory, parsePeriod } from "@/lib/data/dashboard";
import { CATEGORY_LABEL } from "@/lib/data/types";
import { formatDate, money, moneyCompact, moneyExact } from "@/lib/format";

type SP = Promise<Record<string, string | string[] | undefined>>;

const NOUN = { daily: "day", monthly: "month", annual: "year" } as const;
const card = "rounded-xl bg-surface-container-low p-4 shadow-md ring-1 ring-white/5";

export default async function Overview({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const category = parseCategory(sp.category);
  const { property, tenants, entries } = await loadDashboard(sp.property);

  if (!property) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-outline-variant p-10 text-center">
        <p className="font-semibold text-on-surface">No properties found</p>
        <p className="mt-1 text-sm text-on-surface-variant">Add a property to the database to start tracking turnover.</p>
      </div>
    );
  }

  const fbTenants = tenants.filter((t) => t.category === "fb");
  const visibleTenants = category === "all" ? tenants : tenants.filter((t) => t.category === category);
  const visibleEntries = filterEntries(entries, tenants, category);
  const series = aggregate(visibleEntries, tenants, period);
  const last = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : null;
  const delta = last && prev && prev.total > 0 ? ((last.total - prev.total) / prev.total) * 100 : null;

  const fbIds = new Set(fbTenants.map((t) => t.id));
  const fbEntries = entries.filter((e) => fbIds.has(e.tenant_id));
  const nonFbEntries = entries.filter((e) => !fbIds.has(e.tenant_id));
  const fbTotal = sum(fbEntries);
  const nonFbTotal = sum(nonFbEntries);
  const grand = fbTotal + nonFbTotal;
  const fbShare = grand > 0 ? (fbTotal / grand) * 100 : 0;

  const views = buildTenantViews(visibleTenants, visibleEntries, entries);
  const filterLabel = category === "all" ? "All categories" : CATEGORY_LABEL[category];
  const through = latestDate(entries);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="label-caps text-primary">Executive Overview</span>
            <div className="mt-0.5 text-xs text-on-surface-variant">
              Portfolio Asset <span className="text-outline">•</span>{" "}
              <span className="font-medium text-tertiary">
                {tenants.length} {tenants.length === 1 ? "Tenant" : "Tenants"}
              </span>
            </div>
          </div>
          {through ? (
            <div className="metric rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface">
              Data to {formatDate(through)}
            </div>
          ) : null}
        </div>
        <DashboardControls
          period={period}
          category={category}
          counts={{ all: tenants.length, fb: fbTenants.length, nonFb: tenants.length - fbTenants.length }}
        />
      </section>

      {tenants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant p-10 text-center">
          <p className="font-semibold text-on-surface">This property has no tenants yet</p>
          <p className="mt-1 text-sm text-on-surface-variant">Tenants must exist before turnover can be recorded.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant p-10 text-center">
          <p className="font-semibold text-on-surface">No turnover recorded yet</p>
          <p className="mt-1 text-sm text-on-surface-variant">Record the first entry to see the trend.</p>
          <div className="mt-4 flex justify-center">
            <AddEntryButton className="flex min-h-[48px] items-center gap-2 rounded-full bg-primary-container px-5 text-sm font-semibold text-on-primary-container">
              <IconPlus className="h-5 w-5" /> Record Turnover
            </AddEntryButton>
          </div>
        </div>
      ) : (
        <>
          <section className={`${card} flex flex-col gap-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="label-caps text-on-surface-variant">Total Gross Turnover{category === "all" ? "" : ` · ${filterLabel}`}</span>
                <div className="metric mt-1 text-[26px] font-bold leading-8 tracking-tight text-on-surface md:text-4xl md:leading-10">
                  {moneyExact(sum(visibleEntries))}
                </div>
              </div>
              {delta !== null ? (
                <div className={`metric flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${delta >= 0 ? "bg-tertiary/15 text-tertiary" : "bg-error-container text-on-error-container"}`}>
                  {delta >= 0 ? <IconArrowUp className="h-4 w-4" /> : <IconArrowDown className="h-4 w-4" />}
                  {delta >= 0 ? "+" : "−"}{Math.abs(delta).toFixed(1)}%
                </div>
              ) : null}
            </div>
            {last ? (
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-on-surface-variant">
                <span>Latest {NOUN[period]} · {last.label}:</span>
                <span className="metric font-medium text-on-surface">{money(last.total)}</span>
                {prev ? (
                  <>
                    <span>•</span>
                    <span>vs. prior {NOUN[period]} ({last.total - prev.total >= 0 ? "+" : "−"}{money(Math.abs(last.total - prev.total))})</span>
                  </>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 whitespace-nowrap font-medium text-on-surface">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-primary-container" />
                  F&amp;B {fbShare.toFixed(1)}% <span className="metric text-on-surface-variant">{moneyCompact(fbTotal)}</span>
                </span>
                <span className="flex items-center gap-1.5 whitespace-nowrap font-medium text-on-surface">
                  <span className="metric text-on-surface-variant">{moneyCompact(nonFbTotal)}</span> {(100 - fbShare).toFixed(1)}% Non-F&amp;B
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-secondary" />
                </span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-highest shadow-inner" role="img" aria-label={`F&B ${fbShare.toFixed(0)} percent of turnover`}>
                <div className="h-full bg-primary-container" style={{ width: `${fbShare}%` }} />
                <div className="h-full bg-secondary" style={{ width: `${100 - fbShare}%` }} />
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-5">
            <section className={`${card} flex flex-col gap-3 lg:col-span-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="label-caps text-on-surface-variant">Revenue Dynamics · {period[0].toUpperCase() + period.slice(1)}</span>
                  <h2 className="font-headline text-xl font-semibold tracking-tight text-on-surface">Turnover Trajectory</h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary-container" />F&amp;B</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary" />Non-F&amp;B</span>
                </div>
              </div>
              {series.length === 0 ? (
                <p className="py-16 text-center text-sm text-on-surface-variant">No turnover recorded for this filter.</p>
              ) : (
                <TrendChart data={series} category={category} />
              )}
              <p className="text-xs text-on-surface-variant">
                {period === "daily" ? "Days with recorded turnover" : `Sum of recorded turnover per ${NOUN[period]}`}
              </p>
            </section>
            <section className={`${card} lg:col-span-2`}>
              <CategoryBreakdown
                fb={{ total: fbTotal, momPct: monthOverMonth(fbEntries), tenants: fbTenants.length }}
                nonFb={{ total: nonFbTotal, momPct: monthOverMonth(nonFbEntries), tenants: tenants.length - fbTenants.length }}
              />
            </section>
          </div>

          <TenantList
            views={views}
            period={period}
            title="Tenant Performance"
            subtitle="Underperforming first, then by annual turnover"
          />

</>
      )}
    </div>
  );
}
