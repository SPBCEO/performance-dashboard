"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_TEAM_COOKIE, getTeamContext, type Role } from "@/lib/teams";
import { UUID } from "@/lib/validation";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

// Not httpOnly on purpose: it only names the active team (the server re-verifies membership on every request),
// and the client compares it to detect a team switch made in another tab.
const COOKIE_OPTS = { httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };

async function setActive(teamId: string) {
  (await cookies()).set(ACTIVE_TEAM_COOKIE, teamId, COOKIE_OPTS);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ACTIVE_TEAM_COOKIE);
  redirect("/login");
}

export async function setActiveTeam(teamId: string): Promise<Result> {
  const ctx = await getTeamContext();
  if (!UUID.test(teamId) || !ctx.memberships.some((m) => m.team_id === teamId)) {
    return { ok: false, error: "You are not a member of that team." };
  }
  await setActive(teamId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createTeam(name: string): Promise<Result> {
  const clean = String(name ?? "").trim();
  if (clean.length < 1 || clean.length > 80) return { ok: false, error: "Team name must be 1–80 characters." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_team", { p_name: clean });
  if (error || !data) return { ok: false, error: "Could not create the team." };
  await setActive(data as string);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function claimDemoTeam(): Promise<Result> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_demo_team");
  if (error || !data) return { ok: false, error: "Could not claim the Demo team." };
  const ctx = await getTeamContext();
  if (!ctx.memberships.some((m) => m.team_id === data)) {
    return { ok: false, error: "The Demo team already has an owner. Ask them to invite you." };
  }
  await setActive(data as string);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function acceptInvite(token: string): Promise<Result> {
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(String(token ?? ""))) return { ok: false, error: "This invite link is not valid." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error || !data) return { ok: false, error: "This invite is invalid, expired or already used." };
  await setActive(data as string);
  revalidatePath("/", "layout");
  return { ok: true };
}

async function requireTeamRole(roles: Role[]) {
  const ctx = await getTeamContext();
  if (!ctx.user || !ctx.active) return null;
  return roles.includes(ctx.active.role) ? ctx : null;
}

/** Returns the raw token ONCE; only its SHA-256 hash is stored. */
export async function createInvite(role: "admin" | "viewer", days: number): Promise<Result<{ token: string; id: string }>> {
  const ctx = await requireTeamRole(["owner", "admin"]);
  if (!ctx) return { ok: false, error: "Only owners and admins can invite people." };
  if (role !== "admin" && role !== "viewer") return { ok: false, error: "Invalid role." };
  const ttl = Math.min(Math.max(Math.floor(days) || 7, 1), 30);
  const token = randomBytes(24).toString("base64url");
  const supabase = await createClient();
  const { data, error } = await supabase.from("team_invites").insert({
    team_id: ctx.active!.team_id,
    role,
    token_hash: createHash("sha256").update(token).digest("hex"),
    expires_at: new Date(Date.now() + ttl * 86400_000).toISOString(),
    max_uses: 1,
  }).select("id").single();
  if (error || !data) return { ok: false, error: "Could not create the invite." };
  revalidatePath("/team");
  return { ok: true, token, id: data.id as string };
}

export async function revokeInvite(id: string): Promise<Result> {
  const ctx = await requireTeamRole(["owner", "admin"]);
  if (!ctx || !UUID.test(id)) return { ok: false, error: "Not allowed." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("team_id", ctx.active!.team_id);
  if (error) return { ok: false, error: "Could not revoke the invite." };
  revalidatePath("/team");
  return { ok: true };
}

export async function changeMemberRole(userId: string, role: Role): Promise<Result> {
  const ctx = await requireTeamRole(["owner"]);
  if (!ctx || !UUID.test(userId) || !["owner", "admin", "viewer"].includes(role)) {
    return { ok: false, error: "Only owners can change roles." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .update({ role })
    .eq("team_id", ctx.active!.team_id)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { ok: false, error: /owner/i.test(error.message) ? "A team must keep at least one owner." : "Could not change the role." };
  if (!data?.length) return { ok: false, error: "Member not found." };
  revalidatePath("/team");
  return { ok: true };
}

export async function removeMember(userId: string): Promise<Result> {
  const ctx = await getTeamContext();
  if (!ctx.user || !ctx.active || !UUID.test(userId)) return { ok: false, error: "Not allowed." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", ctx.active.team_id)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { ok: false, error: /owner/i.test(error.message) ? "A team must keep at least one owner." : "Could not remove the member." };
  if (!data?.length) return { ok: false, error: "You don't have permission to remove that member." };
  if (userId === ctx.user.id) (await cookies()).delete(ACTIVE_TEAM_COOKIE);
  revalidatePath("/", "layout");
  return { ok: true };
}
