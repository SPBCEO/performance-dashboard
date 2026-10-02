import { describe, expect, it } from "vitest";
import { aggregate, bucketKey, bucketLabel, monthOverMonth, scoreTenant } from "./aggregate";
import { buildTenantViews, parseCategory, parsePeriod } from "./dashboard";
import type { Tenant, TurnoverEntry } from "./types";

const fb: Tenant = { id: "t1", property_id: "p", name: "Salty", category: "fb" };
const non: Tenant = { id: "t2", property_id: "p", name: "Apparel", category: "non-fb" };
let n = 0;
const e = (tenant_id: string, entry_date: string, amount: number): TurnoverEntry => ({ id: `e${n++}`, tenant_id, entry_date, amount });

describe("buckets", () => {
  it("keys", () => {
    expect(bucketKey("2025-02-14", "daily")).toBe("2025-02-14");
    expect(bucketKey("2025-02-14", "monthly")).toBe("2025-02");
    expect(bucketKey("2025-02-14", "annual")).toBe("2025");
  });
  it("labels", () => {
    expect(bucketLabel("2025-02", "monthly")).toBe("Feb 2025");
    expect(bucketLabel("2025-02-04", "daily")).toBe("Feb 4, 2025");
  });
});

describe("aggregate", () => {
  it("empty -> []", () => expect(aggregate([], [fb], "monthly")).toEqual([]));
  it("skips entries of unknown tenants", () => expect(aggregate([e("zzz", "2025-01-01", 5)], [fb], "daily")).toEqual([]));
  it("splits categories and totals", () => {
    const [b] = aggregate([e("t1", "2025-02-14", 4500), e("t2", "2025-02-20", 500)], [fb, non], "monthly");
    expect(b).toMatchObject({ key: "2025-02", fb: 4500, nonFb: 500, total: 5000 });
  });
  it("sorts ascending and fills empty months across a year boundary", () => {
    const out = aggregate([e("t1", "2025-02-01", 1), e("t1", "2024-12-01", 1)], [fb], "monthly");
    expect(out.map((b) => b.key)).toEqual(["2024-12", "2025-01", "2025-02"]);
    expect(out[1].total).toBe(0);
  });
  it("daily does not fill gaps", () => {
    expect(aggregate([e("t1", "2025-02-01", 1), e("t1", "2025-02-09", 1)], [fb], "daily")).toHaveLength(2);
  });
});

describe("scoreTenant (current rule: up to 3 prior months WITH entries)", () => {
  const prior = (...v: number[]) => v.map((amt, i) => e("t1", `2025-0${i + 1}-10`, amt));
  const score = (cur: number, ...p: number[]) => scoreTenant([...prior(...p), e("t1", "2025-04-10", cur)], "2025-04");
  it("no data", () => {
    expect(scoreTenant([], "2025-04").status).toBe("no-data");
    expect(scoreTenant([e("t1", "2025-01-01", 1)], null).status).toBe("no-data");
  });
  it("no baseline when only the current month exists", () => {
    expect(scoreTenant([e("t1", "2025-04-10", 100)], "2025-04").status).toBe("no-baseline");
  });
  it("thresholds: 1.15 and 0.85 are on-track, beyond are flagged", () => {
    expect(score(1150, 1000).status).toBe("on-track");
    expect(score(1151, 1000).status).toBe("outperforming");
    expect(score(850, 1000).status).toBe("on-track");
    expect(score(849, 1000).status).toBe("underperforming");
  });
  it("missing current month counts as 0 -> underperforming", () => {
    const r = scoreTenant([e("t1", "2025-03-10", 1000)], "2025-04");
    expect(r).toMatchObject({ status: "underperforming", ratio: 0 });
  });
  it("uses only the last 3 prior months", () => {
    // Jan 9000 (ignored), Feb-Apr 1000 each -> avg 1000; May = 1000 -> on-track
    const rows = [e("t1", "2025-01-10", 9000), e("t1", "2025-02-10", 1000), e("t1", "2025-03-10", 1000), e("t1", "2025-04-10", 1000), e("t1", "2025-05-10", 1000)];
    expect(scoreTenant(rows, "2025-05").status).toBe("on-track");
  });
  it("PRD scenario: Salty Fork Mar vs Jan/Feb after adding $4,500 on Feb 14 is underperforming", () => {
    const r = scoreTenant([e("t1", "2025-01-06", 3200), e("t1", "2025-02-10", 4100), e("t1", "2025-02-14", 4500), e("t1", "2025-03-05", 3800)], "2025-03");
    expect(r.status).toBe("underperforming");
    expect(r.ratio).toBeCloseTo(3800 / 5900, 4);
  });
});

describe("monthOverMonth", () => {
  it("null with fewer than 2 months", () => expect(monthOverMonth([e("t1", "2025-01-01", 1)])).toBeNull());
  it("+10%", () => expect(monthOverMonth([e("t1", "2025-01-01", 100), e("t1", "2025-02-01", 110)])).toBeCloseTo(10));
  it("null when the prior month is 0", () => expect(monthOverMonth([e("t1", "2025-01-01", 0), e("t1", "2025-02-01", 5)])).toBeNull());
});

describe("buildTenantViews", () => {
  const entries = [
    e("t1", "2024-04-10", 999), // 13 months back: outside the window
    e("t1", "2024-05-10", 50), // exactly 12 months incl. the latest: inside
    e("t1", "2024-06-10", 100),
    e("t1", "2025-04-10", 200),
    e("t2", "2025-04-12", 5000),
  ];
  const views = buildTenantViews([fb, non], entries);
  const v1 = views.find((v) => v.tenant.id === "t1")!;
  it("TTM window is exactly 12 calendar months ending at the latest month", () => {
    expect(v1.ttmTotal).toBe(350);
    expect(v1.ttmCount).toBe(3);
  });
  it("flow is 3 months, oldest first", () => expect(v1.flow).toEqual([0, 0, 200]));
  it("anchor comes from the unfiltered entries", () => {
    const only = buildTenantViews([fb], entries.filter((x) => x.tenant_id === "t1"), entries);
    expect(only[0].flow).toEqual([0, 0, 200]);
  });
});

describe("param parsing", () => {
  it("falls back to defaults", () => {
    expect(parsePeriod(undefined)).toBe("daily");
    expect(parsePeriod(["monthly"])).toBe("daily");
    expect(parsePeriod("annual")).toBe("annual");
    expect(parseCategory("garbage")).toBe("all");
    expect(parseCategory("fb")).toBe("fb");
  });
});
