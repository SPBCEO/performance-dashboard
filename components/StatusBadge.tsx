import type { TenantPerformance } from "@/lib/data/aggregate";
import { bucketLabel } from "@/lib/data/aggregate";

const STYLES = {
  outperforming: { text: "Outperforming", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: "▲" },
  "on-track": { text: "On track", cls: "bg-slate-100 text-slate-700 ring-slate-200", icon: "●" },
  underperforming: { text: "Underperforming", cls: "bg-rose-50 text-rose-700 ring-rose-200", icon: "▼" },
  "no-baseline": { text: "No baseline yet", cls: "bg-amber-50 text-amber-700 ring-amber-200", icon: "…" },
  "no-data": { text: "No data", cls: "bg-slate-50 text-slate-500 ring-slate-200", icon: "–" },
} as const;

export function StatusBadge({ performance, showDetail = false }: { performance: TenantPerformance; showDetail?: boolean }) {
  const s = STYLES[performance.status];
  const detail =
    performance.ratio !== null && performance.currentMonth
      ? `${bucketLabel(performance.currentMonth, "monthly")} is ${Math.round(performance.ratio * 100)}% of the trailing 3-month average`
      : null;
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span
        title={detail ?? undefined}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.cls}`}
      >
        <span aria-hidden="true">{s.icon}</span>
        {s.text}
      </span>
      {showDetail && detail ? <span className="text-xs text-slate-500">{detail}</span> : null}
    </span>
  );
}
