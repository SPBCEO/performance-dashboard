"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setActiveTeam } from "@/lib/actions/teams";
import { ROLE_LABEL, type Role } from "@/lib/teams-shared";
import { IconChevronDown } from "./icons";

/** Caption under the property name: "Team · Role". With several teams, a transparent <select> overlays it. */
export function TeamSwitcher({
  teams,
  activeTeamId,
  role,
}: {
  teams: { id: string; name: string }[];
  activeTeamId: string;
  role: Role;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const active = teams.find((t) => t.id === activeTeamId);
  const multi = teams.length > 1;

  return (
    <div className={`relative -mt-1 flex min-h-[20px] items-center gap-1 text-xs text-on-surface-variant ${pending ? "opacity-60" : ""}`}>
      <span className="truncate">{active?.name ?? "Team"}</span>
      <span aria-hidden="true" className="text-outline">•</span>
      <span className="text-primary">{ROLE_LABEL[role]}</span>
      {multi ? <IconChevronDown className="h-3.5 w-3.5 shrink-0" /> : null}
      {multi ? (
        <select
          aria-label="Switch team"
          value={activeTeamId}
          disabled={pending}
          onChange={(e) =>
            start(async () => {
              const res = await setActiveTeam(e.target.value);
              if (res.ok) router.refresh();
            })
          }
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
