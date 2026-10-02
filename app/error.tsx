"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6" role="alert">
      <p className="font-semibold text-rose-800">Could not load performance data.</p>
      <p className="mt-1 text-sm text-rose-700">Check your connection and try again.</p>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
        className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
      >
        Retry
      </button>
    </div>
  );
}
