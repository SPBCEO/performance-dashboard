"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-error-container/40 p-6 ring-1 ring-error/30" role="alert">
      <p className="font-headline text-lg font-semibold text-on-error-container">Could not load performance data.</p>
      <p className="mt-1 text-sm text-on-surface-variant">Check your connection and try again.</p>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
        className="mt-4 min-h-[44px] rounded-full bg-primary-container px-5 text-sm font-semibold text-on-primary-container hover:brightness-110"
      >
        Retry
      </button>
    </div>
  );
}
