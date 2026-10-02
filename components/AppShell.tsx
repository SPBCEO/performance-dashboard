"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Property } from "@/lib/data/types";
import type { Role } from "@/lib/teams-shared";
import { useEntryModal } from "./EntryModal";
import { IconBuilding, IconOverview, IconPlus, IconTeam } from "./icons";
import { PropertySwitcher } from "./PropertySwitcher";
import { TeamSwitcher } from "./TeamSwitcher";

const NAV = [
  { href: "/", label: "Overview", Icon: IconOverview },
  { href: "/tenants", label: "Tenants", Icon: IconBuilding },
  { href: "/team", label: "Team", Icon: IconTeam },
];

export function AppShell({
  properties,
  teams,
  activeTeamId,
  role,
  children,
}: {
  properties: Property[];
  teams: { id: string; name: string }[];
  activeTeamId: string;
  role: Role;
  email: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { openAdd, canEdit } = useEntryModal();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="min-h-dvh bg-surface">
      <header className="pt-safe fixed top-0 z-50 w-full bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 border-b border-white/5 px-4">
          <div className="flex min-w-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <PropertySwitcher properties={properties} />
              <TeamSwitcher teams={teams} activeTeamId={activeTeamId} role={role} />
            </div>
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
            {canEdit ? (
              <button
                type="button"
                onClick={() => openAdd()}
                className="ml-2 flex min-h-[44px] items-center gap-2 rounded-full bg-primary-container px-5 text-sm font-semibold text-on-primary-container hover:brightness-110 active:scale-95"
              >
                <IconPlus className="h-5 w-5" /> Record Turnover
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(5rem+env(safe-area-inset-top))] md:pb-12">
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="pb-safe fixed bottom-0 z-50 w-full border-t border-white/5 bg-surface-container-low/90 backdrop-blur-xl md:hidden"
      >
        <div className="flex h-16 items-center justify-around px-3">
          <NavLink {...NAV[0]} active={isActive("/")} />
          <NavLink {...NAV[1]} active={isActive("/tenants")} />
          {canEdit ? (
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
          ) : null}
          <NavLink {...NAV[2]} active={isActive("/team")} />
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
      {active ? <span className="h-0.5 w-4 rounded-full bg-primary" aria-hidden="true" /> : null}
    </Link>
  );
}
