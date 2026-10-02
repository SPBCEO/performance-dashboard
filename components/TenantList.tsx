"use client";

import { useState } from "react";
import type { TenantView } from "@/lib/data/dashboard";
import type { Period } from "@/lib/data/types";
import { IconSort } from "./icons";
import { TenantCard } from "./TenantCard";

export function TenantList({
  views,
  period,
  title,
  subtitle,
}: {
  views: TenantView[];
  period: Period;
  title: string;
  subtitle: string;
}) {
  const [reversed, setReversed] = useState(false);
  const list = reversed ? [...views].reverse() : views;
  const empty = views.filter((v) => v.entryCount === 0).length;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline text-xl font-semibold text-on-surface">{title}</h2>
            <span className="metric rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-semibold text-on-surface-variant">{views.length}</span>
          </div>
          <p className="mt-0.5 text-xs text-on-surface-variant">{subtitle}</p>
        </div>
        {views.length > 1 ? (
          <button
            type="button"
            onClick={() => setReversed((r) => !r)}
            aria-pressed={reversed}
            className="flex min-h-[44px] items-center gap-1 px-3 text-xs font-semibold text-primary"
          >
            <IconSort className="h-[18px] w-[18px]" /> {reversed ? "Best first" : "Worst first"}
          </button>
        ) : null}
      </div>
      {empty > 0 ? (
        <p role="status" className="rounded-lg bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
          {empty} of {views.length} tenants have no turnover recorded yet.
        </p>
      ) : null}
      {views.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">
          No tenants match this filter.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <TenantCard key={`${v.tenant.id}-${period}`} view={v} period={period} />
          ))}
        </div>
      )}
    </section>
  );
}
