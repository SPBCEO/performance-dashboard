"use client";

import { useEntryModal } from "./EntryModal";

export function AddEntryButton({
  tenantId,
  className,
  children = "Record Turnover",
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
        "inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary-container px-5 text-sm font-semibold text-on-primary-container hover:brightness-110 active:scale-95"
      }
    >
      {children}
    </button>
  );
}
