"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canEdit, getTeamContext } from "@/lib/teams";
import { UUID, validateEntry, type EntryInput } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Signed in, in a team, and allowed to write (owner/admin). The database enforces the same via RLS. */
async function requireEditor(): Promise<{ ok: true; teamId: string } | { ok: false; error: string }> {
  const ctx = await getTeamContext();
  if (!ctx.user) return { ok: false, error: "Please sign in again." };
  if (!ctx.active) return { ok: false, error: "Join or create a team first." };
  if (!canEdit(ctx.active.role)) return { ok: false, error: "Viewers can't change data." };
  return { ok: true, teamId: ctx.active.team_id };
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createEntry(input: EntryInput): Promise<ActionResult> {
  const who = await requireEditor();
  if (!who.ok) return who;
  const v = validateEntry(input);
  if (!v.ok) return v;
  const supabase = await createClient();
  // The tenant must belong to the active team.
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", v.value.tenant_id)
    .eq("team_id", who.teamId)
    .maybeSingle();
  if (!tenant) return { ok: false, error: "That tenant isn't in your active team." };
  const { error } = await supabase.from("turnover_entries").insert({ ...v.value, source: "manual" });
  if (error) return { ok: false, error: "Could not save the entry. Please try again." };
  refresh();
  return { ok: true };
}

export async function updateEntry(id: string, input: EntryInput): Promise<ActionResult> {
  const who = await requireEditor();
  if (!who.ok) return who;
  if (!UUID.test(id)) return { ok: false, error: "Unknown entry." };
  const v = validateEntry(input);
  if (!v.ok) return v;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnover_entries")
    .update(v.value)
    .eq("id", id)
    .eq("team_id", who.teamId)
    .select("id");
  if (error) return { ok: false, error: "Could not update the entry. Please try again." };
  if (!data?.length) return { ok: false, error: "That entry no longer exists." };
  refresh();
  return { ok: true };
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  const who = await requireEditor();
  if (!who.ok) return who;
  if (!UUID.test(id)) return { ok: false, error: "Unknown entry." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnover_entries")
    .delete()
    .eq("id", id)
    .eq("team_id", who.teamId)
    .select("id");
  if (error) return { ok: false, error: "Could not delete the entry. Please try again." };
  if (!data?.length) return { ok: false, error: "That entry no longer exists." };
  refresh();
  return { ok: true };
}
