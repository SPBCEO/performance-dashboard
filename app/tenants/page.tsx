import { AddEntryButton } from "@/components/AddEntryButton";
import { DashboardControls } from "@/components/Controls";
import { TenantCard } from "@/components/TenantCard";
import { buildTenantViews, loadDashboard, parseCategory, parsePeriod } from "@/lib/data/dashboard";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function TenantsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const category = parseCategory(sp.category);
  const { properties, property, tenants, entries } = await loadDashboard(sp.property);

  if (!property) {
    return <p className="text-slate-600">No properties found.</p>;
  }
  const visible = category === "all" ? tenants : tenants.filter((t) => t.category === category);
  const ids = new Set(visible.map((t) => t.id));
  const views = buildTenantViews(visible, entries.filter((e) => ids.has(e.tenant_id)), entries);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tenants</h1>
          <p className="text-sm text-slate-500">{property.name}</p>
        </div>
        <AddEntryButton />
      </div>
      <DashboardControls period={period} category={category} properties={properties} propertyId={property.id} />
      {views.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No tenants match this filter.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {views.map((v) => (
            <TenantCard key={`${v.tenant.id}-${period}`} view={v} initialPeriod={period} />
          ))}
        </div>
      )}
    </div>
  );
}
