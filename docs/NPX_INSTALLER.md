# NPX Installer

AgentPower can be installed into an existing software project with:

```bash
npx agentpower init
```

The command is implemented in `bin/agentpower.mjs`.

## What It Asks

The interactive setup asks for:

- project name,
- autonomy level,
- payment gateway,
- agent provider,
- agent runtime,
- runtime economy defaults,
- maintainer gate mode.

Supported MVP choices:

- payment gateway: `stripe`, `mock`, `custom`,
- agent provider: `openai-compatible`, `anthropic-compatible`, `local-llm`, `custom`,
- agent runtime: `self-hosted`, `docker`, `external-worker`,
- maintainer gate: `required`, `docs-only-auto`, `disabled`.

The default recommendation is:

- payment gateway: `stripe`,
- agent provider: `openai-compatible`,
- runtime: `self-hosted`,
- autonomy level: `1`,
- power day price: `$15.00`,
- included agent runs: `8`,
- maintainer gate: `required`.

## What It Creates

```text
agentpower.config.json
AGENTS.md
agents/
agents/README.md
agents/.env.example
agents/worker.mjs
agents/scripts/doctor.mjs
agents/orchestrator/AGENT.md
agents/builder/AGENT.md
agents/review/AGENT.md
agents/security/AGENT.md
.github/workflows/agentpower.yml
.github/ISSUE_TEMPLATE/agent-task.md
.github/pull_request_template.md
docs/agentpower-setup.md
```

The generated `agentpower.config.json` also includes an `economy` section with the default power day assumptions:

```json
{
  "unitName": "power_day",
  "includedAgentRuns": 8,
  "estimatedModelCostCents": 900,
  "platformMarginPercent": 20,
  "ownerMarginPercent": 30,
  "minimumPriceCents": 1500,
  "recommendedPriceCents": 1500
}
```

It also patches `package.json` with:

```json
{
  "scripts": {
    "agentpower:doctor": "node agents/scripts/doctor.mjs",
    "agentpower:worker": "node agents/worker.mjs"
  }
}
```

## Non-Interactive Mode

```bash
npx agentpower init --yes
```

## Target Directory

```bash
npx agentpower init --target ./my-project
```

## Overwrite Existing Files

```bash
npx agentpower init --force
```

Without `--force`, AgentPower-managed files are skipped if they already exist.

## Self-Hosted Agents

The generated `agents/` folder is intentionally part of the user project. Project owners, maintainers, sponsors, or compute contributors can host workers themselves.

This keeps the model open:

- the community funds direction,
- agents propose changes,
- maintainers approve merges,
- projects can bring their own payment gateway and compute.
- owners can set power day pricing so the runtime can be profitable.
