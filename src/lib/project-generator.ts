import type {
  AutonomyLevel,
  GeneratedDocument,
  Project,
  ProjectBrain,
  RiskLevel,
  Task,
} from "@/lib/types";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 64);
}

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function lines(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function autonomyLabel(level: AutonomyLevel) {
  const labels: Record<AutonomyLevel, string> = {
    0: "AI drafts roadmap and issues only",
    1: "AI opens pull requests; humans merge",
    2: "AI may merge docs/tests after CI",
    3: "AI may merge low-risk bugfixes after review",
    4: "AI may prepare patch releases",
    5: "Experimental full autonomy",
  };
  return labels[level];
}

export function buildProjectBrain(project: Project): ProjectBrain {
  const stack = lines(project.stackPreference);
  const requirements = lines(project.requirements);
  const users = lines(project.targetUsers);

  const mission = `Create ${project.name}: ${project.idea}`;
  const roadmap = [
    "Bootstrap repository, documentation, CI, and contributor workflow",
    "Implement the first usable product slice from the project brief",
    "Add automated tests and baseline observability for maintainers",
    "Prepare public contribution paths and funded task intake",
  ];

  const securityPolicy = [
    "License, billing, auth, permissions, secrets, deployment credentials, encryption, database migrations, and security rules always require human review.",
    "Agents must work in isolated branches and may not push directly to the default branch.",
    "High-risk pull requests are blocked until a maintainer explicitly approves them.",
    "Runtime credentials are never written to generated repositories or logs.",
  ];

  const brain: ProjectBrain = {
    projectId: project.id,
    mission,
    users: users.length > 0 ? users : ["Open-source maintainers", "Early adopters"],
    nonGoals: [
      "Autonomous production deploys",
      "Automatic payout marketplace",
      "Unreviewed high-risk code changes",
    ],
    stack:
      stack.length > 0
        ? stack
        : ["Next.js", "TypeScript", "PostgreSQL", "Redis/BullMQ", "Docker sandbox"],
    roadmap,
    autonomyRules: [
      `Default autonomy: Level ${project.autonomyLevel} (${autonomyLabel(project.autonomyLevel)}).`,
      "MVP operation keeps maintainer merge as the final gate.",
      "Agents must include test evidence and a concise implementation summary in every PR.",
    ],
    securityPolicy,
    documents: [],
    version: 1,
    createdAt: new Date().toISOString(),
  };

  brain.documents = buildDocuments(project, brain, requirements);
  return brain;
}

export function buildInitialTasks(project: Project, brain: ProjectBrain): Task[] {
  const taskSpecs: Array<Pick<Task, "title" | "body" | "priority" | "riskLevel">> = [
    {
      title: "Bootstrap repository documentation and contribution guide",
      body: "Create a complete README, AGENTS.md, CONTRIBUTING.md, SECURITY.md, and ROADMAP.md aligned with the Project Brain.",
      priority: 1,
      riskLevel: "low",
    },
    {
      title: "Implement first product workflow skeleton",
      body: `Build the first workflow for ${project.name}: ${project.idea}. Include typed interfaces, basic tests, and clear extension points.`,
      priority: 2,
      riskLevel: "medium",
    },
    {
      title: "Add CI checks for lint, typecheck, and tests",
      body: "Add a baseline CI workflow and document the checks required before maintainers merge agent pull requests.",
      priority: 3,
      riskLevel: "medium",
    },
    {
      title: "Publish funded task intake template",
      body: "Add issue templates for bugs, feature proposals, funded work, and compute contribution offers.",
      priority: 4,
      riskLevel: "low",
    },
  ];

  return taskSpecs.map((task, index) => ({
    id: crypto.randomUUID(),
    projectId: project.id,
    githubIssueNumber: index + 1,
    title: task.title,
    body: `${task.body}\n\nMission: ${brain.mission}`,
    source: "roadmap",
    priority: task.priority,
    riskLevel: task.riskLevel as RiskLevel,
    status: "ready",
    budgetCapCents: Math.max(500, Math.floor(project.budgetCents / 8)),
    createdAt: new Date().toISOString(),
  }));
}

function buildDocuments(project: Project, brain: ProjectBrain, requirements: string[]): GeneratedDocument[] {
  const sharedHeader = `${project.name}\n${"=".repeat(project.name.length)}`;

  return [
    {
      path: "README.md",
      body: `${sharedHeader}

${brain.mission}

## Users
${brain.users.map((user) => `- ${user}`).join("\n")}

## MVP Scope
${requirements.length > 0 ? requirements.map((item) => `- ${item}`).join("\n") : "- Deliver a usable first slice with clear maintainer review."}

## Stack
${brain.stack.map((item) => `- ${item}`).join("\n")}

## Funding
Initial founder budget: ${formatMoney(project.budgetCents)}. Community funding can target the project, runtime credits, or specific issues.
`,
    },
    {
      path: "AGENTS.md",
      body: `# Agent Rules

## Allowed
- Work on assigned issues in isolated branches.
- Add tests, documentation, small features, and low-risk bug fixes.
- Open pull requests with implementation notes and test evidence.

## Human Review Required
${brain.securityPolicy.map((item) => `- ${item}`).join("\n")}

## Definition of Done
- The PR references its task.
- Relevant tests pass or the PR explains why tests are not applicable.
- The diff stays within scope.
- Review Gate reports no blocking high-risk changes.
`,
    },
    {
      path: "ROADMAP.md",
      body: `# Roadmap

${brain.roadmap.map((item, index) => `## Milestone ${index + 1}\n${item}`).join("\n\n")}
`,
    },
    {
      path: "CONTRIBUTING.md",
      body: `# Contributing

Contributors can propose issues, fund work, or provide compute. Maintainers keep final authority over merges.

## Pull Requests
- Keep changes small.
- Link the issue.
- Include test evidence.
- Do not change high-risk areas without explicit maintainer approval.
`,
    },
    {
      path: "SECURITY.md",
      body: `# Security Policy

Report vulnerabilities privately to the maintainers before public disclosure.

## Agent Restrictions
${brain.securityPolicy.map((item) => `- ${item}`).join("\n")}
`,
    },
  ];
}
