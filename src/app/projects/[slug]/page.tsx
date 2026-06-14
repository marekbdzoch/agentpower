import { notFound } from "next/navigation";
import { Banknote, Bot, Cpu, CreditCard, GitPullRequest, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/project-generator";
import { getProjectDashboard } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dashboard = await getProjectDashboard(slug);

  if (!dashboard) {
    notFound();
  }

  const activeGateway = dashboard.paymentGateways.find((gateway) => gateway.enabled);

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-8 text-[#16201b] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <div className="flex flex-col justify-between gap-4 rounded-lg border border-[#d8d7c9] bg-white p-6 md:flex-row md:items-start">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#1f7a55]">{dashboard.project.githubFullName}</p>
            <h1 className="mt-2 text-4xl font-semibold">{dashboard.project.name}</h1>
            <p className="mt-3 max-w-3xl text-[#526158]">{dashboard.brain.mission}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="rounded-md border border-[#c9c8ba] px-3 py-2 text-sm font-semibold hover:bg-[#f2f2ea]">
              App
            </Link>
            <Link
              href={`/projects/${dashboard.project.slug}/donate`}
              className="rounded-md bg-[#b84d31] px-3 py-2 text-sm font-semibold text-white hover:bg-[#913b25]"
            >
              Donate
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          <Card icon={<Banknote className="size-5" />} label="Treasury" value={formatMoney(dashboard.balanceCents)} />
          <Card icon={<Bot className="size-5" />} label="Agent runs" value={dashboard.agentRuns.length.toString()} />
          <Card icon={<GitPullRequest className="size-5" />} label="Pull requests" value={dashboard.pullRequests.length.toString()} />
          <Card icon={<Cpu className="size-5" />} label="Compute" value={dashboard.computeContributions.length.toString()} />
          <Card icon={<CreditCard className="size-5" />} label="Gateway" value={activeGateway?.provider ?? "mock"} />
          <Card icon={<Banknote className="size-5" />} label="Power day" value={formatMoney(dashboard.powerPricing.pricePerDayCents)} />
          <Card icon={<ShieldCheck className="size-5" />} label="Autonomy" value={`Level ${dashboard.project.autonomyLevel}`} />
        </div>

        <section className="rounded-lg border border-[#d8d7c9] bg-white p-6">
          <h2 className="text-xl font-semibold">Roadmap</h2>
          <div className="mt-4 grid gap-3">
            {dashboard.brain.roadmap.map((item, index) => (
              <div key={item} className="rounded-md border border-[#dfded1] p-4">
                <p className="font-mono text-xs text-[#627064]">Milestone {index + 1}</p>
                <p className="mt-1 font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#d8d7c9] bg-white p-6">
          <h2 className="text-xl font-semibold">Runtime Economy</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-[#dfded1] p-4">
              <p className="font-mono text-xs text-[#627064]">Power day price</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(dashboard.powerPricing.pricePerDayCents)}</p>
              <p className="mt-2 text-sm text-[#526158]">
                Includes {dashboard.powerPricing.includedAgentRuns} agent runs for this project.
              </p>
            </div>
            <div className="rounded-md border border-[#dfded1] p-4">
              <p className="font-mono text-xs text-[#627064]">Base model cost</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(dashboard.powerPricing.baseCostCents)}</p>
              <p className="mt-2 text-sm text-[#526158]">
                Estimated daily cost before platform and owner margin.
              </p>
            </div>
            <div className="rounded-md border border-[#dfded1] p-4">
              <p className="font-mono text-xs text-[#627064]">Active model</p>
              <p className="mt-1 text-2xl font-semibold">
                {dashboard.modelProviders.find((provider) => provider.enabled)?.provider ?? "openai"}
              </p>
              <p className="mt-2 text-sm text-[#526158]">
                Project owners can connect OpenAI, Anthropic, local, or custom providers.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#d8d7c9] bg-white p-6">
          <h2 className="text-xl font-semibold">Open Work</h2>
          <div className="mt-4 grid gap-3">
            {dashboard.tasks.map((task) => (
              <div key={task.id} className="rounded-md border border-[#dfded1] p-4">
                <p className="font-mono text-xs text-[#627064]">Issue #{task.githubIssueNumber} · {task.status}</p>
                <h3 className="mt-1 font-semibold">{task.title}</h3>
                <p className="mt-2 text-sm text-[#526158]">{task.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#d8d7c9] bg-white p-6">
          <h2 className="text-xl font-semibold">Compute Contributions</h2>
          <div className="mt-4 grid gap-3">
            {dashboard.computeContributions.length === 0 ? (
              <p className="text-sm text-[#526158]">No external worker, GPU, or token contribution has been pledged yet.</p>
            ) : (
              dashboard.computeContributions.map((contribution) => (
                <div key={contribution.id} className="rounded-md border border-[#dfded1] p-4">
                  <p className="font-mono text-xs text-[#627064]">{contribution.type} · {contribution.status}</p>
                  <h3 className="mt-1 font-semibold">{contribution.contributorName}</h3>
                  <p className="mt-2 text-sm text-[#526158]">{contribution.limits}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d8d7c9] bg-white p-4">
      <div className="text-[#1f7a55]">{icon}</div>
      <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#627064]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
