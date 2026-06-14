#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const VERSION = "0.1.0";

const DEFAULTS = {
  projectName: "my-open-source-project",
  autonomyLevel: "1",
  paymentGateway: "stripe",
  agentProvider: "openai-compatible",
  agentRuntime: "self-hosted",
  maintainerGate: "required",
};

main().catch((error) => {
  console.error(`\nAgentPower setup failed: ${error.message}`);
  process.exit(1);
});

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "--version" || command === "-v") {
    console.log(VERSION);
    return;
  }

  if (command !== "init") {
    throw new Error(`Unknown command "${command}". Run "agentpower --help".`);
  }

  const options = parseOptions(args.slice(1));
  const targetDir = path.resolve(options.target ?? process.cwd());
  const answers = options.yes ? DEFAULTS : await promptForSetup(targetDir);

  if (options.clean && targetDir.includes(".tmp-agentpower-install")) {
    await rm(targetDir, { recursive: true, force: true });
  }

  await mkdir(targetDir, { recursive: true });
  await writeInstall(targetDir, answers, options);
  printSummary(targetDir, answers);
}

function printHelp() {
  console.log(`AgentPower ${VERSION}

Usage:
  npx agentpower init
  npx agentpower init --target ./my-project
  npx agentpower init --yes --force

Options:
  --yes             Use safe defaults without prompts
  --target <dir>    Install into a specific project directory
  --force           Overwrite AgentPower-managed files
  --clean           Remove temporary target first when using .tmp-agentpower-install
  --help            Show help
  --version         Show version
`);
}

