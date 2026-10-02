import { redirect } from "next/navigation";
import { getTeamContext } from "@/lib/teams";
import { OnboardingForms } from "./OnboardingForms";

export default async function OnboardingPage() {
  const ctx = await getTeamContext();
  if (!ctx.user) redirect("/login");
  if (ctx.active) redirect("/");
  return <OnboardingForms email={ctx.user.email} />;
}
