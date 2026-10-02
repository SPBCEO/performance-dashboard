import type { TenantPerformance } from "@/lib/data/aggregate";
import { bucketLabel } from "@/lib/data/aggregate";
import { IconArrowDown, IconArrowUp, IconInfo } from "./icons";

/** Icon + text + colour, so status never relies on colour alone (docs/DESIGN.md). */
export function StatusBadge({ performance, showDetail = false }: { performance: TenantPerformance; showDetail?: boolean }) {
  const { status, ratio } = performance;
  const r = ratio !== null ? ratio.toFixed(2) : "";
  const detail =
    ratio !== null && performance.currentMonth
      ? `${bucketLabel(performance.currentMonth, "monthly")} is ${Math.round(ratio * 100)}% of the trailing 3-month average`
      : null;

  let cls = "bg-surface-container-highest text-on-surface-variant";
  let icon: React.ReactNode = null;
  let text = "";
  if (status === "outperforming") {
    cls = "bg-tertiary-container text-on-tertiary";
    icon = <IconArrowUp className="h-3.5 w-3.5" />;
    text = `${r} Baseline`;
  } else if (status === "underperforming") {
    cls = "bg-error-container text-on-error-container";
    icon = <IconArrowDown className="h-3.5 w-3.5" />;
    text = `${r} Baseline`;
  } else if (status === "on-track") {
    icon = <span aria-hidden="true" className="h-1.5 w-1.5 rounded-[1px] bg-on-surface-variant" />;
    text = `${r} Steady`;
  } else if (status === "no-baseline") {
    icon = <IconInfo className="h-3.5 w-3.5" />;
    text = "No Baseline";
  } else {
    icon = <span aria-hidden="true">—</span>;
    text = "No Data";
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span
        title={detail ?? undefined}
        className={`metric inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
      >
        {icon}
        {text}
      </span>
      {showDetail && detail ? <span className="text-xs text-on-surface-variant">{detail}</span> : null}
    </span>
  );
}
