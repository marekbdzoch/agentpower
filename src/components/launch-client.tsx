"use client";

import {
  Banknote,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Cpu,
  CreditCard,
  Gauge,
  GitBranch,
  GitPullRequest,
  Play,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/project-generator";
import type { ProjectDashboard } from "@/lib/types";

type Props = {
  initialDashboards: ProjectDashboard[];
};

type LaunchResponse = {
  project: ProjectDashboard["project"];
};

export function LaunchClient({ initialDashboards }: Props) {
  const [dashboards, setDashboards] = useState<ProjectDashboard[]>(initialDashboards);
  const [selectedSlug, setSelectedSlug] = useState(initialDashboards[0]?.project.slug ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Ready to launch an autonomous open-source project.");

  const selected = useMemo(
    () => dashboards.find((dashboard) => dashboard.project.slug === selectedSlug) ?? dashboards[0],
    [dashboards, selectedSlug],
  );

  async function refreshDashboard(slug: string) {
    const response = await fetch(`/api/project-dashboards/${slug}`, { cache: "no-store" });
    const dashboard = (await response.json()) as ProjectDashboard;

    setDashboards((current) => {
      const others = current.filter((item) => item.project.id !== dashboard.project.id);
      return [dashboard, ...others];
    });
    setSelectedSlug(slug);
  }

  async function launchProject(formData: FormData) {
    setBusy(true);
    setMessage("Generating Project Brain, mock GitHub repo, docs, issues, and treasury ledger...");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          idea: formData.get("idea"),
          targetUsers: formData.get("targetUsers"),
          budgetCents: Number(formData.get("budgetDollars")) * 100,
          autonomyLevel: Number(formData.get("autonomyLevel")),
          license: formData.get("license"),
          stackPreference: formData.get("stackPreference"),
          requirements: formData.get("requirements"),
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = (await response.json()) as LaunchResponse;
      await refreshDashboard(result.project.slug);
      setMessage("Project launched. Initial issues and generated documentation are ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Launch failed.");
    } finally {
      setBusy(false);
    }
  }

  async function enqueueTask(taskId: string, slug: string) {
    setBusy(true);
    setMessage("Builder Agent, Review Agent, Security Agent, and CI status check are running...");

    try {
      const response = await fetch(`/api/tasks/${taskId}/enqueue`, { method: "POST" });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await refreshDashboard(slug);
      setMessage("Agent workflow finished and opened a pull request for maintainer review.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Agent workflow failed.");
    } finally {
      setBusy(false);
    }
  }

  async function decidePullRequest(id: string, slug: string, decision: "merge" | "reject" | "retry") {
    setBusy(true);
    setMessage(`Maintainer decision submitted: ${decision}.`);

    try {
      const response = await fetch(`/api/pull-requests/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await refreshDashboard(slug);
      setMessage("Maintainer gate updated the PR and task state.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Decision failed.");
    } finally {
      setBusy(false);
    }
  }

  async function donate(projectId: string, slug: string) {
    setBusy(true);
    setMessage("Recording power day purchase...");

    const dashboard = dashboards.find((item) => item.project.id === projectId);
    const amountCents = dashboard?.powerPricing.pricePerDayCents ?? 1500;

    try {
      const response = await fetch(`/api/projects/${projectId}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, contributorName: "Power day buyer" }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await refreshDashboard(slug);
      setMessage("Power day purchase recorded in the public treasury ledger.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Donation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function contributeCompute(projectId: string, slug: string) {
    setBusy(true);
    setMessage("Recording mock compute worker pledge...");

    try {
      const response = await fetch(`/api/projects/${projectId}/compute-contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorName: "Demo worker",
          type: "worker",
          limits: "2 sandboxed agent jobs/day, no secrets, maintainer activation required",
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await refreshDashboard(slug);
      setMessage("Compute worker pledge recorded for maintainer approval.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Compute pledge failed.");
    } finally {
      setBusy(false);
    }
  }

  async function connectGateway(projectId: string, slug: string, formData: FormData) {
    setBusy(true);
    setMessage("Connecting project payment gateway...");

    try {
      const response = await fetch(`/api/projects/${projectId}/payment-gateways`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: formData.get("provider"),
          mode: formData.get("mode"),
          displayName: formData.get("displayName"),
          publishableKey: formData.get("publishableKey"),
          secretKey: formData.get("secretKey"),
          webhookSecret: formData.get("webhookSecret"),
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await refreshDashboard(slug);
      setMessage("Payment gateway connected. Future donations will use the active provider.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gateway connection failed.");
    } finally {
      setBusy(false);
    }
  }

  async function connectModelProvider(projectId: string, slug: string, formData: FormData) {
    setBusy(true);
    setMessage("Connecting model provider and recalculating power day price...");

    try {
      const response = await fetch(`/api/projects/${projectId}/model-providers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: formData.get("provider"),
          displayName: formData.get("displayName"),
          apiKey: formData.get("apiKey"),
          baseUrl: formData.get("baseUrl"),
          primaryModel: formData.get("primaryModel"),
          fallbackModel: formData.get("fallbackModel"),
          costPerPowerDayCents: Number(formData.get("costPerPowerDayDollars")) * 100,
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await refreshDashboard(slug);
      setMessage("Model provider connected and power day economics updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Model provider setup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function updatePricing(projectId: string, slug: string, formData: FormData) {
    setBusy(true);
    setMessage("Updating power day pricing...");

    try {
      const response = await fetch(`/api/projects/${projectId}/power-pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includedAgentRuns: Number(formData.get("includedAgentRuns")),
          platformMarginPercent: Number(formData.get("platformMarginPercent")),
          ownerMarginPercent: Number(formData.get("ownerMarginPercent")),
          minimumPriceCents: Number(formData.get("minimumPriceDollars")) * 100,
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await refreshDashboard(slug);
      setMessage("Power day price updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pricing update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#16201b]">
      <section className="border-b border-[#d8d7c9] bg-[#11231d] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[#9bd6bd]">AgentPower MVP</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                Community-funded open source, delivered through agent pull requests.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#dce8df]">
                Launch a project, generate its repo plan, seed issues, run mock builder and review agents, record
                donations, and keep maintainers in control of every merge.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Projects" value={dashboards.length.toString()} />
              <Metric
                label="Open PRs"
                value={dashboards
                  .reduce((sum, dashboard) => sum + dashboard.pullRequests.filter((pr) => pr.status === "open").length, 0)
                  .toString()}
              />
              <Metric
                label="Treasury"
                value={formatMoney(dashboards.reduce((sum, dashboard) => sum + dashboard.balanceCents, 0))}
              />
            </div>
          </div>
          <form action={launchProject} className="grid gap-4 rounded-lg bg-white p-5 text-[#16201b] shadow-2xl">
            <div className="flex items-center gap-2">
              <GitBranch className="size-5 text-[#1f7a55]" />
              <h2 className="text-xl font-semibold">Project Wizard</h2>
            </div>
            <Field name="name" label="Project name" defaultValue="Open Maintainer Copilot" />
            <label className="grid gap-1 text-sm font-medium">
              Idea
              <textarea
                name="idea"
                defaultValue="A tool that turns maintainer goals into reviewed open-source pull requests funded by the community."
                className="min-h-20 resize-none rounded-md border border-[#c9c8ba] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f7a55]"
              />
            </label>
            <Field name="targetUsers" label="Target users" defaultValue="Project founders, maintainers, supporters" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field name="budgetDollars" label="Budget USD" defaultValue="250" type="number" />
              <Field name="autonomyLevel" label="Autonomy" defaultValue="1" type="number" min="0" max="5" />
              <Field name="license" label="License" defaultValue="MIT" />
            </div>
            <Field
              name="stackPreference"
              label="Stack"
              defaultValue="Next.js, TypeScript, PostgreSQL, Redis/BullMQ, Docker"
            />
            <label className="grid gap-1 text-sm font-medium">
              Requirements
              <textarea
                name="requirements"
                defaultValue="Wizard, GitHub mock, docs, issues, task queue, builder agent, review gate, donations, dashboard."
                className="min-h-20 resize-none rounded-md border border-[#c9c8ba] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f7a55]"
              />
            </label>
            <button
              disabled={busy}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1f7a55] px-4 text-sm font-semibold text-white transition hover:bg-[#185f43] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className="size-4" />
              Launch project
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-[#d8d7c9] bg-white p-4">
          <p className="text-sm font-semibold text-[#627064]">Projects</p>
          <div className="mt-3 grid gap-2">
            {dashboards.length === 0 ? (
              <p className="text-sm text-[#627064]">Launch the first project to populate the local database.</p>
            ) : (
              dashboards.map((dashboard) => (
                <button
                  key={dashboard.project.id}
                  onClick={() => setSelectedSlug(dashboard.project.slug)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                    selected?.project.id === dashboard.project.id
                      ? "border-[#1f7a55] bg-[#e7f3ed]"
                      : "border-[#dfded1] hover:border-[#9aa493]"
                  }`}
                >
                  <span className="block font-semibold">{dashboard.project.name}</span>
                  <span className="font-mono text-xs text-[#627064]">Level {dashboard.project.autonomyLevel}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="grid gap-6">
          <div className="rounded-lg border border-[#d8d7c9] bg-white px-4 py-3 text-sm text-[#334139]">
            {message}
          </div>

          {selected ? (
            <ProjectPanel
              dashboard={selected}
              busy={busy}
              onEnqueue={enqueueTask}
              onDonate={donate}
              onCompute={contributeCompute}
              onGatewayConnect={connectGateway}
              onModelProviderConnect={connectModelProvider}
              onPricingUpdate={updatePricing}
              onDecision={decidePullRequest}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-[#c9c8ba] bg-white p-8 text-center text-[#627064]">
              No project yet. Use the wizard to launch the MVP workflow.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ProjectPanel({
  dashboard,
  busy,
  onEnqueue,
  onDonate,
  onCompute,
  onGatewayConnect,
  onModelProviderConnect,
  onPricingUpdate,
  onDecision,
}: {
  dashboard: ProjectDashboard;
  busy: boolean;
  onEnqueue: (taskId: string, slug: string) => void;
  onDonate: (projectId: string, slug: string) => void;
  onCompute: (projectId: string, slug: string) => void;
  onGatewayConnect: (projectId: string, slug: string, formData: FormData) => void;
  onModelProviderConnect: (projectId: string, slug: string, formData: FormData) => void;
  onPricingUpdate: (projectId: string, slug: string, formData: FormData) => void;
  onDecision: (pullRequestId: string, slug: string, decision: "merge" | "reject" | "retry") => void;
}) {
  const { project, brain } = dashboard;
  const computeContributions = dashboard.computeContributions ?? [];
  const paymentGateways = dashboard.paymentGateways ?? [];
  const activeGateway = paymentGateways.find((gateway) => gateway.enabled);
  const modelProviders = dashboard.modelProviders ?? [];
  const activeModelProvider = modelProviders.find((provider) => provider.enabled);
  const powerPricing = dashboard.powerPricing;

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-[#d8d7c9] bg-white p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#1f7a55]">{project.githubFullName}</p>
            <h2 className="mt-2 text-3xl font-semibold">{project.name}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#526158]">{brain.mission}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/projects/${project.slug}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#c9c8ba] px-3 text-sm font-semibold hover:bg-[#f2f2ea]"
            >
              <GitBranch className="size-4" />
              Public dashboard
            </Link>
            <button
              disabled={busy}
              onClick={() => onDonate(project.id, project.slug)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#b84d31] px-3 text-sm font-semibold text-white hover:bg-[#913b25] disabled:opacity-60"
            >
              <CircleDollarSign className="size-4" />
              Buy 1 power day
            </button>
            <button
              disabled={busy}
              onClick={() => onCompute(project.id, project.slug)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#315c8a] px-3 text-sm font-semibold text-white hover:bg-[#27496e] disabled:opacity-60"
            >
              <Cpu className="size-4" />
              Mock worker
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Metric label="Balance" value={formatMoney(dashboard.balanceCents)} light />
          <Metric label="Tasks" value={dashboard.tasks.length.toString()} light />
          <Metric label="Power balance" value={`${dashboard.powerBalanceDays}d`} light />
          <Metric label="Power day" value={formatMoney(powerPricing.pricePerDayCents)} light />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <Section title="Task Queue" icon={<Bot className="size-5" />}>
            <div className="grid gap-3">
              {dashboard.tasks.map((task) => (
                <div key={task.id} className="rounded-md border border-[#dfded1] p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="font-mono text-xs text-[#627064]">Issue #{task.githubIssueNumber}</p>
                      <h3 className="mt-1 font-semibold">{task.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#526158]">{task.body}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge tone={task.riskLevel === "low" ? "green" : "amber"}>{task.riskLevel}</Badge>
                      <Badge>{task.status}</Badge>
                      {(task.status === "ready" || task.status === "rejected") && (
                        <button
                          disabled={busy}
                          onClick={() => onEnqueue(task.id, project.slug)}
                          className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1f7a55] px-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          <Play className="size-4" />
                          Run agents
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Maintainer Gate" icon={<GitPullRequest className="size-5" />}>
            <div className="grid gap-3">
              {dashboard.pullRequests.length === 0 ? (
                <p className="text-sm text-[#627064]">Run an agent workflow to open the first pull request.</p>
              ) : (
                dashboard.pullRequests.map((pullRequest) => {
                  const report = dashboard.reviewReports.find((item) => item.pullRequestId === pullRequest.id);
                  return (
                    <div key={pullRequest.id} className="rounded-md border border-[#dfded1] p-4">
                      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                        <div>
                          <p className="font-mono text-xs text-[#627064]">
                            PR #{pullRequest.number} · {pullRequest.branch}
                          </p>
                          <h3 className="mt-1 font-semibold">{pullRequest.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-[#526158]">{report?.summary}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge tone="green">CI {pullRequest.ciState}</Badge>
                            <Badge tone={pullRequest.reviewState === "human_review" ? "amber" : "green"}>
                              {pullRequest.reviewState}
                            </Badge>
                            <Badge>{pullRequest.status}</Badge>
                          </div>
                        </div>
                        {pullRequest.status === "open" && (
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <IconButton
                              label="Merge"
                              disabled={busy}
                              onClick={() => onDecision(pullRequest.id, project.slug, "merge")}
                              icon={<CheckCircle2 className="size-4" />}
                            />
                            <IconButton
                              label="Retry"
                              disabled={busy}
                              onClick={() => onDecision(pullRequest.id, project.slug, "retry")}
                              icon={<RefreshCcw className="size-4" />}
                            />
                            <IconButton
                              label="Reject"
                              disabled={busy}
                              onClick={() => onDecision(pullRequest.id, project.slug, "reject")}
                              icon={<XCircle className="size-4" />}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Section>
        </div>

        <div className="grid h-fit gap-6">
          <Section title="Project Brain" icon={<ShieldCheck className="size-5" />}>
            <div className="grid gap-4 text-sm text-[#526158]">
              <div>
                <p className="font-semibold text-[#16201b]">Stack</p>
                <p>{brain.stack.join(", ")}</p>
              </div>
              <div>
                <p className="font-semibold text-[#16201b]">Generated docs</p>
                <ul className="mt-1 grid gap-1 font-mono text-xs">
                  {brain.documents.map((document) => (
                    <li key={document.path}>{document.path}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-[#16201b]">Security policy</p>
                <ul className="mt-1 grid gap-1">
                  {brain.securityPolicy.slice(0, 3).map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section title="Treasury" icon={<Banknote className="size-5" />}>
            <div className="grid gap-2 text-sm">
              {dashboard.treasury.map((entry) => (
                <div key={entry.id} className="flex justify-between gap-4 rounded-md bg-[#f7f7f2] px-3 py-2">
                  <span className="text-[#526158]">{entry.description}</span>
                  <span className={entry.amountCents >= 0 ? "font-semibold text-[#1f7a55]" : "font-semibold text-[#b84d31]"}>
                    {formatMoney(entry.amountCents)}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Payment Gateways" icon={<CreditCard className="size-5" />}>
            <div className="grid gap-3 text-sm">
              <div className="rounded-md bg-[#f7f7f2] px-3 py-2">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">{activeGateway?.displayName ?? "Mock Gateway"}</span>
                  <span className="font-mono text-xs text-[#1f7a55]">{activeGateway?.provider ?? "mock"}</span>
                </div>
                <p className="mt-1 text-[#526158]">
                  {activeGateway?.checkoutSessionMode ?? "mock"} · {activeGateway?.mode ?? "test"}
                </p>
              </div>
              <form action={(formData) => onGatewayConnect(project.id, project.slug, formData)} className="grid gap-2">
                <input type="hidden" name="provider" value="stripe" />
                <label className="grid gap-1 font-medium">
                  Display name
                  <input
                    name="displayName"
                    defaultValue="Stripe"
                    className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                  />
                </label>
                <label className="grid gap-1 font-medium">
                  Mode
                  <select name="mode" defaultValue="test" className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm">
                    <option value="test">test</option>
                    <option value="live">live</option>
                  </select>
                </label>
                <label className="grid gap-1 font-medium">
                  Publishable key
                  <input
                    name="publishableKey"
                    placeholder="pk_test_..."
                    className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                  />
                </label>
                <label className="grid gap-1 font-medium">
                  Secret or restricted key
                  <input
                    name="secretKey"
                    type="password"
                    placeholder="sk_test_... or rk_test_..."
                    className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                  />
                </label>
                <label className="grid gap-1 font-medium">
                  Webhook signing secret
                  <input
                    name="webhookSecret"
                    type="password"
                    placeholder="whsec_..."
                    className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                  />
                </label>
                <button
                  disabled={busy}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#315c8a] px-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <CreditCard className="size-4" />
                  Connect Stripe
                </button>
              </form>
            </div>
          </Section>

          <Section title="Runtime Economy" icon={<Gauge className="size-5" />}>
            <div className="grid gap-3 text-sm">
              <div className="rounded-md bg-[#f7f7f2] px-3 py-2">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">{activeModelProvider?.displayName ?? "OpenAI-compatible"}</span>
                  <span className="font-mono text-xs text-[#315c8a]">{activeModelProvider?.provider ?? "openai"}</span>
                </div>
                <p className="mt-1 text-[#526158]">
                  {activeModelProvider?.primaryModel ?? "gpt-5-mini"} · cost {formatMoney(powerPricing.baseCostCents)}/day
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Metric label="Base cost" value={formatMoney(powerPricing.baseCostCents)} light />
                <Metric label="Sell price" value={formatMoney(powerPricing.pricePerDayCents)} light />
              </div>
              <div className="rounded-md bg-[#e7f3ed] px-3 py-2">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">Available power</span>
                  <span className="font-mono text-xs text-[#1f7a55]">{dashboard.powerBalanceDays} days</span>
                </div>
                <p className="mt-1 text-[#526158]">
                  Purchases add power days. Agent workflows consume fractional power days based on included runs.
                </p>
              </div>

              <form action={(formData) => onModelProviderConnect(project.id, project.slug, formData)} className="grid gap-2">
                <label className="grid gap-1 font-medium">
                  Model provider
                  <select name="provider" defaultValue="openai" className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm">
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="local">Local LLM</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                <label className="grid gap-1 font-medium">
                  Display name
                  <input
                    name="displayName"
                    defaultValue={activeModelProvider?.displayName ?? "OpenAI"}
                    className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                  />
                </label>
                <label className="grid gap-1 font-medium">
                  API key
                  <input
                    name="apiKey"
                    type="password"
                    placeholder="sk-..., anthropic-..., or provider key"
                    className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                  />
                </label>
                <label className="grid gap-1 font-medium">
                  Base URL
                  <input
                    name="baseUrl"
                    placeholder="https://api.openai.com/v1"
                    defaultValue={activeModelProvider?.baseUrl ?? "https://api.openai.com/v1"}
                    className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                  />
                </label>
                <label className="grid gap-1 font-medium">
                  Primary model
                  <input
                    name="primaryModel"
                    defaultValue={activeModelProvider?.primaryModel ?? "gpt-5-mini"}
                    className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                  />
                </label>
                <label className="grid gap-1 font-medium">
                  Cost per power day USD
                  <input
                    name="costPerPowerDayDollars"
                    type="number"
                    step="0.01"
                    defaultValue={(powerPricing.baseCostCents / 100).toFixed(2)}
                    className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                  />
                </label>
                <button
                  disabled={busy}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#315c8a] px-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Gauge className="size-4" />
                  Connect model
                </button>
              </form>

              <form action={(formData) => onPricingUpdate(project.id, project.slug, formData)} className="grid gap-2 border-t border-[#dfded1] pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 font-medium">
                    Runs/day
                    <input
                      name="includedAgentRuns"
                      type="number"
                      defaultValue={powerPricing.includedAgentRuns}
                      className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 font-medium">
                    Min price USD
                    <input
                      name="minimumPriceDollars"
                      type="number"
                      step="0.01"
                      defaultValue={(powerPricing.minimumPriceCents / 100).toFixed(2)}
                      className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 font-medium">
                    Platform %
                    <input
                      name="platformMarginPercent"
                      type="number"
                      defaultValue={powerPricing.platformMarginPercent}
                      className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 font-medium">
                    Owner %
                    <input
                      name="ownerMarginPercent"
                      type="number"
                      defaultValue={powerPricing.ownerMarginPercent}
                      className="h-9 rounded-md border border-[#c9c8ba] px-3 text-sm"
                    />
                  </label>
                </div>
                <button
                  disabled={busy}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-[#c9c8ba] bg-white px-3 text-sm font-semibold hover:bg-[#f2f2ea] disabled:opacity-60"
                >
                  Update pricing
                </button>
              </form>
              <div className="grid gap-2 border-t border-[#dfded1] pt-3">
                <p className="font-semibold">Power ledger</p>
                {dashboard.powerLedger.length === 0 ? (
                  <p className="text-[#627064]">No power day purchases or agent spend yet.</p>
                ) : (
                  dashboard.powerLedger.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex justify-between gap-3 rounded-md bg-[#f7f7f2] px-3 py-2">
                      <span className="text-[#526158]">{entry.description}</span>
                      <span className={entry.powerDays >= 0 ? "font-semibold text-[#1f7a55]" : "font-semibold text-[#b84d31]"}>
                        {entry.powerDays > 0 ? "+" : ""}
                        {entry.powerDays}d
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Section>

          <Section title="Compute" icon={<Cpu className="size-5" />}>
            <div className="grid gap-2 text-sm">
              {computeContributions.length === 0 ? (
                <p className="text-[#627064]">No external worker or token contribution has been pledged yet.</p>
              ) : (
                computeContributions.map((contribution) => (
                  <div key={contribution.id} className="rounded-md bg-[#f7f7f2] px-3 py-2">
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">{contribution.contributorName}</span>
                      <span className="font-mono text-xs text-[#315c8a]">{contribution.type}</span>
                    </div>
                    <p className="mt-1 text-[#526158]">{contribution.limits}</p>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input
        {...props}
        className="h-10 rounded-md border border-[#c9c8ba] bg-white px-3 text-sm outline-none focus:border-[#1f7a55]"
      />
    </label>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d8d7c9] bg-white p-5">
      <div className="mb-4 flex items-center gap-2 text-[#1f7a55]">
        {icon}
        <h2 className="text-lg font-semibold text-[#16201b]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, light = false }: { label: string; value: string; light?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${light ? "border-[#dfded1] bg-[#f7f7f2]" : "border-white/15 bg-white/10"}`}>
      <p className={`text-xs uppercase tracking-[0.12em] ${light ? "text-[#627064]" : "text-[#bfe5d3]"}`}>{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "green" | "amber" }) {
  const className =
    tone === "green"
      ? "border-[#8dcaaa] bg-[#e7f3ed] text-[#185f43]"
      : tone === "amber"
        ? "border-[#e1bf78] bg-[#fff4d8] text-[#7a4d12]"
        : "border-[#c9c8ba] bg-[#f7f7f2] text-[#526158]";

  return <span className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-semibold ${className}`}>{children}</span>;
}

function IconButton({
  label,
  icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      {...props}
      title={label}
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-md border border-[#c9c8ba] bg-white text-[#334139] transition hover:bg-[#f2f2ea] disabled:opacity-60"
    >
      {icon}
    </button>
  );
}
