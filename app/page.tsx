import { AddEntryButton } from "@/components/AddEntryButton";
import { TrendChart } from "@/components/TrendChart";
import { aggregate, sum } from "@/lib/data/aggregate";
import { listEntries, listProperties, listTenants } from "@/lib/data/queries";
import { money } from "@/lib/format";

export default async function Overview() {
  const properties = await listProperties();
  const property = properties[0];
  if (!property) {
    return <p className="text-slate-600">No properties found.</p>;
  }
  const tenants = await listTenants(property.id);
  const entries = await listEntries(tenants.map((t) => t.id));
  const daily = aggregate(entries, tenants, "daily");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{property.name}</h1>
          <p className="text-sm text-slate-500">Total property turnover</p>
        </div>
        <AddEntryButton />
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-800">No turnover recorded yet</p>
          <p className="mt-1 text-sm text-slate-500">Add the first entry to see the trend.</p>
          <div className="mt-4"><AddEntryButton /></div>
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-3xl font-semibold text-slate-900">{money(sum(entries))}</div>
          <TrendChart data={daily} category="all" />
        </section>
      )}
    </div>
  );
}
