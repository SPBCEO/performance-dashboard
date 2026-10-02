import { money } from "@/lib/format";

type Side = { total: number; momPct: number | null; tenants: number };

function Mom({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="metric text-xs text-on-surface-variant">MoM n/a</span>;
  return (
    <span className={`metric text-xs font-medium ${pct >= 0 ? "text-tertiary" : "text-error"}`}>
      {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% MoM
    </span>
  );
}

/** Donut + legend. Pure SVG so it renders on the server. */
export function CategoryBreakdown({ fb, nonFb }: { fb: Side; nonFb: Side }) {
  const total = fb.total + nonFb.total;
  const fbPct = total > 0 ? (fb.total / total) * 100 : 0;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 max-w-[58%] flex-col gap-1.5">
        <span className="label-caps text-on-surface-variant">Portfolio Concentration</span>
        <h3 className="font-headline text-xl font-semibold tracking-tight text-on-surface">{Math.round(fbPct)}% F&amp;B Weighted</h3>
        <p className="text-xs leading-snug text-on-surface-variant">
          {fb.tenants} F&amp;B {fb.tenants === 1 ? "tenant" : "tenants"} account for {money(fb.total)} of {money(total)} recorded turnover.
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 text-xs text-on-surface"><span className="h-2 w-2 rounded-full bg-primary-container" />F&amp;B <Mom pct={fb.momPct} /></span>
          <span className="flex items-center gap-1.5 text-xs text-on-surface"><span className="h-2 w-2 rounded-full bg-secondary" />Non-F&amp;B <Mom pct={nonFb.momPct} /></span>
        </div>
      </div>
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center" role="img" aria-label={`${Math.round(fbPct)} percent F&B, ${100 - Math.round(fbPct)} percent non-F&B`}>
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="14.3" fill="none" stroke="#222a3d" strokeWidth="4" />
          <circle cx="18" cy="18" r="14.3" fill="none" stroke="#c0c1ff" strokeWidth="4" pathLength="100" strokeDasharray="100 100" />
          <circle cx="18" cy="18" r="14.3" fill="none" stroke="#d97707" strokeWidth="4" pathLength="100" strokeDasharray={`${fbPct} 100`} />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="metric text-sm font-bold text-on-surface">{Math.round(fbPct)}%</span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-primary">F&amp;B</span>
        </div>
      </div>
    </div>
  );
}
