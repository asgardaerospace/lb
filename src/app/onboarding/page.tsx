import { CustomerOnboardingWizard } from "./CustomerOnboardingWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Launchbelt — Customer Onboarding",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const sp = await searchParams;
  const initialStep = Math.max(0, Math.min(8, Number(sp.step ?? 0) || 0));
  return <CustomerOnboardingWizard initialStep={initialStep} />;
}
