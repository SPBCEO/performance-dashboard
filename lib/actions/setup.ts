"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canEdit, getTeamContext } from "@/lib/teams";
import { UUID } from "@/lib/validation";
import type { Result } from "./teams";

async function requireEditor(): Promise<{ ok: true; teamId: string } | { ok: false; error: string }> {
  const ctx = await getTeamContext();
  if (!ctx.user) return { ok: false, error: "Please sign in again." };
  if (!ctx.active) return { ok: false, error: "Join or create a team first." };
  if (!canEdit(ctx.active.role)) return { ok: false, error: "Viewers can't change data." };
  return { ok: true, teamId: ctx.active.team_id };
}

const cleanName = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ");

export async function createProperty(name: string): Promise<Result> {
  const who = await requireEditor();
  if (!who.ok) return who;
  const n = cleanName(name);
  if (n.length < 1 || n.length > 80) return { ok: false, error: "Property name must be 1–80 characters." };
  const supabase = await createClient();
  const { error } = await supabase.from("properties").insert({ name: n, team_id: who.teamId });
  if (error) return { ok: false, error: "Could not add the property." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createTenant(input: { property_id: string; name: string; category: string }): Promise<Result> {
  const who = await requireEditor();
  if (!who.ok) return who;
  const n = cleanName(input.name);
  if (n.length < 1 || n.length > 80) return { ok: false, error: "Tenant name must be 1–80 characters." };
  if (input.category !== "fb" && input.category !== "non-fb") return { ok: false, error: "Choose F&B or Non-F&B." };
  if (!UUID.test(String(input.property_id ?? ""))) return { ok: false, error: "Choose a property." };
  const supabase = await createClient();
  // The property must belong to the active team; team_id on the tenant is derived by a database trigger.
  const { data: prop } = await supabase
    .from("properties")
    .select("id")
    .eq("id", input.property_id)
    .eq("team_id", who.teamId)
    .maybeSingle();
  if (!prop) return { ok: false, error: "That property isn't in your active team." };
  const { error } = await supabase.from("tenants").insert({ property_id: input.property_id, name: n, category: input.category });
  if (error) return { ok: false, error: "Could not add the tenant." };
  revalidatePath("/", "layout");
  return { ok: true };
}
