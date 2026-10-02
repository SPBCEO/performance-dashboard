"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { money } from "@/lib/format";
import { FB_COLOR, NONFB_COLOR } from "./TrendChart";

export type CategoryRow = { name: string; value: number; momPct: number | null; color: string };

export function CategoryBreakdown({ fb, nonFb }: { fb: { total: number; momPct: number | null }; nonFb: { total: number; momPct: number | null } }) {
  const rows: CategoryRow[] = [
    { name: "F&B", value: fb.total, momPct: fb.momPct, color: FB_COLOR },
    { name: "Non-F&B", value: nonFb.total, momPct: nonFb.momPct, color: NONFB_COLOR },
  ];
  const total = fb.total + nonFb.total;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-40 w-40 shrink-0" role="img" aria-label="F&B versus non-F&B share of turnover">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="none">
              {rows.map((r) => (
                <Cell key={r.name} fill={r.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => money(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-3">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-800">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
              {r.name}
            </span>
            <span className="text-right">
              <span className="block font-semibold text-slate-900">
                {money(r.value)} <span className="font-normal text-slate-500">({total > 0 ? Math.round((r.value / total) * 100) : 0}%)</span>
              </span>
              <span className={`block text-xs ${r.momPct === null ? "text-slate-400" : r.momPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {r.momPct === null ? "MoM n/a" : `${r.momPct >= 0 ? "▲" : "▼"} ${Math.abs(r.momPct).toFixed(1)}% MoM`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
