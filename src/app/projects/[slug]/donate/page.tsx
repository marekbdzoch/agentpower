import { notFound } from "next/navigation";
import Link from "next/link";
import { DonateClient } from "@/components/donate-client";
import { formatMoney } from "@/lib/project-generator";
import { getProjectDashboard } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DonatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dashboard = await getProjectDashboard(slug);

  if (!dashboard) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-8 text-[#16201b] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <div>
          <Link href={`/projects/${dashboard.project.slug}`} className="text-sm font-semibold text-[#1f7a55]">
            Back to dashboard
          </Link>
          <h1 className="mt-3 text-4xl font-semibold">Fund {dashboard.project.name}</h1>
          <p className="mt-3 max-w-2xl text-[#526158]">
            Donations are recorded in the local treasury ledger as a mock Stripe payment. Current balance:
            {" "}<span className="font-semibold text-[#16201b]">{formatMoney(dashboard.balanceCents)}</span>.
          </p>
        </div>
        <DonateClient
          projectId={dashboard.project.id}
          gateway={dashboard.paymentGateways.find((gateway) => gateway.enabled)}
          powerPricing={dashboard.powerPricing}
        />
      </div>
    </main>
  );
}
