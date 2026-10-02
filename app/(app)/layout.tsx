import { AppShell } from "@/components/AppShell";
import { EntryModalProvider } from "@/components/EntryModal";
import { listAllTenants, listProperties } from "@/lib/data/queries";
import { canEdit, requireTeam } from "@/lib/teams";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, memberships, active } = await requireTeam();

  // The shell stays up if the database hiccups so the page-level error boundary can offer Retry.
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let tenants: Awaited<ReturnType<typeof listAllTenants>> = [];
  try {
    [properties, tenants] = await Promise.all([listProperties(active.team_id), listAllTenants(active.team_id)]);
  } catch {
    /* the page itself will surface the error */
  }

  return (
    <EntryModalProvider tenants={tenants} properties={properties} canEdit={canEdit(active.role)}>
      <AppShell
        properties={properties}
        teams={memberships.map((m) => ({ id: m.team_id, name: m.team_name }))}
        activeTeamId={active.team_id}
        role={active.role}
        email={user.email}
      >
        {children}
      </AppShell>
    </EntryModalProvider>
  );
}
