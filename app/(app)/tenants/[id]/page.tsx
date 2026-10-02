import Link from "next/link";
import { notFound } from "next/navigation";
import { AddEntryButton } from "@/components/AddEntryButton";
import { PeriodControl } from "@/components/Controls";
import { EntryRowActions } from "@/components/EntryRowActions";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart } from "@/components/TrendChart";
import { aggregate, sum } from "@/lib/data/aggregate";
import { buildTenantViews, parsePeriod } from "@/lib/data/dashboard";
import { getTenant, listEntries, listTenants } from "@/lib/data/queries";
import { requireTeam } from "@/lib/teams";
import { CATEGORY_LABEL } from "@/lib/data/types";
import { formatDate, moneyExact } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { title: "Tenant" };
  const { active } = await requireTeam();
  const tenant = await getTenant(id, active.team_id);
  return { title: tenant?.name ?? "Tenant" };
}

type SP = Promise<Record<string, string | string[] | undefined>>;
const card = "rounded-xl bg-surface-container-low p-4 shadow-md ring-1 ring-white/5";

export default async function TenantDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  const period = parsePeriod((await searchParams).period);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { active } = await requireTeam();
  const tenant = await getTenant(id, active.team_id);
  if (!tenant) notFound();

  // Performance anchors on the property's latest month, so score against the whole property.
  const entries = await listEntries([tenant.id]);
  const propertyEntries = await listPropertyEntries(tenant.property_id, active.team_id);
  const [view] = buildTenantViews([tenant], entries, propertyEntries);
  const series = aggregate(entries, [tenant], period);
  const newestFirst = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date));

  return (
    <div className="flex flex-col gap-4">
      <Link href="/tenants" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:underline">
        ← All tenants
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="label-caps text-primary">{CATEGORY_LABEL[tenant.category]}</span>
          <h1 className="truncate font-headline text-2xl font-semibold text-on-surface">{tenant.name}</h1>
        </div>
        <StatusBadge performance={view.performance} showDetail />
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant p-10 text-center">
          <p className="font-semibold text-on-surface">No turnover recorded yet</p>
          <div className="mt-4 flex justify-center">
            <AddEntryButton
              tenantId={tenant.id}
              className="min-h-[48px] rounded-full bg-primary-container px-5 text-sm font-semibold text-on-primary-container"
            >
              Record Turnover
            </AddEntryButton>
          </div>
        </div>
      ) : (
        <>
          <section className={`${card} flex flex-col gap-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="label-caps text-on-surface-variant">Total Turnover</span>
                <div className="metric text-[26px] font-bold leading-8 text-on-surface">{moneyExact(sum(entries))}</div>
              </div>
              <div className="w-full sm:w-72"><PeriodControl period={period} /></div>
            </div>
            <TrendChart data={series} category={tenant.category} />
          </section>

          <section className="overflow-hidden rounded-xl bg-surface-container-low ring-1 ring-white/5">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
              <h2 className="font-headline text-lg font-semibold text-on-surface">Entries</h2>
              <AddEntryButton
                tenantId={tenant.id}
                className="min-h-[44px] px-2 text-sm font-semibold text-primary hover:underline"
              >
                + Record
              </AddEntryButton>
            </div>
            <ul>
              {newestFirst.map((e) => (
                <li key={e.id} className="flex min-h-[56px] items-center justify-between gap-3 border-b border-white/5 px-4 last:border-b-0 odd:bg-surface-container-lowest/30">
                  <div>
                    <div className="text-sm text-on-surface">{formatDate(e.entry_date)}</div>
                    <div className="metric text-[13px] font-semibold text-on-surface">{moneyExact(e.amount)}</div>
                  </div>
                  <EntryRowActions entry={e} tenantName={tenant.name} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

async function listPropertyEntries(propertyId: string, teamId: string) {
  const tenants = await listTenants(propertyId, teamId);
  return listEntries(tenants.map((t) => t.id));
}
