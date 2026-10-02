import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeamContext } from "@/lib/teams";
import { AcceptInvite } from "./AcceptInvite";

export const metadata = { title: "Join team" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ctx = await getTeamContext();
  if (!ctx.user) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);

  // Look up which team/role this invite grants. If the lookup function isn't installed yet
  // (migration 0004), fall back to a generic card and let "Join" validate the token.
  let info: { team_name: string; role: string } | null | "unknown" = "unknown";
  if (/^[A-Za-z0-9_-]{20,128}$/.test(token)) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("peek_invite", { p_token: token });
    if (!error) info = (Array.isArray(data) ? data[0] : data) ?? null;
  } else {
    info = null;
  }
  return <AcceptInvite token={token} email={ctx.user.email} info={info} />;
}
