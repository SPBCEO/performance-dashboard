import Link from "next/link";
import { money, moneyExact } from "@/lib/format";
import { CATEGORY_LABEL, type Period } from "@/lib/data/types";
import type { TenantView } from "@/lib/data/dashboard";
import { AddEntryButton } from "./AddEntryButton";
import { IconDining, IconRetail } from "./icons";
import { StatusBadge } from "./StatusBadge";

const NOUN = { daily: "Day", monthly: "Mo", annual: "Yr" } as const;

function Flow({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 60},${22 - (v / max) * 20}`);
  const last = pts[pts.length - 1].split(",");
  return (
    <svg viewBox="0 0 60 24" className="h-6 w-16 overflow-visible" role="img" aria-label="Last three months of turnover">
      <polyline fill="none" points={pts.join(" ")} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}

export function TenantCard({ view, period }: { view: TenantView; period: Period }) {
  const { tenant, performance } = view;
  const stat = view.periods[period];
  const isFb = tenant.category === "fb";
  const Icon = isFb ? IconDining : IconRetail;
  const delta = stat?.deltaPct ?? null;
  const flowColor = performance.status === "underperforming" ? "#ffb4ab" : performance.status === "outperforming" ? "#68dba9" : "#c0c1ff";

  return (
    <article className="relative rounded-xl bg-surface-container-low p-3.5 shadow-sm ring-1 ring-white/5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container ${isFb ? "text-primary-container" : "text-secondary"}`}>
            <Icon className="h-[22px] w-[22px]" />
          </div>
          <div className="min-w-0">
            <Link href={`/tenants/${tenant.id}`} className="block truncate font-headline text-lg font-semibold leading-tight text-on-surface after:absolute after:inset-0 after:content-[''] hover:text-primary">
              {tenant.name}
            </Link>
            <span className="text-xs text-on-surface-variant">{CATEGORY_LABEL[tenant.category]}</span>
          </div>
        </div>
        <StatusBadge performance={performance} />
      </div>

      {view.entryCount === 0 ? (
        <div className="mt-3 flex flex-col items-start gap-3 rounded-lg border border-dashed border-outline-variant p-3">
          <p className="text-sm text-on-surface-variant">No turnover recorded yet</p>
          <AddEntryButton
            tenantId={tenant.id}
            className="relative z-10 min-h-[44px] rounded-full bg-primary-container px-4 text-sm font-semibold text-on-primary-container hover:brightness-110"
          >
            Add Entry
          </AddEntryButton>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 items-center gap-2 rounded-lg bg-surface-container-lowest/60 p-2.5">
            <div className="min-w-0">
              <span className="label-caps block text-[10px] text-on-surface-variant">Latest {NOUN[period]}</span>
              <span className="metric block truncate text-[13px] font-semibold text-on-surface">{stat ? moneyExact(stat.value) : "—"}</span>
              {delta !== null ? (
                <span className={`metric text-[11px] ${delta >= 0 ? "text-tertiary" : "text-error"}`}>
                  {delta >= 0 ? "+" : "−"}{Math.abs(delta).toFixed(1)}%
                </span>
              ) : (
                <span className="text-[11px] text-on-surface-variant">{stat?.label}</span>
              )}
            </div>
            <div className="flex flex-col items-center">
              <span className="label-caps mb-1 text-[10px] text-on-surface-variant">3-Mo Flow</span>
              <Flow data={view.flow} color={flowColor} />
            </div>
            <div className="min-w-0 text-right">
              <span className="label-caps block text-[10px] text-on-surface-variant">TTM Gross</span>
              <span className="metric block truncate text-[13px] font-semibold text-on-surface">{money(view.ttmTotal)}</span>
              <span className="text-[11px] text-on-surface-variant">{view.ttmCount} {view.ttmCount === 1 ? "entry" : "entries"}</span>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">{stat?.label}</span>
            <Link href={`/tenants/${tenant.id}`} className="relative z-10 inline-flex min-h-[44px] items-center text-xs font-semibold text-primary hover:underline">
              View {view.entryCount} {view.entryCount === 1 ? "entry" : "entries"} →
            </Link>
          </div>
        </>
      )}
    </article>
  );
}
