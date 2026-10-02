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
import { CATEGORY_LABEL } from "@/lib/data/types";
import { formatDate, money, moneyExact } from "@/lib/format";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function TenantDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  const period = parsePeriod((await searchParams).period);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const tenant = await getTenant(id);
  if (!tenant) notFound();

  // Performance anchors on the property's latest month, so score against the whole property.
  const entries = await listEntries([tenant.id]);
  const propertyEntries = await listPropertyEntries(tenant.property_id);
  const [view] = buildTenantViews([tenant], entries, propertyEntries);
  const series = aggregate(entries, [tenant], period);
  const newestFirst = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/tenants" className="text-sm text-indigo-600 hover:underline">← All tenants</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">{tenant.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{CATEGORY_LABEL[tenant.category]}</span>
            <StatusBadge performance={view.performance} showDetail />
          </div>
        </div>
        <AddEntryButton tenantId={tenant.id} />
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-800">No turnover recorded yet</p>
          <div className="mt-4"><AddEntryButton tenantId={tenant.id} /></div>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500">Total turnover</div>
                <div className="text-2xl font-semibold text-slate-900">{money(sum(entries))}</div>
              </div>
              <PeriodControl period={period} />
            </div>
            <TrendChart data={series} category={tenant.category} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Entries</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Date</th>
                  <th className="px-5 py-2 text-right font-medium">Amount</th>
                  <th className="px-5 py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {newestFirst.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-2.5 text-slate-800">{formatDate(e.entry_date)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-slate-900">{moneyExact(e.amount)}</td>
                    <td className="px-5 py-2.5">
                      <EntryRowActions entry={e} tenantName={tenant.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}

async function listPropertyEntries(propertyId: string) {
  const tenants = await listTenants(propertyId);
  return listEntries(tenants.map((t) => t.id));
}
