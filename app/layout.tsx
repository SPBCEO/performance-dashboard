import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { EntryModalProvider } from "@/components/EntryModal";
import { listProperties } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";
import type { Property, Tenant } from "@/lib/data/types";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Performance Dashboard",
  description: "Tenant and property turnover by F&B / non-F&B across daily, monthly and annual periods.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1326",
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
    <html lang="en" className={`${hanken.variable} ${manrope.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen antialiased">
        <EntryModalProvider tenants={tenants} properties={properties}>
          <AppShell properties={properties}>{children}</AppShell>
        </EntryModalProvider>
      </body>
    </html>
  );
}
