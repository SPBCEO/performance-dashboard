import { createClient } from "@/lib/supabase/server";
import { canEdit, requireTeam, type Role } from "@/lib/teams";
import { TeamManager, type InviteRow, type MemberRow } from "./TeamManager";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const { user, active } = await requireTeam();
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("team_members")
    .select("user_id, role, created_at")
    .eq("team_id", active.team_id)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Could not load team members");

  // Emails come from profiles (migration 0003); fall back to a short id if it isn't applied yet.
  const ids = (members ?? []).map((m) => m.user_id as string);
  const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", ids);
  const emailById = new Map((profiles ?? []).map((p) => [p.id as string, p.email as string | null]));

  const rows: MemberRow[] = (members ?? []).map((m) => ({
    user_id: m.user_id as string,
    role: m.role as Role,
    email: emailById.get(m.user_id as string) ?? `User ${(m.user_id as string).slice(0, 8)}`,
    isYou: m.user_id === user.id,
  }));

  let invites: InviteRow[] = [];
  if (canEdit(active.role)) {
    const { data } = await supabase
      .from("team_invites")
      .select("id, role, expires_at, used_count, max_uses, revoked_at")
      .eq("team_id", active.team_id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    invites = (data ?? [])
      .filter((i) => new Date(i.expires_at as string) > new Date() && (i.used_count as number) < (i.max_uses as number))
      .map((i) => ({ id: i.id as string, role: i.role as "admin" | "viewer", expires_at: i.expires_at as string }));
  }

  return (
    <TeamManager teamName={active.team_name} myRole={active.role} members={rows} invites={invites} />
  );
}
