import { createClient } from "@/lib/supabase/server";
import type { Property, Tenant, TurnoverEntry } from "./types";

const PAGE = 1000; // PostgREST default row cap per request

// Every read is scoped to the active team here AND by row-level security in the database.

export async function listProperties(teamId: string): Promise<Property[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id,name")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error("Could not load properties");
  return data ?? [];
}

export async function listAllTenants(teamId: string): Promise<Tenant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id,property_id,name,category")
    .eq("team_id", teamId)
    .order("name", { ascending: true });
  if (error) throw new Error("Could not load tenants");
  return (data ?? []) as Tenant[];
}

export async function listTenants(propertyId: string, teamId: string): Promise<Tenant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id,property_id,name,category")
    .eq("property_id", propertyId)
    .eq("team_id", teamId)
    .order("name", { ascending: true });
  if (error) throw new Error("Could not load tenants");
  return (data ?? []) as Tenant[];
}

export async function getTenant(tenantId: string, teamId: string): Promise<Tenant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id,property_id,name,category")
    .eq("id", tenantId)
    .eq("team_id", teamId)
    .maybeSingle();
  if (error) throw new Error("Could not load tenant");
  return (data as Tenant | null) ?? null;
}

/** All turnover entries for the given tenants, paged past the 1000-row cap. */
export async function listEntries(tenantIds: string[]): Promise<TurnoverEntry[]> {
  if (tenantIds.length === 0) return [];
  const supabase = await createClient();
  const out: TurnoverEntry[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("turnover_entries")
      .select("id,tenant_id,entry_date,amount")
      .in("tenant_id", tenantIds)
      .order("entry_date", { ascending: true })
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error("Could not load entries");
    const rows = (data ?? []).map((r) => ({
      id: r.id as string,
      tenant_id: r.tenant_id as string,
      entry_date: r.entry_date as string,
      amount: Number(r.amount),
    }));
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}
