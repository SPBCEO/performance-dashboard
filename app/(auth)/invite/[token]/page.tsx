import { redirect } from "next/navigation";
import { getTeamContext } from "@/lib/teams";
import { AcceptInvite } from "./AcceptInvite";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ctx = await getTeamContext();
  if (!ctx.user) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  return <AcceptInvite token={token} email={ctx.user.email} />;
}