function parseOptions(args) {
  const options = {
    yes: false,
    force: false,
    clean: false,
    target: undefined,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--yes" || arg === "-y") {
      options.yes = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--clean") {
      options.clean = true;
    } else if (arg === "--target") {
      options.target = args[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown option "${arg}".`);
    }
  }

  return options;
}

async function promptForSetup(targetDir) {
  const rl = readline.createInterface({ input, output });

  try {
    console.log("\nAgentPower project setup\n");
    console.log(`Target: ${targetDir}\n`);

    const projectName = await ask(rl, "Project name", inferProjectName(targetDir));
    const autonomyLevel = await askChoice(rl, "Autonomy level", ["0", "1", "2"], DEFAULTS.autonomyLevel);
    const paymentGateway = await askChoice(rl, "Payment gateway", ["stripe", "mock", "custom"], DEFAULTS.paymentGateway);
    const agentProvider = await askChoice(
      rl,
      "Agent provider",
      ["openai-compatible", "anthropic-compatible", "local-llm", "custom"],
      DEFAULTS.agentProvider,
    );
    const agentRuntime = await askChoice(rl, "Agent runtime", ["self-hosted", "docker", "external-worker"], DEFAULTS.agentRuntime);
    const maintainerGate = await askChoice(rl, "Maintainer gate", ["required", "docs-only-auto", "disabled"], DEFAULTS.maintainerGate);

    return {
      projectName,
      autonomyLevel,
      paymentGateway,
      agentProvider,
      agentRuntime,
      maintainerGate,
    };
  } finally {
    rl.close();
  }
}

async function ask(rl, label, defaultValue) {
  const answer = await rl.question(`${label} (${defaultValue}): `);
  return answer.trim() || defaultValue;
}

async function askChoice(rl, label, choices, defaultValue) {
  const answer = await rl.question(`${label} [${choices.join("/")}] (${defaultValue}): `);
  const value = answer.trim() || defaultValue;

  if (!choices.includes(value)) {
    console.log(`Using default "${defaultValue}" because "${value}" is not supported yet.`);
    return defaultValue;
  }

  return value;
}

function inferProjectName(targetDir) {
  return path.basename(targetDir) || DEFAULTS.projectName;
}

async function writeInstall(targetDir, answers, options) {
  const files = buildFiles(answers);

  for (const [relativePath, body] of Object.entries(files)) {
    await writeManagedFile(targetDir, relativePath, body, options.force);
  }

  await patchPackageJson(targetDir, options.force);
}

async function writeManagedFile(targetDir, relativePath, body, force) {
  const fullPath = path.join(targetDir, relativePath);

  if (existsSync(fullPath) && !force) {
    console.log(`skip ${relativePath} (already exists, use --force to overwrite)`);
    return;
  }

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${body.trimEnd()}\n`);
  console.log(`${existsSync(fullPath) ? "write" : "create"} ${relativePath}`);
}

async function patchPackageJson(targetDir, force) {
  const packagePath = path.join(targetDir, "package.json");

  if (!existsSync(packagePath)) {
    await writeManagedFile(
      targetDir,
      "package.json",
      JSON.stringify(
        {
          scripts: {
            "agentpower:doctor": "node agents/scripts/doctor.mjs",
            "agentpower:worker": "node agents/worker.mjs",
          },
        },
        null,
        2,
      ),
      force,
    );
    return;
  }

  const raw = await readFile(packagePath, "utf8");
  const pkg = JSON.parse(raw);
  pkg.scripts = {
    ...pkg.scripts,
    "agentpower:doctor": pkg.scripts?.["agentpower:doctor"] ?? "node agents/scripts/doctor.mjs",
    "agentpower:worker": pkg.scripts?.["agentpower:worker"] ?? "node agents/worker.mjs",
  };
  await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log("patch package.json scripts");
}

function buildFiles(answers) {
  const config = {
    $schema: "https://agentpower.dev/schema/agentpower.schema.json",
    project: {
      name: answers.projectName,
      autonomyLevel: Number(answers.autonomyLevel),
      maintainerGate: answers.maintainerGate,
    },
    payments: {
      provider: answers.paymentGateway,
      mode: "test",
      allowProjectOwnedGateway: true,
    },
    agents: {
      provider: answers.agentProvider,
      runtime: answers.agentRuntime,
      directory: "agents",
      selfHosted: true,
    },
    economy: {
      unitName: "power_day",
      includedAgentRuns: 8,
      estimatedModelCostCents: 900,
      platformMarginPercent: 20,
      ownerMarginPercent: 30,
      minimumPriceCents: 1500,
      recommendedPriceCents: 1500,
    },
    reviewGate: {
      requireCi: true,
      requireHumanReviewForHighRisk: true,
      protectedAreas: [
        "license",
        "billing",
        "auth",
        "permissions",
        "production-secrets",
        "deployment-credentials",
        "encryption",
        "database-migrations",
        "security-policy",
      ],
    },
  };

  return {
    "agentpower.config.json": JSON.stringify(config, null, 2),
    "AGENTS.md": agentsMd(answers),
    "agents/README.md": agentsReadme(answers),
    "agents/worker.mjs": workerScript(answers),
    "agents/scripts/doctor.mjs": doctorScript(),
    "agents/orchestrator/AGENT.md": roleDoc("Orchestrator", "Selects tasks, checks budget, dispatches workers, and sends results to review."),
    "agents/builder/AGENT.md": roleDoc("Builder Agent", "Implements scoped tasks on branches and opens pull requests."),
    "agents/review/AGENT.md": roleDoc("Review Agent", "Checks task fit, diff scope, tests, and project consistency."),
    "agents/security/AGENT.md": roleDoc("Security Agent", "Blocks risky changes and enforces human review rules."),
    "agents/.env.example": envExample(answers),
    ".github/workflows/agentpower.yml": githubWorkflow(),
    ".github/ISSUE_TEMPLATE/agent-task.md": issueTemplate(),
    ".github/pull_request_template.md": pullRequestTemplate(),
    "docs/agentpower-setup.md": setupDoc(answers),
  };
}

function agentsMd(answers) {
  return `# AGENTS.md

This project uses AgentPower to allow community-funded, AI-assisted open-source development.

## Operating Mode

- Autonomy level: ${answers.autonomyLevel}
- Agent runtime: ${answers.agentRuntime}
- Agent provider: ${answers.agentProvider}
- Payment gateway: ${answers.paymentGateway}
- Maintainer gate: ${answers.maintainerGate}

## Hard Rules

Agents may create branches and pull requests. Maintainers/admins approve merges.

Human review is required for:

- license changes,
- billing and payment code,
- authentication,
- permissions,
- production secrets,
- deployment credentials,
- encryption,
- database migrations,
- security policy,
- dependency supply-chain changes.

## Definition of Done

- PR links to an issue/task.
- Diff is scoped.
- Tests or documented test evidence are included.
- Security-sensitive files are called out.
- Review Agent and Security Agent pass or explicitly request human review.
`;
}

function agentsReadme(answers) {
  return `# Self-Hosted Agent Runtime

This folder is generated by \`agentpower init\`.

AgentPower intentionally expects project owners, communities, or compute contributors to host agent workers themselves. The platform coordinates work; the agents produce pull requests; maintainers approve what lands.

## Selected Setup

- Provider: ${answers.agentProvider}
- Runtime: ${answers.agentRuntime}
- Payment gateway: ${answers.paymentGateway}
- Maintainer gate: ${answers.maintainerGate}

## Start

Copy the environment template:

\`\`\`bash
cp agents/.env.example agents/.env
\`\`\`

Run the local doctor:

\`\`\`bash
npm run agentpower:doctor
\`\`\`

Start a worker:

\`\`\`bash
npm run agentpower:worker
\`\`\`

The worker script is a safe placeholder. Replace the task polling and model calls with your hosted runtime when you are ready.
`;
}

function workerScript(answers) {
  return `#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../agentpower.config.json", import.meta.url), "utf8"));

console.log("AgentPower worker starting");
console.log({
  project: config.project.name,
  provider: "${answers.agentProvider}",
  runtime: "${answers.agentRuntime}",
  maintainerGate: config.project.maintainerGate,
});

console.log("\\nThis is a self-hosted worker placeholder.");
console.log("Wire this process to your queue, model provider, GitHub App, and sandbox runtime.");
console.log("Agents should open pull requests only. Maintainers/admins approve merges.");
`;
}

function doctorScript() {
  return `#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";

const required = [
  "agentpower.config.json",
  "AGENTS.md",
  "agents/README.md",
  "agents/worker.mjs",
  "agents/.env.example"
];

let failed = false;

for (const file of required) {
  try {
    await access(file);
    console.log(\`ok   \${file}\`);
  } catch {
    failed = true;
    console.log(\`miss \${file}\`);
  }
}

try {
  const config = JSON.parse(await readFile("agentpower.config.json", "utf8"));
  console.log(\`ok   config project=\${config.project.name} payment=\${config.payments.provider} agent=\${config.agents.provider}\`);
} catch (error) {
  failed = true;
  console.log(\`fail config parse: \${error.message}\`);
}

if (failed) {
  process.exit(1);
}
`;
}

function roleDoc(role, description) {
  return `# ${role}

${description}

## Rules

- Never push directly to the default branch.
- Work only on assigned tasks.
- Keep diffs small and reviewable.
- Include test evidence.
- Stop and request human review for protected areas listed in \`AGENTS.md\`.
`;
}

function envExample(answers) {
  return `# AgentPower project runtime
AGENTPOWER_PROJECT_NAME=${shellValue(answers.projectName)}
AGENTPOWER_AUTONOMY_LEVEL=${answers.autonomyLevel}
AGENTPOWER_AGENT_PROVIDER=${answers.agentProvider}
AGENTPOWER_AGENT_RUNTIME=${answers.agentRuntime}
AGENTPOWER_POWER_DAY_PRICE_CENTS=1500
AGENTPOWER_POWER_DAY_INCLUDED_RUNS=8

# GitHub App / token for self-hosted workers
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_INSTALLATION_ID=
GITHUB_WEBHOOK_SECRET=

# Payment gateway
AGENTPOWER_PAYMENT_PROVIDER=${answers.paymentGateway}
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Model provider
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
LOCAL_LLM_BASE_URL=

# Queue / database for production
DATABASE_URL=
REDIS_URL=
`;
}

function githubWorkflow() {
  return `name: AgentPower checks

on:
  pull_request:
  push:
    branches: [main, master]

jobs:
  agentpower:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run agentpower:doctor
      - run: npm run lint --if-present
      - run: npm run build --if-present
`;
}

function issueTemplate() {
  return `---
name: Agent task
about: Propose a task that can be picked up by an AgentPower worker
title: "[agent-task]: "
labels: agent-task
---

## Goal

## Scope

## Acceptance Criteria

## Risk

- [ ] docs only
- [ ] tests only
- [ ] low-risk code
- [ ] touches protected area and requires human review

## Funding / Compute

- [ ] community funded
- [ ] maintainer funded
- [ ] compute contributor available
`;
}

function pullRequestTemplate() {
  return `## AgentPower Checklist

- [ ] Linked issue/task
- [ ] Scoped diff
- [ ] Test evidence included
- [ ] Protected areas listed
- [ ] Human review requested if needed

## Summary

## Test Evidence

## Risk Notes
`;
}

function setupDoc(answers) {
  return `# AgentPower Setup

This project was initialized with AgentPower.

## Choices

- Payment gateway: ${answers.paymentGateway}
- Agent provider: ${answers.agentProvider}
- Runtime: ${answers.agentRuntime}
- Autonomy level: ${answers.autonomyLevel}
- Maintainer gate: ${answers.maintainerGate}

## What Was Added

- \`agentpower.config.json\`
- \`AGENTS.md\`
- \`agents/\`
- \`agents/.env.example\`
- \`.github/workflows/agentpower.yml\`
- issue and pull request templates
- runtime economy defaults for selling power days

## Next Steps

1. Fill \`agents/.env\`.
2. Host the worker yourself or with a trusted compute contributor.
3. Connect your payment gateway.
4. Install/configure a GitHub App or token with minimal permissions.
5. Keep maintainers/admins as the final merge gate.

## Principle

This is living software: the community funds direction, agents propose pull requests, and maintainers approve what becomes part of the project.
`;
}

function shellValue(value) {
  return String(value).replaceAll(" ", "_").replace(/[^A-Za-z0-9_-]/g, "");
}

function printSummary(targetDir, answers) {
  console.log(`\nAgentPower initialized in ${targetDir}`);
  console.log(`Payment gateway: ${answers.paymentGateway}`);
  console.log(`Agent provider: ${answers.agentProvider}`);
  console.log(`Agent runtime: ${answers.agentRuntime}`);
  console.log("\nNext:");
  console.log("  cp agents/.env.example agents/.env");
  console.log("  npm run agentpower:doctor");
  console.log("  npm run agentpower:worker");
}
