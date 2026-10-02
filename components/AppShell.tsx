"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Property } from "@/lib/data/types";
import { useEntryModal } from "./EntryModal";
import { IconBuilding, IconOverview, IconPlus } from "./icons";
import { PropertySwitcher } from "./PropertySwitcher";

const NAV = [
  { href: "/", label: "Overview", Icon: IconOverview },
  { href: "/tenants", label: "Tenants", Icon: IconBuilding },
];

export function AppShell({ properties, children }: { properties: Property[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const { openAdd } = useEntryModal();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-surface">
      <header className="pt-safe fixed top-0 z-50 w-full bg-surface/85 shadow-[0_1px_8px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
            <PropertySwitcher properties={properties} />
          </div>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold ${
                  isActive(href) ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => openAdd()}
              className="ml-2 flex min-h-[44px] items-center gap-2 rounded-full bg-primary-container px-5 text-sm font-semibold text-on-primary-container hover:brightness-110 active:scale-95"
            >
              <IconPlus className="h-5 w-5" /> Record Turnover
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-20 md:pb-12">{children}</main>

      <nav
        aria-label="Primary"
        className="pb-safe fixed bottom-0 z-50 w-full bg-surface-container-low/90 shadow-[0_-2px_12px_rgba(0,0,0,0.5)] backdrop-blur-xl md:hidden"
      >
        <div className="flex h-16 items-center justify-around px-3">
          <NavLink {...NAV[0]} active={isActive("/")} />
          <div className="-translate-y-3">
            <button
              type="button"
              aria-label="Record turnover"
              onClick={() => openAdd()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-[0_4px_16px_rgba(217,119,7,0.35)] active:scale-95"
            >
              <IconPlus className="h-7 w-7" />
            </button>
          </div>
          <NavLink {...NAV[1]} active={isActive("/tenants")} />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label, Icon, active }: (typeof NAV)[number] & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[44px] min-w-[72px] flex-col items-center justify-center gap-0.5 ${
        active ? "font-semibold text-primary" : "text-on-surface-variant"
      }`}
    >
      <Icon className="h-[22px] w-[22px]" />
      <span className="text-xs">{label}</span>
    </Link>
  );
}
