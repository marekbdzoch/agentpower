import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createMockRepository } from "@/lib/github-mock";
import { buildInitialTasks, buildProjectBrain, slugify } from "@/lib/project-generator";
import type {
  AgentRun,
  AppDatabase,
  ComputeContribution,
  CreateProjectInput,
  Donation,
  ModelProvider,
  ModelProviderConnection,
  PaymentGatewayConnection,
  PaymentGatewayMode,
  PaymentGatewayProvider,
  PowerPricing,
  Project,
  ProjectDashboard,
  PullRequest,
  ReviewDecision,
  ReviewReport,
  Task,
  TreasuryEntry,
} from "@/lib/types";

const DB_PATH = path.join(process.cwd(), "data", "agentpower-db.json");

const emptyDb = (): AppDatabase => ({
  projects: [],
  brains: [],
  tasks: [],
  agentRuns: [],
  pullRequests: [],
  reviewReports: [],
  donations: [],
  treasury: [],
  computeContributions: [],
  paymentGateways: [],
  modelProviders: [],
  powerPricing: [],
});

async function readDb(): Promise<AppDatabase> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    return normalizeDb(JSON.parse(raw) as Partial<AppDatabase>);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    const db = emptyDb();
    await writeDb(db);
    return db;
  }
}

function normalizeDb(db: Partial<AppDatabase>): AppDatabase {
  return {
    ...emptyDb(),
    ...db,
    projects: db.projects ?? [],
    brains: db.brains ?? [],
    tasks: db.tasks ?? [],
    agentRuns: db.agentRuns ?? [],
    pullRequests: db.pullRequests ?? [],
    reviewReports: db.reviewReports ?? [],
    donations: (db.donations ?? []).map((donation) => ({
      ...donation,
      paymentProvider: donation.paymentProvider ?? ("mock" as const),
      externalReference: donation.externalReference ?? `mock_${donation.id}`,
    })),
    treasury: db.treasury ?? [],
    computeContributions: db.computeContributions ?? [],
    paymentGateways: db.paymentGateways ?? [],
    modelProviders: db.modelProviders ?? [],
    powerPricing: db.powerPricing ?? [],
  };
}

