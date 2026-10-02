"use client";

import { useEntryModal } from "./EntryModal";

export function AddEntryButton({
  tenantId,
  className,
  children = "Add Entry",
}: {
  tenantId?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const { openAdd } = useEntryModal();
  return (
    <button
      type="button"
      onClick={() => openAdd({ tenantId })}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      }
    >
      {children}
    </button>
  );
}
