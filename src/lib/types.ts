export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type ProjectStatus = "draft" | "launching" | "active" | "paused";
export type TaskStatus = "ready" | "running" | "review" | "merged" | "rejected";
export type RiskLevel = "low" | "medium" | "high";
export type AgentRunStatus = "queued" | "running" | "completed" | "failed";
export type PullRequestStatus = "open" | "merged" | "rejected" | "retry_requested";
export type ReviewDecision = "merge" | "request_changes" | "retry_agent" | "human_review";
export type PaymentGatewayProvider = "mock" | "stripe";
export type PaymentGatewayMode = "test" | "live";
export type ModelProvider = "openai" | "anthropic" | "local" | "custom";

export type CreateProjectInput = {
  name: string;
  idea: string;
  targetUsers: string;
  budgetCents: number;
  autonomyLevel: AutonomyLevel;
  license: string;
  stackPreference: string;
  requirements: string;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  idea: string;
  status: ProjectStatus;
  autonomyLevel: AutonomyLevel;
  budgetCents: number;
  license: string;
  targetUsers: string;
  stackPreference: string;
  requirements: string;
  githubRepoId: string;
  githubFullName: string;
  githubUrl: string;
  createdAt: string;
};

export type GeneratedDocument = {
  path: string;
  body: string;
};

export type ProjectBrain = {
  projectId: string;
  mission: string;
  users: string[];
  nonGoals: string[];
  stack: string[];
  roadmap: string[];
  autonomyRules: string[];
  securityPolicy: string[];
  documents: GeneratedDocument[];
  version: number;
  createdAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  githubIssueNumber: number;
  title: string;
  body: string;
  source: "roadmap" | "github" | "donation" | "maintainer";
  priority: number;
  riskLevel: RiskLevel;
  status: TaskStatus;
  budgetCapCents: number;
  createdAt: string;
};

export type AgentRun = {
  id: string;
  taskId: string;
  projectId: string;
  agentType: "builder" | "review" | "security";
  status: AgentRunStatus;
  summary: string;
  costCents: number;
  startedAt: string;
  finishedAt?: string;
};

export type PullRequest = {
  id: string;
  projectId: string;
  taskId: string;
  number: number;
  title: string;
  branch: string;
  status: PullRequestStatus;
  ciState: "pending" | "success" | "failure";
  reviewState: ReviewDecision;
  riskLevel: RiskLevel;
  url: string;
  createdAt: string;
};

export type ReviewReport = {
  id: string;
  pullRequestId: string;
  summary: string;
  findings: string[];
  riskFlags: string[];
  decision: ReviewDecision;
  createdAt: string;
};

export type Donation = {
  id: string;
  projectId: string;
  paymentGatewayId?: string;
  paymentProvider: PaymentGatewayProvider;
  externalReference: string;
  amountCents: number;
  currency: "usd" | "eur";
  targetType: "project" | "task" | "runtime";
  targetId?: string;
  contributorName: string;
  status: "succeeded";
  createdAt: string;
};

export type PaymentGatewayConnection = {
  id: string;
  projectId: string;
  provider: PaymentGatewayProvider;
  mode: PaymentGatewayMode;
  displayName: string;
  status: "connected" | "needs_keys" | "disabled";
  publishableKeyMasked?: string;
  secretKeyMasked?: string;
  secretKeyFingerprint?: string;
  webhookSecretMasked?: string;
  checkoutSessionMode: "mock" | "real_ready";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ModelProviderConnection = {
  id: string;
  projectId: string;
  provider: ModelProvider;
  displayName: string;
  status: "connected" | "needs_key" | "disabled";
  apiKeyMasked?: string;
  apiKeyFingerprint?: string;
  baseUrl?: string;
  primaryModel: string;
  fallbackModel?: string;
  costPerPowerDayCents: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PowerPricing = {
  projectId: string;
  currency: "usd" | "eur";
  unitName: "power_day";
  includedAgentRuns: number;
  baseCostCents: number;
  platformMarginPercent: number;
  ownerMarginPercent: number;
  minimumPriceCents: number;
  pricePerDayCents: number;
  updatedAt: string;
};

export type PowerLedgerEntry = {
  id: string;
  projectId: string;
  entryType: "credit_purchase" | "credit_adjustment" | "debit_agent_run" | "debit_adjustment";
  powerDays: number;
  amountCents?: number;
  refType?: "donation" | "agent_run" | "manual";
  refId?: string;
  description: string;
  createdAt: string;
};

export type TreasuryEntry = {
  id: string;
  projectId: string;
  entryType: "founder_budget" | "donation" | "agent_cost" | "runtime_credit";
  amountCents: number;
  currency: "usd" | "eur";
  description: string;
  createdAt: string;
};

export type ComputeContribution = {
  id: string;
  projectId: string;
  contributorName: string;
  type: "api_tokens" | "gpu" | "worker";
  status: "pledged" | "active";
  limits: string;
  createdAt: string;
};

export type AppDatabase = {
  projects: Project[];
  brains: ProjectBrain[];
  tasks: Task[];
  agentRuns: AgentRun[];
  pullRequests: PullRequest[];
  reviewReports: ReviewReport[];
  donations: Donation[];
  treasury: TreasuryEntry[];
  computeContributions: ComputeContribution[];
  paymentGateways: PaymentGatewayConnection[];
  modelProviders: ModelProviderConnection[];
  powerPricing: PowerPricing[];
  powerLedger: PowerLedgerEntry[];
};

export type ProjectDashboard = {
  project: Project;
  brain: ProjectBrain;
  tasks: Task[];
  pullRequests: PullRequest[];
  reviewReports: ReviewReport[];
  agentRuns: AgentRun[];
  donations: Donation[];
  treasury: TreasuryEntry[];
  computeContributions: ComputeContribution[];
  paymentGateways: PaymentGatewayConnection[];
  modelProviders: ModelProviderConnection[];
  powerPricing: PowerPricing;
  powerLedger: PowerLedgerEntry[];
  powerBalanceDays: number;
  balanceCents: number;
};
