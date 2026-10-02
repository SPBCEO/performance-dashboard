"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type EntryInput = {
  tenant_id: string;
  entry_date: string;
  amount: number | string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validate(input: EntryInput):
  | { ok: true; value: { tenant_id: string; entry_date: string; amount: number } }
  | { ok: false; error: string } {
  if (!UUID.test(String(input.tenant_id ?? ""))) return { ok: false, error: "Choose a tenant." };
  const date = String(input.entry_date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return { ok: false, error: "Enter a valid date." };
  }
  if (new Date(date).toISOString().slice(0, 10) !== date) {
    return { ok: false, error: "Enter a valid date." };
  }
  const amount = typeof input.amount === "number" ? input.amount : Number(String(input.amount).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, error: "Amount must be 0 or more." };
  if (amount >= 1e10) return { ok: false, error: "Amount is too large." };
  return { ok: true, value: { tenant_id: input.tenant_id, entry_date: date, amount: Math.round(amount * 100) / 100 } };
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createEntry(input: EntryInput): Promise<ActionResult> {
  const v = validate(input);
  if (!v.ok) return v;
  const supabase = await createClient();
  const { error } = await supabase.from("turnover_entries").insert({ ...v.value, source: "manual" });
  if (error) return { ok: false, error: "Could not save the entry. Please try again." };
  refresh();
  return { ok: true };
}

export async function updateEntry(id: string, input: EntryInput): Promise<ActionResult> {
  if (!UUID.test(id)) return { ok: false, error: "Unknown entry." };
  const v = validate(input);
  if (!v.ok) return v;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnover_entries")
    .update(v.value)
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: "Could not update the entry. Please try again." };
  if (!data?.length) return { ok: false, error: "That entry no longer exists." };
  refresh();
  return { ok: true };
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  if (!UUID.test(id)) return { ok: false, error: "Unknown entry." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("turnover_entries").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: "Could not delete the entry. Please try again." };
  if (!data?.length) return { ok: false, error: "That entry no longer exists." };
  refresh();
  return { ok: true };
}