async function writeDb(db: AppDatabase) {
  await mkdir(path.dirname(DB_PATH), { recursive: true });
  await writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`);
}

async function updateDb<T>(mutator: (db: AppDatabase) => T | Promise<T>) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}

function uniqueSlug(name: string, projects: Project[]) {
  const base = slugify(name) || "autonomous-project";
  let candidate = base;
  let suffix = 2;

  while (projects.some((project) => project.slug === candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function listProjects() {
  const db = await readDb();
  return db.projects.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProjectDashboard(slug: string): Promise<ProjectDashboard | null> {
  const db = await readDb();
  const project = db.projects.find((item) => item.slug === slug || item.id === slug);

  if (!project) {
    return null;
  }

  const treasury = db.treasury.filter((entry) => entry.projectId === project.id);
  const balanceCents = treasury.reduce((sum, entry) => sum + entry.amountCents, 0);
  const modelProviders = db.modelProviders
    .filter((provider) => provider.projectId === project.id)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const powerPricing = getPowerPricing(db, project.id);

  return {
    project,
    brain: db.brains.find((brain) => brain.projectId === project.id)!,
    tasks: db.tasks
      .filter((task) => task.projectId === project.id)
      .toSorted((a, b) => a.priority - b.priority),
    pullRequests: db.pullRequests
      .filter((pullRequest) => pullRequest.projectId === project.id)
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)),
    reviewReports: db.reviewReports,
    agentRuns: db.agentRuns
      .filter((run) => run.projectId === project.id)
      .toSorted((a, b) => b.startedAt.localeCompare(a.startedAt)),
    donations: db.donations
      .filter((donation) => donation.projectId === project.id)
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)),
    computeContributions: db.computeContributions
      .filter((contribution) => contribution.projectId === project.id)
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)),
    treasury,
    paymentGateways: db.paymentGateways
      .filter((gateway) => gateway.projectId === project.id)
      .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    modelProviders,
    powerPricing,
    balanceCents,
  };
}

export async function createProject(input: CreateProjectInput) {
  return updateDb((db) => {
    const slug = uniqueSlug(input.name, db.projects);
    const repo = createMockRepository(slug);
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      slug,
      name: input.name,
      idea: input.idea,
      status: "active",
      autonomyLevel: input.autonomyLevel,
      budgetCents: input.budgetCents,
      license: input.license,
      targetUsers: input.targetUsers,
      stackPreference: input.stackPreference,
      requirements: input.requirements,
      githubRepoId: repo.id,
      githubFullName: repo.fullName,
      githubUrl: repo.url,
      createdAt: now,
    };

    const brain = buildProjectBrain(project);
    const tasks = buildInitialTasks(project, brain);

    db.projects.push(project);
    db.brains.push(brain);
    db.tasks.push(...tasks);
    db.treasury.push({
      id: crypto.randomUUID(),
      projectId: project.id,
      entryType: "founder_budget",
      amountCents: input.budgetCents,
      currency: "usd",
      description: "Founder starting budget reserved for agent runtime",
      createdAt: now,
    });
    db.paymentGateways.push(createMockGateway(project.id, now));
    db.modelProviders.push(createDefaultModelProvider(project.id, now));
    db.powerPricing.push(createDefaultPowerPricing(project.id, now));

    return { project, brain, tasks };
  });
}

export async function addDonation(projectId: string, amountCents: number, contributorName: string) {
  return updateDb((db) => {
    const project = db.projects.find((item) => item.id === projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    const now = new Date().toISOString();
    const gateway = getActivePaymentGateway(db, projectId);
    const donation: Donation = {
      id: crypto.randomUUID(),
      projectId,
      paymentGatewayId: gateway.id,
      paymentProvider: gateway.provider,
      externalReference: createGatewayReference(gateway.provider),
      amountCents,
      currency: "usd",
      targetType: "runtime",
      contributorName: contributorName || "Anonymous supporter",
      status: "succeeded",
      createdAt: now,
    };
    const entry: TreasuryEntry = {
      id: crypto.randomUUID(),
      projectId,
      entryType: "donation",
      amountCents,
      currency: "usd",
      description: `Mock Stripe donation from ${donation.contributorName}`,
      createdAt: now,
    };

    db.donations.push(donation);
    db.treasury.push(entry);
    return donation;
  });
}

export async function connectModelProvider(
  projectId: string,
  input: {
    provider: ModelProvider;
    displayName: string;
    apiKey?: string;
    baseUrl?: string;
    primaryModel: string;
    fallbackModel?: string;
    costPerPowerDayCents: number;
  },
) {
  return updateDb((db) => {
    const project = db.projects.find((item) => item.id === projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    const now = new Date().toISOString();
    const existing = db.modelProviders.find(
      (provider) => provider.projectId === projectId && provider.provider === input.provider,
    );
    const connection: ModelProviderConnection = {
      id: existing?.id ?? crypto.randomUUID(),
      projectId,
      provider: input.provider,
      displayName: input.displayName || modelProviderDisplayName(input.provider),
      status: input.provider === "local" || input.apiKey ? "connected" : "needs_key",
      apiKeyMasked: maskSecret(input.apiKey),
      apiKeyFingerprint: input.apiKey ? fingerprintSecret(input.apiKey) : existing?.apiKeyFingerprint,
      baseUrl: input.baseUrl || defaultBaseUrl(input.provider),
      primaryModel: input.primaryModel || defaultModel(input.provider),
      fallbackModel: input.fallbackModel || undefined,
      costPerPowerDayCents: Math.max(0, input.costPerPowerDayCents),
      enabled: true,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    db.modelProviders = db.modelProviders
      .filter((item) => !(item.projectId === projectId && item.provider === input.provider))
      .map((item) => (item.projectId === projectId ? { ...item, enabled: false, updatedAt: now } : item));
    db.modelProviders.push(connection);
    recalculatePowerPricing(db, projectId);
    return { connection, powerPricing: getPowerPricing(db, projectId) };
  });
}

export async function updatePowerPricing(
  projectId: string,
  input: {
    includedAgentRuns: number;
    platformMarginPercent: number;
    ownerMarginPercent: number;
    minimumPriceCents: number;
  },
) {
  return updateDb((db) => {
    const project = db.projects.find((item) => item.id === projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    const current = getPowerPricing(db, projectId);
    const updated: PowerPricing = {
      ...current,
      includedAgentRuns: Math.max(1, input.includedAgentRuns),
      platformMarginPercent: Math.max(0, input.platformMarginPercent),
      ownerMarginPercent: Math.max(0, input.ownerMarginPercent),
      minimumPriceCents: Math.max(0, input.minimumPriceCents),
      updatedAt: new Date().toISOString(),
    };

    db.powerPricing = db.powerPricing.filter((pricing) => pricing.projectId !== projectId);
    db.powerPricing.push(updated);
    recalculatePowerPricing(db, projectId);
    return getPowerPricing(db, projectId);
  });
}

export async function connectPaymentGateway(
  projectId: string,
  input: {
    provider: PaymentGatewayProvider;
    mode: PaymentGatewayMode;
    displayName: string;
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  },
) {
  return updateDb((db) => {
    const project = db.projects.find((item) => item.id === projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    const now = new Date().toISOString();
    const existing = db.paymentGateways.find(
      (gateway) => gateway.projectId === projectId && gateway.provider === input.provider,
    );
    const gateway: PaymentGatewayConnection = {
      id: existing?.id ?? crypto.randomUUID(),
      projectId,
      provider: input.provider,
      mode: input.mode,
      displayName: input.displayName || providerDisplayName(input.provider),
      status: input.provider === "mock" || input.secretKey ? "connected" : "needs_keys",
      publishableKeyMasked: maskSecret(input.publishableKey),
      secretKeyMasked: maskSecret(input.secretKey),
      secretKeyFingerprint: input.secretKey ? fingerprintSecret(input.secretKey) : existing?.secretKeyFingerprint,
      webhookSecretMasked: maskSecret(input.webhookSecret),
      checkoutSessionMode: input.provider === "stripe" && input.secretKey ? "real_ready" : "mock",
      enabled: true,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    db.paymentGateways = db.paymentGateways
      .filter((item) => !(item.projectId === projectId && item.provider === input.provider))
      .map((item) => (item.projectId === projectId ? { ...item, enabled: false, updatedAt: now } : item));
    db.paymentGateways.push(gateway);
    return gateway;
  });
}

export async function addComputeContribution(
  projectId: string,
  contributorName: string,
  type: ComputeContribution["type"],
  limits: string,
) {
  return updateDb((db) => {
    const project = db.projects.find((item) => item.id === projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    const contribution: ComputeContribution = {
      id: crypto.randomUUID(),
      projectId,
      contributorName: contributorName || "Community compute contributor",
      type,
      status: "pledged",
      limits: limits || "Manual maintainer approval before activation",
      createdAt: new Date().toISOString(),
    };

    db.computeContributions.push(contribution);
    return contribution;
  });
}

export async function enqueueTask(taskId: string) {
  return updateDb((db) => {
    const task = db.tasks.find((item) => item.id === taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status === "merged") {
      throw new Error("Task is already merged");
    }

    task.status = "review";
    const now = new Date().toISOString();
    const builderRun = createAgentRun(task, "builder", "completed", "Implemented the assigned task in a mock agent workspace.", 145);
    const reviewRun = createAgentRun(task, "review", "completed", "Reviewed diff, test evidence, scope, and risk gates.", 80);
    const securityRun = createAgentRun(task, "security", "completed", "Checked high-risk files and protected change categories.", 40);
    const prNumber = db.pullRequests.filter((pr) => pr.projectId === task.projectId).length + 1;
    const branch = `agent/task-${task.githubIssueNumber}-${slugify(task.title).slice(0, 32)}`;
    const decision = reviewDecisionForTask(task);
    const pullRequest: PullRequest = {
      id: crypto.randomUUID(),
      projectId: task.projectId,
      taskId: task.id,
      number: prNumber,
      title: `Agent PR: ${task.title}`,
      branch,
      status: "open",
      ciState: "success",
      reviewState: decision,
      riskLevel: task.riskLevel,
      url: `https://github.com/mock/pull/${prNumber}`,
      createdAt: now,
    };
    const report: ReviewReport = {
      id: crypto.randomUUID(),
      pullRequestId: pullRequest.id,
      summary:
        decision === "human_review"
          ? "Review Gate blocked automatic approval because the task touches medium/high-risk implementation areas."
          : "Review Gate found the PR scoped, testable, and ready for maintainer review.",
      findings: [
        "Task reference is present.",
        "CI status check is modeled as successful.",
        "Generated diff remains scoped to the assigned issue.",
      ],
      riskFlags:
        task.riskLevel === "low"
          ? []
          : ["Medium/high risk tasks require explicit maintainer approval in MVP Level 1."],
      decision,
      createdAt: now,
    };

    db.agentRuns.push(builderRun, reviewRun, securityRun);
    db.pullRequests.push(pullRequest);
    db.reviewReports.push(report);
    db.treasury.push({
      id: crypto.randomUUID(),
      projectId: task.projectId,
      entryType: "agent_cost",
      amountCents: -builderRun.costCents - reviewRun.costCents - securityRun.costCents,
      currency: "usd",
      description: `Agent runtime for issue #${task.githubIssueNumber}`,
      createdAt: now,
    });

    return { task, pullRequest, report };
  });
}

