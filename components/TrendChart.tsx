"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Bucket } from "@/lib/data/aggregate";
import { money, moneyCompact } from "@/lib/format";
import type { CategoryFilter } from "@/lib/data/types";

export const FB_COLOR = "#d97707";
export const NONFB_COLOR = "#c0c1ff";

export function TrendChart({ data, category }: { data: Bucket[]; category: CategoryFilter }) {
  const showFb = category !== "non-fb";
  const showNonFb = category !== "fb";
  return (
    <div className="h-48 w-full md:h-64" role="img" aria-label="Turnover trend chart, F&B and non-F&B stacked">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gFb" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={FB_COLOR} stopOpacity={0.45} />
              <stop offset="100%" stopColor={FB_COLOR} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gNon" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={NONFB_COLOR} stopOpacity={0.35} />
              <stop offset="100%" stopColor={NONFB_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(219,194,176,0.12)" vertical={false} />
          <XAxis dataKey="label" padding={{ left: 16, right: 16 }} tick={{ fontSize: 10, fill: "#dbc2b0" }} tickLine={false} axisLine={{ stroke: "rgba(219,194,176,0.2)" }} minTickGap={24} />
          <YAxis
            tickFormatter={moneyCompact}
            tick={{ fontSize: 10, fill: "#a38c7c", fontFamily: "var(--font-jetbrains)" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            formatter={(v, name) => [money(Number(v)), String(name)]}
            cursor={{ stroke: "rgba(255,255,255,0.15)" }}
            contentStyle={{ background: "#222a3d", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#dae2fd", fontSize: 12 }}
            labelStyle={{ color: "#dbc2b0" }}
          />
          {showNonFb ? (
            <Area type="monotone" dataKey="nonFb" name="Non-F&B" stackId="t" stroke={NONFB_COLOR} strokeWidth={2} fill="url(#gNon)" dot={{ r: 3, fill: NONFB_COLOR, strokeWidth: 0 }} />
          ) : null}
          {showFb ? (
            <Area type="monotone" dataKey="fb" name="F&B" stackId="t" stroke={FB_COLOR} strokeWidth={2.5} fill="url(#gFb)" dot={{ r: 3, fill: FB_COLOR, strokeWidth: 0 }} />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
