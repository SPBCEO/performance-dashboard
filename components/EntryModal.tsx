"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createEntry, deleteEntry, updateEntry } from "@/lib/actions/entries";
import { moneyExact, todayISO } from "@/lib/format";
import type { Property, Tenant } from "@/lib/data/types";

export type EditableEntry = { id: string; tenant_id: string; entry_date: string; amount: number };

type Ctx = {
  openAdd: (opts?: { tenantId?: string }) => void;
  openEdit: (entry: EditableEntry) => void;
  confirmDelete: (entry: EditableEntry & { tenantName?: string }) => void;
  canEdit: boolean;
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
  canEdit,
  children,
}: {
  tenants: Tenant[];
  properties: Property[];
  canEdit: boolean;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>({ kind: "closed" });
  const [toast, setToast] = useState<string | null>(null);
  const close = useCallback(() => setState({ kind: "closed" }), []);
  const saved = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const ctx = useMemo<Ctx>(
    () => ({
      openAdd: (opts) => setState({ kind: "add", tenantId: opts?.tenantId }),
      openEdit: (entry) => setState({ kind: "edit", entry }),
      confirmDelete: (entry) => setState({ kind: "delete", entry }),
      canEdit,
    }),
    [canEdit],
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
          onSaved={saved}
        />
      ) : null}
      {state.kind === "delete" ? <DeleteConfirm entry={state.entry} onClose={close} onSaved={saved} /> : null}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4">
        {toast ? (
          <div className="pointer-events-auto rounded-full bg-surface-container-highest px-4 py-2 text-sm text-on-surface shadow-lg ring-1 ring-white/10">{toast}</div>
        ) : null}
      </div>
    </EntryModalContext.Provider>
  );
}

const FOCUSABLE = "a[href],button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])";

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node?.querySelector<HTMLElement>("select,input,button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="pb-safe max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t border-white/15 bg-[#1e293b] p-5 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.45)] sm:rounded-2xl sm:border"
      >
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-9 rounded-full bg-slate-600 sm:hidden" />
        <h2 className="mb-4 font-headline text-xl font-semibold text-on-surface">{title}</h2>
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
  onSaved,
}: {
  tenants: Tenant[];
  properties: Property[];
  entry?: EditableEntry;
  defaultTenantId?: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
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
      if (res.ok) {
        const t = tenants.find((x) => x.id === tenantId);
        onSaved(`${editing ? "Updated" : "Saved"} ${moneyExact(Number(String(amount).replace(/[$,s]/g, "")) || 0)} · ${t?.name ?? "entry"} · ${date}`);
        onClose();
      } else setError(res.error);
    });
  }

  return (
    <Overlay title={editing ? "Edit turnover entry" : "Add turnover entry"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs font-medium text-on-surface-variant">
          Tenant
          <select
            required
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="mt-1 block min-h-[48px] w-full rounded-lg border border-white/10 bg-surface-container-lowest px-3 text-base text-on-surface focus:border-primary focus:outline-none"
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
          <label className="block text-xs font-medium text-on-surface-variant">
            Date
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="metric mt-1 block min-h-[48px] w-full rounded-lg border border-white/10 bg-surface-container-lowest px-3 text-base text-on-surface focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block text-xs font-medium text-on-surface-variant">
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
              className="metric mt-1 block min-h-[48px] w-full rounded-lg border border-white/10 bg-surface-container-lowest px-3 text-base text-on-surface focus:border-primary focus:outline-none"
            />
          </label>
        </div>
        {error ? (
          <p role="alert" className="rounded-lg bg-error-container/50 px-3 py-2 text-sm text-on-error-container">{error}</p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="min-h-[44px] rounded-full border border-white/15 px-5 text-sm font-medium text-on-surface hover:bg-white/5">
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="min-h-[44px] rounded-full bg-primary-container px-6 text-sm font-semibold text-on-primary-container hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "Saving…" : editing ? "Save changes" : "Save"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function DeleteConfirm({ entry, onClose, onSaved }: { entry: EditableEntry & { tenantName?: string }; onClose: () => void; onSaved: (msg: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <Overlay title="Delete this entry?" onClose={onClose}>
      <p className="text-sm text-on-surface-variant">
        {entry.tenantName ? `${entry.tenantName} · ` : ""}
        {entry.entry_date} · ${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}. This can’t be undone.
      </p>
      {error ? <p role="alert" className="mt-3 rounded-lg bg-error-container/50 px-3 py-2 text-sm text-on-error-container">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="min-h-[44px] rounded-full border border-white/15 px-5 text-sm font-medium text-on-surface hover:bg-white/5">
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await deleteEntry(entry.id);
              if (res.ok) {
                onSaved(`Deleted entry · ${entry.tenantName ?? ""} ${entry.entry_date}`.trim());
                onClose();
              } else setError(res.error);
            })
          }
          className="min-h-[44px] rounded-full bg-error-container px-6 text-sm font-semibold text-on-error-container hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Overlay>
  );
}
