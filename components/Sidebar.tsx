"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useEntryModal } from "./EntryModal";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/tenants", label: "Tenants" },
];

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { openAdd } = useEntryModal();

  const item = (active: boolean) =>
    `block w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
      active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <span className="font-semibold text-slate-900">Performance Dashboard</span>
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>
      <aside
        className={`${open ? "block" : "hidden"} border-b border-slate-200 bg-white p-4 md:sticky md:top-0 md:block md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r`}
      >
        <div className="mb-6 hidden px-3 md:block">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Turnover</div>
          <div className="text-lg font-semibold text-slate-900">Performance</div>
        </div>
        <nav className="space-y-1" onClick={() => setOpen(false)}>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={item(n.href === "/" ? pathname === "/" : pathname.startsWith(n.href))}
            >
              {n.label}
            </Link>
          ))}
          <button type="button" onClick={() => openAdd()} className={item(false)}>
            + Add Entry
          </button>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