export async function decidePullRequest(pullRequestId: string, decision: "merge" | "reject" | "retry") {
  return updateDb((db) => {
    const pullRequest = db.pullRequests.find((item) => item.id === pullRequestId);

    if (!pullRequest) {
      throw new Error("Pull request not found");
    }

    const task = db.tasks.find((item) => item.id === pullRequest.taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    if (decision === "merge") {
      pullRequest.status = "merged";
      task.status = "merged";
    }

    if (decision === "reject") {
      pullRequest.status = "rejected";
      task.status = "rejected";
    }

    if (decision === "retry") {
      pullRequest.status = "retry_requested";
      task.status = "ready";
    }

    return { pullRequest, task };
  });
}

function createAgentRun(
  task: Task,
  agentType: AgentRun["agentType"],
  status: AgentRun["status"],
  summary: string,
  costCents: number,
): AgentRun {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    taskId: task.id,
    projectId: task.projectId,
    agentType,
    status,
    summary,
    costCents,
    startedAt: now,
    finishedAt: now,
  };
}

function reviewDecisionForTask(task: Task): ReviewDecision {
  if (task.riskLevel === "high" || task.riskLevel === "medium") {
    return "human_review";
  }

  return "merge";
}

function createMockGateway(projectId: string, now: string): PaymentGatewayConnection {
  return {
    id: crypto.randomUUID(),
    projectId,
    provider: "mock",
    mode: "test",
    displayName: "Mock Gateway",
    status: "connected",
    checkoutSessionMode: "mock",
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

function createDefaultModelProvider(projectId: string, now: string): ModelProviderConnection {
  return {
    id: crypto.randomUUID(),
    projectId,
    provider: "openai",
    displayName: "OpenAI-compatible",
    status: "needs_key",
    baseUrl: defaultBaseUrl("openai"),
    primaryModel: defaultModel("openai"),
    costPerPowerDayCents: 900,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

function createDefaultPowerPricing(projectId: string, now: string): PowerPricing {
  return calculatePowerPricing({
    projectId,
    currency: "usd",
    unitName: "power_day",
    includedAgentRuns: 8,
    baseCostCents: 900,
    platformMarginPercent: 20,
    ownerMarginPercent: 30,
    minimumPriceCents: 1500,
    pricePerDayCents: 1500,
    updatedAt: now,
  });
}

function getPowerPricing(db: AppDatabase, projectId: string): PowerPricing {
  const current = db.powerPricing.find((pricing) => pricing.projectId === projectId);

  if (current) {
    return current;
  }

  const created = createDefaultPowerPricing(projectId, new Date().toISOString());
  db.powerPricing.push(created);
  return created;
}

function recalculatePowerPricing(db: AppDatabase, projectId: string) {
  const current = getPowerPricing(db, projectId);
  const activeProvider = db.modelProviders.find((provider) => provider.projectId === projectId && provider.enabled);
  const recalculated = calculatePowerPricing({
    ...current,
    baseCostCents: activeProvider?.costPerPowerDayCents ?? current.baseCostCents,
    updatedAt: new Date().toISOString(),
  });

  db.powerPricing = db.powerPricing.filter((pricing) => pricing.projectId !== projectId);
  db.powerPricing.push(recalculated);
}

function calculatePowerPricing(pricing: PowerPricing): PowerPricing {
  const multiplier = 1 + (pricing.platformMarginPercent + pricing.ownerMarginPercent) / 100;
  const calculated = Math.ceil(pricing.baseCostCents * multiplier);

  return {
    ...pricing,
    pricePerDayCents: Math.max(pricing.minimumPriceCents, calculated),
  };
}

function getActivePaymentGateway(db: AppDatabase, projectId: string): PaymentGatewayConnection {
  const active = db.paymentGateways.find((gateway) => gateway.projectId === projectId && gateway.enabled);

  if (active) {
    return active;
  }

  const now = new Date().toISOString();
  const gateway = createMockGateway(projectId, now);
  db.paymentGateways.push(gateway);
  return gateway;
}

function createGatewayReference(provider: PaymentGatewayProvider) {
  if (provider === "stripe") {
    return `cs_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
  }

  return `mock_${crypto.randomUUID()}`;
}

function providerDisplayName(provider: PaymentGatewayProvider) {
  return provider === "stripe" ? "Stripe" : "Mock Gateway";
}

function modelProviderDisplayName(provider: ModelProvider) {
  const names: Record<ModelProvider, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    local: "Local LLM",
    custom: "Custom Provider",
  };

  return names[provider];
}

function defaultBaseUrl(provider: ModelProvider) {
  const urls: Record<ModelProvider, string> = {
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com",
    local: "http://localhost:11434/v1",
    custom: "",
  };

  return urls[provider];
}

function defaultModel(provider: ModelProvider) {
  const models: Record<ModelProvider, string> = {
    openai: "gpt-5-mini",
    anthropic: "claude-sonnet-4",
    local: "local-agent-model",
    custom: "custom-agent-model",
  };

  return models[provider];
}

function maskSecret(value?: string) {
  if (!value) {
    return undefined;
  }

  if (value.length <= 10) {
    return "********";
  }

  return `${value.slice(0, 7)}...${value.slice(-4)}`;
}

function fingerprintSecret(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}
