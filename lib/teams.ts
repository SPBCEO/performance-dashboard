import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "admin" | "viewer";
export type Membership = { team_id: string; role: Role; team_name: string };

export const ACTIVE_TEAM_COOKIE = "active_team";

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", viewer: "Viewer" };

export type TeamContext = {
  user: { id: string; email: string | null } | null;
  memberships: Membership[];
  active: Membership | null;
};

/** One lookup per request: the signed-in user, their teams, and the active team (cookie, verified against membership). */
export const getTeamContext = cache(async (): Promise<TeamContext> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user ? { id: auth.user.id, email: auth.user.email ?? null } : null;
  if (!user) return { user: null, memberships: [], active: null };

  const { data, error } = await supabase
    .from("team_members")
    .select("team_id, role, teams(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Could not load your teams");

  const memberships: Membership[] = (data ?? []).map((r) => {
    const t = r.teams as unknown as { name: string } | { name: string }[] | null;
    const name = Array.isArray(t) ? t[0]?.name : t?.name;
    return { team_id: r.team_id as string, role: r.role as Role, team_name: name ?? "Team" };
  });

  const wanted = (await cookies()).get(ACTIVE_TEAM_COOKIE)?.value;
  const active = memberships.find((m) => m.team_id === wanted) ?? memberships[0] ?? null;
  return { user, memberships, active };
});

/** For pages: must be signed in and in a team, otherwise send them where they can fix that. */
export async function requireTeam() {
  const ctx = await getTeamContext();
  if (!ctx.user) redirect("/login");
  if (!ctx.active) redirect("/onboarding");
  return { ...ctx, active: ctx.active, user: ctx.user };
}

export const canEdit = (role: Role) => role === "owner" || role === "admin";
