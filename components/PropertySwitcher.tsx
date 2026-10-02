"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Property } from "@/lib/data/types";
import { IconChevronDown } from "./icons";

/** Property name as header title; a transparent native <select> overlays it so it works on every device. */
export function PropertySwitcher({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const onOverviewOrTenants = pathname === "/" || pathname === "/tenants";
  const current = properties.find((p) => p.id === params.get("property")) ?? properties[0];
  const canSwitch = properties.length > 1 && onOverviewOrTenants;

  function change(id: string) {
    const next = new URLSearchParams(params.toString());
    next.set("property", id);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  return (
    <div className="relative min-w-0">
      <div className="flex min-h-[44px] items-center gap-1">
        <span className="truncate font-headline text-xl font-semibold leading-tight tracking-tight text-on-surface">
          {current?.name ?? "Performance"}
        </span>
        {canSwitch ? <IconChevronDown className="h-[18px] w-[18px] shrink-0 text-on-surface-variant" /> : null}
      </div>
      {canSwitch ? (
        <select
          aria-label="Switch property"
          value={current?.id}
          onChange={(e) => change(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
