"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { CategoryFilter, Period, Property } from "@/lib/data/types";

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

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === o.value ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
];

export function DashboardControls({
  period,
  category,
  properties,
  propertyId,
}: {
  period: Period;
  category: CategoryFilter;
  properties: Property[];
  propertyId: string;
}) {
  const { set, pending } = useParamSetter();
  return (
    <div className={`flex flex-wrap items-center gap-3 ${pending ? "opacity-70" : ""}`} aria-busy={pending}>
      <Segmented label="Period" value={period} options={PERIOD_OPTIONS} onChange={(v) => set("period", v)} />
      <Segmented
        label="Category"
        value={category}
        options={[
          { value: "all", label: "All" },
          { value: "fb", label: "F&B" },
          { value: "non-fb", label: "Non-F&B" },
        ]}
        onChange={(v) => set("category", v === "all" ? null : v)}
      />
      {properties.length > 1 ? (
        <select
          aria-label="Property"
          value={propertyId}
          onChange={(e) => set("property", e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

export function PeriodControl({ period }: { period: Period }) {
  const { set, pending } = useParamSetter();
  return (
    <div className={pending ? "opacity-70" : ""}>
      <Segmented label="Period" value={period} options={PERIOD_OPTIONS} onChange={(v) => set("period", v)} />
    </div>
  );
}
