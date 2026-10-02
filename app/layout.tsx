import type { Metadata } from "next";
import "./globals.css";
import { EntryModalProvider } from "@/components/EntryModal";
import { Sidebar } from "@/components/Sidebar";
import { listProperties } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";
import type { Property, Tenant } from "@/lib/data/types";

export const metadata: Metadata = {
  title: "Performance Dashboard",
  description: "Tenant and property turnover by F&B / non-F&B across daily, monthly and annual periods.",
};

export const dynamic = "force-dynamic";

// The shell must render even when the database is unreachable so the page-level
// error boundary can show a retryable banner; the modal just has no tenants then.
async function loadShellData(): Promise<{ properties: Property[]; tenants: Tenant[] }> {
  try {
    const supabase = await createClient();
    const [properties, tenantRes] = await Promise.all([
      listProperties(),
      supabase.from("tenants").select("id,property_id,name,category").order("name"),
    ]);
    if (tenantRes.error) throw tenantRes.error;
    return { properties, tenants: (tenantRes.data ?? []) as Tenant[] };
  } catch {
    return { properties: [], tenants: [] };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { properties, tenants } = await loadShellData();
  return (
    <html lang="en">
      <body className="antialiased text-slate-900">
        <EntryModalProvider tenants={tenants} properties={properties}>
          <Sidebar>{children}</Sidebar>
        </EntryModalProvider>
      </body>
    </html>
  );
}
