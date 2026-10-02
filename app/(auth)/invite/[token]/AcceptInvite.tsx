"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptInvite } from "@/lib/actions/teams";

type Info = { team_name: string; role: string } | null | "unknown";

export function AcceptInvite({ token, email, info }: { token: string; email: string | null; info: Info }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (info === null) {
    return (
      <div className="rounded-xl bg-surface-container-low p-5 ring-1 ring-white/5">
        <h1 className="font-headline text-2xl font-semibold text-on-surface">This invite can&apos;t be used</h1>
        <p className="mb-4 mt-1 text-sm text-on-surface-variant">
          The link is invalid, expired, revoked or already used. Ask the team owner for a new one.
        </p>
        <Link href="/" className="flex min-h-[48px] w-full items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-on-surface hover:bg-white/5">
          Back to the dashboard
        </Link>
      </div>
    );
  }

  const known = info !== "unknown";
  return (
    <div className="rounded-xl bg-surface-container-low p-5 ring-1 ring-white/5">
      <h1 className="font-headline text-2xl font-semibold text-on-surface">
        {known ? `Join ${info.team_name}` : "You've been invited"}
      </h1>
      <p className="mb-4 mt-1 text-sm text-on-surface-variant">
        {known ? `You'll join as ${info.role === "admin" ? "an Admin (can edit)" : "a Viewer (read-only)"}. ` : ""}
        Signed in as {email}. Invites are single-use.
      </p>
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
