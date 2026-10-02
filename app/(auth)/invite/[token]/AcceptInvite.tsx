"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptInvite } from "@/lib/actions/teams";

export function AcceptInvite({ token, email }: { token: string; email: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="rounded-xl bg-surface-container-low p-5 ring-1 ring-white/5">
      <h1 className="font-headline text-2xl font-semibold text-on-surface">You&apos;ve been invited</h1>
      <p className="mb-4 mt-1 text-sm text-on-surface-variant">Join the team as {email}. Invites are single-use.</p>
      {error ? <p role="alert" className="mb-3 rounded-lg bg-error-container/50 px-3 py-2 text-sm text-on-error-container">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await acceptInvite(token);
            if (res.ok) {
              router.replace("/");
              router.refresh();
            } else setError(res.error);
          })
        }
        className="min-h-[48px] w-full rounded-full bg-primary-container text-sm font-semibold text-on-primary-container hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join team"}
      </button>
    </div>
  );
}
