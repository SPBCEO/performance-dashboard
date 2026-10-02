"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProperty, createTenant } from "@/lib/actions/setup";
import type { Property } from "@/lib/data/types";
import { useEntryModal } from "./EntryModal";

const field =
  "mt-1 block min-h-[48px] w-full rounded-lg border border-white/10 bg-surface-container-lowest px-3 text-base text-on-surface focus:border-primary focus:outline-none";
const btn =
  "min-h-[48px] rounded-full bg-primary-container px-6 text-sm font-semibold text-on-primary-container hover:brightness-110 disabled:opacity-60";

/** Add a property and add tenants to it. Editors only (owners/admins). */
export function SetupPanel({ properties, defaultOpen = false }: { properties: Property[]; defaultOpen?: boolean }) {
  const { canEdit } = useEntryModal();
  const router = useRouter();
  const [pName, setPName] = useState("");
  const [tName, setTName] = useState("");
  const [category, setCategory] = useState<"fb" | "non-fb">("fb");
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (!canEdit) return null;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, done: string, reset: () => void) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        setMsg({ kind: "ok", text: done });
        reset();
        router.refresh();
      } else setMsg({ kind: "err", text: res.error ?? "Something went wrong." });
    });
  }

  return (
    <details open={defaultOpen} className="rounded-xl bg-surface-container-low p-4 ring-1 ring-white/5">
      <summary className="flex min-h-[44px] cursor-pointer items-center font-headline text-lg font-semibold text-on-surface">
        Set up properties &amp; tenants
      </summary>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => createProperty(pName), "Property added.", () => setPName(""));
          }}
        >
          <label className="block text-xs font-medium text-on-surface-variant">
            New property name
            <input required maxLength={80} value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Harborfront Plaza" className={field} />
          </label>
          <button type="submit" disabled={pending} className={`${btn} mt-3`}>Add property</button>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => createTenant({ property_id: propertyId || properties[0]?.id || "", name: tName, category }),
              "Tenant added.",
              () => setTName(""),
            );
          }}
        >
          {properties.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Add a property first, then you can add tenants to it.</p>
          ) : (
            <>
              <label className="block text-xs font-medium text-on-surface-variant">
                Property
                <select value={propertyId || properties[0].id} onChange={(e) => setPropertyId(e.target.value)} className={field}>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-xs font-medium text-on-surface-variant">
                Tenant name
                <input required maxLength={80} value={tName} onChange={(e) => setTName(e.target.value)} placeholder="The Salty Fork" className={field} />
              </label>
              <label className="mt-3 block text-xs font-medium text-on-surface-variant">
                Category
                <select value={category} onChange={(e) => setCategory(e.target.value as "fb" | "non-fb")} className={field}>
                  <option value="fb">F&amp;B</option>
                  <option value="non-fb">Non-F&amp;B</option>
                </select>
              </label>
              <button type="submit" disabled={pending} className={`${btn} mt-3`}>Add tenant</button>
            </>
          )}
        </form>
      </div>
      {msg ? (
        <p
          role={msg.kind === "err" ? "alert" : "status"}
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.kind === "err" ? "bg-error-container/50 text-on-error-container" : "bg-tertiary/15 text-tertiary"}`}
        >
          {msg.text}
        </p>
      ) : null}
    </details>
  );
}
