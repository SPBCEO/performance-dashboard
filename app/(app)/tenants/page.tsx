import { DashboardControls } from "@/components/Controls";
import { TenantList } from "@/components/TenantList";
import { buildTenantViews, loadDashboard, parseCategory, parsePeriod } from "@/lib/data/dashboard";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function TenantsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const category = parseCategory(sp.category);
  const { property, tenants, entries } = await loadDashboard(sp.property);

  if (!property) return <p className="text-on-surface-variant">No properties found.</p>;

  const fbCount = tenants.filter((t) => t.category === "fb").length;
  const visible = category === "all" ? tenants : tenants.filter((t) => t.category === category);
  const ids = new Set(visible.map((t) => t.id));
  const views = buildTenantViews(visible, entries.filter((e) => ids.has(e.tenant_id)), entries);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="label-caps text-primary">Tenants</span>
        <h1 className="font-headline text-2xl font-semibold text-on-surface">{property.name}</h1>
      </div>
      <DashboardControls
        period={period}
        category={category}
        counts={{ all: tenants.length, fb: fbCount, nonFb: tenants.length - fbCount }}
      />
      <TenantList views={views} period={period} title="All Tenants" subtitle="Underperforming first, then by annual turnover" />
    </div>
  );
}
