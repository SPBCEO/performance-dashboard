"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Bucket } from "@/lib/data/aggregate";
import { money, moneyCompact } from "@/lib/format";
import type { CategoryFilter } from "@/lib/data/types";

export const FB_COLOR = "#d97706";
export const NONFB_COLOR = "#4f46e5";

export function TrendChart({ data, category }: { data: Bucket[]; category: CategoryFilter }) {
  const showFb = category !== "non-fb";
  const showNonFb = category !== "fb";
  return (
    <div className="h-72 w-full" role="img" aria-label="Turnover trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} minTickGap={16} />
          <YAxis tickFormatter={moneyCompact} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} width={52} />
          <Tooltip
            formatter={(v, name) => [money(Number(v)), String(name)]}
            cursor={{ fill: "#f1f5f9" }}
            contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0" }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          {showFb ? <Bar dataKey="fb" name="F&B" stackId="t" fill={FB_COLOR} radius={showNonFb ? 0 : [4, 4, 0, 0]} /> : null}
          {showNonFb ? <Bar dataKey="nonFb" name="Non-F&B" stackId="t" fill={NONFB_COLOR} radius={[4, 4, 0, 0]} /> : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
