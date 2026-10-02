"use client";

import { useEntryModal, type EditableEntry } from "./EntryModal";

export function EntryRowActions({ entry, tenantName }: { entry: EditableEntry; tenantName: string }) {
  const { openEdit, confirmDelete } = useEntryModal();
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={() => openEdit(entry)}
        aria-label={`Edit entry ${entry.entry_date}`}
        className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => confirmDelete({ ...entry, tenantName })}
        aria-label={`Delete entry ${entry.entry_date}`}
        className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
      >
        Delete
      </button>
    </div>
  );
}
