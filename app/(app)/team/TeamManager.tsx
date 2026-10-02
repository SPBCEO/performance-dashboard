"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changeMemberRole, createInvite, createTeam, removeMember, revokeInvite, signOut } from "@/lib/actions/teams";
import { ROLE_LABEL, type Role } from "@/lib/teams-shared";

export type MemberRow = { user_id: string; role: Role; email: string; isYou: boolean };
export type InviteRow = { id: string; role: "admin" | "viewer"; expires_at: string };

const card = "rounded-xl bg-surface-container-low p-4 ring-1 ring-white/5";
const btn = "min-h-[44px] rounded-full px-4 text-sm font-semibold disabled:opacity-60";

export function TeamManager({ teamName, myRole, members, invites }: { teamName: string; myRole: Role; members: MemberRow[]; invites: InviteRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteRole, setInviteRole] = useState<"admin" | "viewer">("viewer");
  const [newTeam, setNewTeam] = useState("");
  const isOwner = myRole === "owner";
  const canInvite = myRole === "owner" || myRole === "admin";

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="label-caps text-primary">Team</span>
        <h1 className="font-headline text-2xl font-semibold text-on-surface">{teamName}</h1>
        <p className="mt-1 text-xs text-on-surface-variant">
          Your role: <b className="text-on-surface">{ROLE_LABEL[myRole]}</b>. Owners manage everything, admins edit data and invite, viewers are read-only.
        </p>
      </div>

      {error ? <p role="alert" className="rounded-lg bg-error-container/50 px-3 py-2 text-sm text-on-error-container">{error}</p> : null}

      <section className={card}>
        <h2 className="mb-2 font-headline text-lg font-semibold text-on-surface">Members ({members.length})</h2>
        <ul>
          {members.map((m) => (
            <li key={m.user_id} className="flex min-h-[56px] flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 last:border-b-0">
              <div className="min-w-0">
                <div className="truncate text-sm text-on-surface">{m.email}{m.isYou ? " (you)" : ""}</div>
                {!isOwner || m.isYou ? <div className="text-xs text-on-surface-variant">{ROLE_LABEL[m.role]}</div> : null}
              </div>
              <div className="flex items-center gap-2">
                {isOwner && !m.isYou ? (
                  <select
                    aria-label={`Role for ${m.email}`}
                    value={m.role}
                    disabled={pending}
                    onChange={(e) => run(() => changeMemberRole(m.user_id, e.target.value as Role))}
                    className="min-h-[44px] rounded-lg border border-white/10 bg-surface-container-lowest px-2 text-sm text-on-surface"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : null}
                {(isOwner && !m.isYou) || (myRole === "admin" && m.role !== "owner" && !m.isYou) || m.isYou ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(m.isYou ? "Leave this team?" : `Remove ${m.email} from the team?`)) {
                        run(async () => {
                          const r = await removeMember(m.user_id);
                          if (r.ok && m.isYou) router.replace("/onboarding");
                          return r;
                        });
                      }
                    }}
                    className="min-h-[44px] px-3 text-xs font-semibold text-error hover:bg-white/5"
                  >
                    {m.isYou ? "Leave" : "Remove"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {canInvite ? (
        <section className={card}>
          <h2 className="mb-2 font-headline text-lg font-semibold text-on-surface">Invite someone</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Invite role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "viewer")}
              className="min-h-[44px] rounded-lg border border-white/10 bg-surface-container-lowest px-2 text-sm text-on-surface"
            >
              <option value="viewer">Viewer (read-only)</option>
              <option value="admin">Admin (can edit)</option>
            </select>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                setCopied(false);
                start(async () => {
                  const res = await createInvite(inviteRole, 7);
                  if (res.ok) {
                    setLink(`${window.location.origin}/invite/${res.token}`);
                    router.refresh();
                  } else setError(res.error);
                });
              }}
              className={`${btn} bg-primary-container text-on-primary-container hover:brightness-110`}
            >
              Create invite link
            </button>
          </div>
          {link ? (
            <div className="mt-3 rounded-lg bg-surface-container-lowest p-3">
              <p className="mb-1 text-xs text-on-surface-variant">Single-use, expires in 7 days. Shown once — copy it now.</p>
              <div className="metric break-all text-xs text-on-surface">{link}</div>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                }}
                className={`${btn} mt-2 border border-white/15 text-on-surface hover:bg-white/5`}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          ) : null}
          {invites.length > 0 ? (
            <ul className="mt-3">
              {invites.map((i) => (
                <li key={i.id} className="flex min-h-[48px] items-center justify-between gap-2 border-t border-white/5 text-sm">
                  <span className="text-on-surface-variant">
                    Pending {ROLE_LABEL[i.role]} invite · expires {new Date(i.expires_at).toLocaleDateString()}
                  </span>
                  <button type="button" disabled={pending} onClick={() => run(() => revokeInvite(i.id))} className="min-h-[44px] px-3 text-xs font-semibold text-error hover:bg-white/5">
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className={card}>
        <h2 className="mb-2 font-headline text-lg font-semibold text-on-surface">Create another team</h2>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await createTeam(newTeam);
              if (r.ok) setNewTeam("");
              return r;
            });
          }}
        >
          <label className="min-w-[200px] flex-1 text-xs font-medium text-on-surface-variant">
            Team name
            <input required maxLength={80} value={newTeam} onChange={(e) => setNewTeam(e.target.value)} className="mt-1 block min-h-[48px] w-full rounded-lg border border-white/10 bg-surface-container-lowest px-3 text-base text-on-surface focus:border-primary focus:outline-none" />
          </label>
          <button type="submit" disabled={pending} className={`${btn} bg-primary-container text-on-primary-container hover:brightness-110`}>Create team</button>
        </form>
      </section>

      <form action={signOut}>
        <button type="submit" className={`${btn} border border-white/15 text-on-surface hover:bg-white/5`}>Sign out</button>
      </form>
    </div>
  );
}
