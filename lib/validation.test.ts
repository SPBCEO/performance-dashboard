import { describe, expect, it } from "vitest";
import { validateEntry } from "./validation";

const T = "b0000000-0000-0000-0000-000000000001";
const now = new Date("2026-10-02T00:00:00Z");
const ok = (over: Partial<Parameters<typeof validateEntry>[0]> = {}) =>
  validateEntry({ tenant_id: T, entry_date: "2025-02-14", amount: 4500, ...over }, now);

describe("validateEntry", () => {
  it("accepts the PRD scenario", () => {
    expect(ok()).toEqual({ ok: true, value: { tenant_id: T, entry_date: "2025-02-14", amount: 4500 } });
  });
  it("rejects a bad tenant id", () => expect(ok({ tenant_id: "nope" }).ok).toBe(false));
  it.each(["2025-02-30", "2025-2-3", "", "14/02/2025"])("rejects date %s", (d) => expect(ok({ entry_date: d }).ok).toBe(false));
  it("rejects dates before 2000 and in the far future", () => {
    expect(ok({ entry_date: "1999-12-31" }).ok).toBe(false);
    expect(ok({ entry_date: "2205-01-01" }).ok).toBe(false);
  });
  it("allows today", () => expect(ok({ entry_date: "2026-10-02" }).ok).toBe(true));
  it("parses currency strings", () => {
    const r = ok({ amount: "$4,500" });
    expect(r.ok && r.value.amount).toBe(4500);
  });
  it("rounds to 2 decimals", () => {
    const r = ok({ amount: "10.005" });
    expect(r.ok && r.value.amount).toBe(10.01);
  });
  it("accepts zero", () => expect(ok({ amount: 0 }).ok).toBe(true));
  it.each(["-1", "abc", "1e5", "0x10", "NaN", "Infinity", ""])("rejects amount %s", (a) => expect(ok({ amount: a }).ok).toBe(false));
  it("rejects amounts >= 1e10", () => expect(ok({ amount: 1e10 }).ok).toBe(false));
});
