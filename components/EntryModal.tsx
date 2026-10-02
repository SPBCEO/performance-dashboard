"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createEntry, deleteEntry, updateEntry } from "@/lib/actions/entries";
import { todayISO } from "@/lib/format";
import type { Property, Tenant } from "@/lib/data/types";

export type EditableEntry = { id: string; tenant_id: string; entry_date: string; amount: number };

type Ctx = {
  openAdd: (opts?: { tenantId?: string }) => void;
  openEdit: (entry: EditableEntry) => void;
  confirmDelete: (entry: EditableEntry & { tenantName?: string }) => void;
};

const EntryModalContext = createContext<Ctx | null>(null);

export function useEntryModal(): Ctx {
  const ctx = useContext(EntryModalContext);
  if (!ctx) throw new Error("useEntryModal must be used inside <EntryModalProvider>");
  return ctx;
}

type State =
  | { kind: "closed" }
  | { kind: "add"; tenantId?: string }
  | { kind: "edit"; entry: EditableEntry }
  | { kind: "delete"; entry: EditableEntry & { tenantName?: string } };

export function EntryModalProvider({
  tenants,
  properties,
  children,
}: {
  tenants: Tenant[];
  properties: Property[];
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>({ kind: "closed" });
  const close = useCallback(() => setState({ kind: "closed" }), []);

  const ctx = useMemo<Ctx>(
    () => ({
      openAdd: (opts) => setState({ kind: "add", tenantId: opts?.tenantId }),
      openEdit: (entry) => setState({ kind: "edit", entry }),
      confirmDelete: (entry) => setState({ kind: "delete", entry }),
    }),
    [],
  );

  return (
    <EntryModalContext.Provider value={ctx}>
      {children}
      {state.kind === "add" || state.kind === "edit" ? (
        <EntryForm
          key={state.kind === "edit" ? state.entry.id : `add-${state.tenantId ?? ""}`}
          tenants={tenants}
          properties={properties}
          entry={state.kind === "edit" ? state.entry : undefined}
          defaultTenantId={state.kind === "add" ? state.tenantId : undefined}
          onClose={close}
        />
      ) : null}
      {state.kind === "delete" ? <DeleteConfirm entry={state.entry} onClose={close} /> : null}
    </EntryModalContext.Provider>
  );
}

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("select,input,button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function EntryForm({
  tenants,
  properties,
  entry,
  defaultTenantId,
  onClose,
}: {
  tenants: Tenant[];
  properties: Property[];
  entry?: EditableEntry;
  defaultTenantId?: string;
  onClose: () => void;
}) {
  const editing = !!entry;
  const [tenantId, setTenantId] = useState(entry?.tenant_id ?? defaultTenantId ?? "");
  const [date, setDate] = useState(entry?.entry_date ?? todayISO());
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const grouped = properties
    .map((p) => ({ p, list: tenants.filter((t) => t.property_id === p.id) }))
    .filter((g) => g.list.length > 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const input = { tenant_id: tenantId, entry_date: date, amount };
      const res = editing ? await updateEntry(entry!.id, input) : await createEntry(input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  return (
    <Overlay title={editing ? "Edit turnover entry" : "Add turnover entry"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Tenant
          <select
            required
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="" disabled>Select a tenant…</option>
            {grouped.map(({ p, list }) => (
              <optgroup key={p.id} label={p.name}>
                {list.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700">
            Date
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Amount (USD)
            <input
              type="number"
              required
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="4500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
        </div>
        {error ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {pending ? "Saving…" : editing ? "Save changes" : "Save"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function DeleteConfirm({ entry, onClose }: { entry: EditableEntry & { tenantName?: string }; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <Overlay title="Delete this entry?" onClose={onClose}>
      <p className="text-sm text-slate-600">
        {entry.tenantName ? `${entry.tenantName} · ` : ""}
        {entry.entry_date} · ${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}. This can’t be undone.
      </p>
      {error ? <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await deleteEntry(entry.id);
              if (res.ok) onClose();
              else setError(res.error);
            })
          }
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Overlay>
  );
}
