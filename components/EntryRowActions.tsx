"use client";

import { useEntryModal, type EditableEntry } from "./EntryModal";

export function EntryRowActions({ entry, tenantName }: { entry: EditableEntry; tenantName: string }) {
  const { openEdit, confirmDelete } = useEntryModal();
  return (
    <div className="flex shrink-0 items-center">
      <button
        type="button"
        onClick={() => openEdit(entry)}
        aria-label={`Edit entry ${entry.entry_date}`}
        className="min-h-[44px] rounded-lg px-3 text-xs font-semibold text-primary hover:bg-white/5"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => confirmDelete({ ...entry, tenantName })}
        aria-label={`Delete entry ${entry.entry_date}`}
        className="min-h-[44px] rounded-lg px-3 text-xs font-semibold text-error hover:bg-white/5"
      >
        Delete
      </button>
    </div>
  );
}
