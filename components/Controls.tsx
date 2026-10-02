"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { CategoryFilter, Period } from "@/lib/data/types";

function useParamSetter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  return { set, pending };
}

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
];

function PeriodToggle({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div role="group" aria-label="Period" className="flex items-center rounded-xl bg-surface-container-lowest p-1 shadow-inner">
      {PERIOD_OPTIONS.map((o) => {
        const on = period === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`min-h-[44px] flex-1 rounded-lg px-4 text-xs font-medium transition-all active:scale-95 ${
              on ? "bg-surface-container-highest font-semibold text-on-surface shadow-sm" : "text-on-surface-variant"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function DashboardControls({
  period,
  category,
  counts,
}: {
  period: Period;
  category: CategoryFilter;
  counts: { all: number; fb: number; nonFb: number };
}) {
  const { set, pending } = useParamSetter();
  const pills: { value: CategoryFilter; label: string; count: number; dot?: string; on: string }[] = [
    { value: "all", label: "All Categories", count: counts.all, on: "bg-primary text-on-primary" },
    { value: "fb", label: "F&B Sector", count: counts.fb, dot: "bg-primary-container", on: "bg-primary-container text-on-primary-container" },
    { value: "non-fb", label: "Non-F&B / Retail", count: counts.nonFb, dot: "bg-secondary", on: "bg-secondary text-on-secondary" },
  ];
  return (
    <div className={`flex flex-col gap-1 ${pending ? "opacity-70" : ""}`} aria-busy={pending}>
      <div className="md:max-w-md"><PeriodToggle period={period} onChange={(v) => set("period", v)} /></div>
      <div role="group" aria-label="Category" className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
        {pills.map((p) => {
          const on = category === p.value;
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={on}
              onClick={() => set("category", p.value === "all" ? null : p.value)}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 text-xs transition-all ${
                on ? `${p.on} font-semibold shadow-sm` : "bg-surface-container text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {p.dot && !on ? <span className={`h-2 w-2 rounded-full ${p.dot}`} /> : null}
              <span>{p.label}</span>
              <span className={`metric text-xs ${on ? "rounded-full bg-black/20 px-1.5 py-0.5" : "opacity-70"}`}>
                {on ? p.count : `(${p.count})`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PeriodControl({ period }: { period: Period }) {
  const { set, pending } = useParamSetter();
  return (
    <div className={`md:max-w-xs ${pending ? "opacity-70" : ""}`}>
      <PeriodToggle period={period} onChange={(v) => set("period", v)} />
    </div>
  );
}
