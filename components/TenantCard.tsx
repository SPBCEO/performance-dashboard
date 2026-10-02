"use client";

import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/format";
import { CATEGORY_LABEL, type Period } from "@/lib/data/types";
import type { TenantView } from "@/lib/data/dashboard";
import { AddEntryButton } from "./AddEntryButton";
import { PERIOD_OPTIONS } from "./Controls";
import { StatusBadge } from "./StatusBadge";

function Spark({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <svg viewBox={`0 0 ${data.length * 12} 32`} className="h-8 w-full" role="img" aria-label="Recent turnover">
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / max) * 30);
        return <rect key={i} x={i * 12 + 1} y={32 - h} width="9" height={h} rx="1.5" className="fill-indigo-300" />;
      })}
    </svg>
  );
}

export function TenantCard({ view, initialPeriod }: { view: TenantView; initialPeriod: Period }) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const { tenant, performance } = view;
  const stat = view.periods[period];

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/tenants/${tenant.id}`} className="block truncate text-base font-semibold text-slate-900 hover:text-indigo-700">
            {tenant.name}
          </Link>
          <span
            className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
              tenant.category === "fb" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"
            }`}
          >
            {CATEGORY_LABEL[tenant.category]}
          </span>
        </div>
        <StatusBadge performance={performance} />
      </div>

      {view.entryCount === 0 ? (
        <div className="mt-5 flex flex-1 flex-col items-start gap-3 rounded-xl border border-dashed border-slate-300 p-4">
          <p className="text-sm text-slate-600">No turnover recorded yet</p>
          <AddEntryButton
            tenantId={tenant.id}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add Entry
          </AddEntryButton>
        </div>
      ) : (
        <>
          <div role="group" aria-label={`${tenant.name} period`} className="mt-4 inline-flex self-start rounded-lg bg-slate-100 p-0.5 text-xs">
            {PERIOD_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={period === o.value}
                onClick={() => setPeriod(o.value)}
                className={`rounded-md px-2.5 py-1 font-medium ${period === o.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {stat ? (
            <div className="mt-3">
              <div className="text-2xl font-semibold text-slate-900">{money(stat.value)}</div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{stat.label}</span>
                {stat.deltaPct !== null ? (
                  <span className={stat.deltaPct >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    {stat.deltaPct >= 0 ? "▲" : "▼"} {Math.abs(stat.deltaPct).toFixed(0)}% vs prior
                  </span>
                ) : null}
              </div>
              <div className="mt-2"><Spark data={stat.spark} /></div>
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Annual {money(view.annualTotal)}</span>
            <Link href={`/tenants/${tenant.id}`} className="font-medium text-indigo-600 hover:underline">
              Entries →
            </Link>
          </div>
        </>
      )}
    </article>
  );
}
