"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptInvite, claimDemoTeam, createTeam, signOut } from "@/lib/actions/teams";

const field =
  "mt-1 block min-h-[48px] w-full rounded-lg border border-white/10 bg-surface-container-lowest px-3 text-base text-on-surface focus:border-primary focus:outline-none";
const primary =
  "min-h-[48px] w-full rounded-full bg-primary-container text-sm font-semibold text-on-primary-container hover:brightness-110 disabled:opacity-60";
const ghost = "min-h-[48px] w-full rounded-full border border-white/15 text-sm font-semibold text-on-surface hover:bg-white/5 disabled:opacity-60";

export function OnboardingForms({ email }: { email: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        router.replace("/");
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  // Accept a pasted invite link or just the token at the end of it.
  const token = invite.trim().split("/").filter(Boolean).pop() ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-headline text-2xl font-semibold text-on-surface">Set up your team</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Signed in as {email}. Create a team, or join one you were invited to.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createTeam(name));
        }}
        className="rounded-xl bg-surface-container-low p-5 ring-1 ring-white/5"
      >
        <label className="block text-xs font-medium text-on-surface-variant">
          Team name
          <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Harborfront Asset Mgmt" className={field} />
        </label>
        <button type="submit" disabled={pending} className={`${primary} mt-4`}>Create team</button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => acceptInvite(token));
        }}
        className="rounded-xl bg-surface-container-low p-5 ring-1 ring-white/5"
      >
        <label className="block text-xs font-medium text-on-surface-variant">
          Invite link
          <input value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="Paste your invite link" className={field} />
        </label>
        <button type="submit" disabled={pending || token.length < 20} className={`${ghost} mt-4`}>Join with invite</button>
      </form>

      <div className="rounded-xl border border-dashed border-outline-variant p-5">
        <p className="text-sm text-on-surface-variant">
          The seeded <b className="text-on-surface">Demo</b> team (Harborfront Plaza and friends) has no owner yet. The first person to claim it owns it.
        </p>
        <button type="button" disabled={pending} onClick={() => run(claimDemoTeam)} className={`${ghost} mt-3`}>Claim the Demo team</button>
      </div>

      {error ? <p role="alert" className="rounded-lg bg-error-container/50 px-3 py-2 text-sm text-on-error-container">{error}</p> : null}

      <form action={signOut}>
        <button type="submit" className="min-h-[44px] w-full text-sm font-semibold text-on-surface-variant hover:text-on-surface">Sign out</button>
      </form>
    </div>
  );
}
