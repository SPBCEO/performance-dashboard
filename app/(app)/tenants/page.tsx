import { DashboardControls } from "@/components/Controls";
import { SetupPanel } from "@/components/SetupPanel";
import { TenantList } from "@/components/TenantList";
import { buildTenantViews, loadDashboard, parseCategory, parsePeriod } from "@/lib/data/dashboard";

export const metadata = { title: "Tenants" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function TenantsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const category = parseCategory(sp.category);
  const { properties, property, tenants, entries } = await loadDashboard(sp.property);

  if (!property) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-headline text-2xl font-semibold text-on-surface">Tenants</h1>
        <p className="text-on-surface-variant">No properties yet. Add one to get started.</p>
        <SetupPanel properties={properties} defaultOpen />
      </div>
    );
  }

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
      <SetupPanel properties={properties} defaultOpen={tenants.length === 0} />
    </div>
  );
}
