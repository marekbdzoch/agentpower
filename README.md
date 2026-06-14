# AgentPower

Autonomous open-source project launcher for community-funded software work.

> Community funds the direction. AI agents deliver pull requests. Maintainers keep quality.

AgentPower is a locally runnable MVP for creating, funding, and maintaining open-source projects with AI-assisted workflows. A founder enters an idea, budget, autonomy level, stack, and requirements. The platform creates a project record, generates the project brain and core repository documents, seeds initial tasks, runs mock builder/review/security agents, models CI status checks, records donations and compute pledges, and gives maintainers a merge/reject/retry gate.

The current implementation is intentionally self-contained. GitHub, Stripe, PostgreSQL, Redis/BullMQ, and Docker sandboxing are represented by local adapters so the full product loop can be tested without cloud accounts or secrets.

## Install Into Any Project

AgentPower can be added to an existing repository through an npm executable:

```bash
npx agentpower init
```

For non-interactive setup:

```bash
npx agentpower init --yes
```

For a specific target:

```bash
npx agentpower init --target ./my-project
```

The initializer asks for:

- payment gateway: `stripe`, `mock`, or later custom providers,
- agent provider: OpenAI-compatible, Anthropic-compatible, local LLM, or custom,
- agent runtime: self-hosted, Docker, or external worker,
- autonomy level,
- maintainer gate mode.

It creates:

- `agentpower.config.json`,
- `AGENTS.md`,
- `agents/`,
- `agents/.env.example`,
- `agents/worker.mjs`,
- `agents/scripts/doctor.mjs`,
- `.github/workflows/agentpower.yml`,
- issue and pull request templates,
- `docs/agentpower-setup.md`.

The important part: AgentPower does not require the platform to host every worker. The generated `agents/` folder is designed for self-hosted workers owned by the project, community, sponsors, or compute contributors.

## What This MVP Does

- Installs into existing projects through `npx agentpower init`.
- Launches a new open-source project from a web wizard.
- Generates a Project Brain with mission, users, non-goals, stack, roadmap, autonomy rules, and security policy.
- Generates project documents: `README.md`, `AGENTS.md`, `ROADMAP.md`, `CONTRIBUTING.md`, and `SECURITY.md`.
- Creates the first issues/tasks from the roadmap.
- Stores projects, tasks, pull requests, reviews, treasury entries, donations, and compute pledges locally.
- Mocks GitHub repo, issue, branch, and pull request behavior.
- Runs a Builder Agent workflow that creates a modeled pull request.
- Runs Review and Security Agent workflows.
- Models CI/status check results.
- Provides a Review Gate with risk classification.
- Provides a Maintainer Gate for merge, reject, or retry.
- Provides a mock Stripe donation flow and public treasury ledger.
- Lets each project connect its own payment gateway through a project-level API console.
- Includes a Stripe-ready gateway connection model with masked credential storage for local development.
- Lets project hosts connect model providers and set profitable "power day" pricing.
- Provides a compute contributor flow for API tokens, GPU, or external AI worker pledges.
- Exposes a public project dashboard at `/projects/[slug]`.

## Demo Flow

1. Add AgentPower to a project with `npx agentpower init`.
2. Configure payment gateway, agent provider, runtime, autonomy, and maintainer gate.
3. Host the generated worker from `agents/` yourself or through a trusted compute contributor.
4. Open the app at `http://localhost:3000`.
5. Use the Project Wizard to enter an idea, budget, autonomy level, stack, and requirements.
6. AgentPower creates a local project, Project Brain, generated docs, mock GitHub repo metadata, and initial task queue.
7. Click `Run agents` on a task.
8. The mock Builder, Review, and Security agents run and create a pull request model.
9. The Review Gate records CI success, risk level, and review decision.
10. The maintainer chooses merge, reject, or retry.
11. Connect Stripe in the Payment Gateways panel or keep the default mock gateway.
12. Add a donation or worker pledge.
13. Open the public dashboard for the project.

## Quick Start

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run checks:

```bash
npm run lint
npm run build
```

Test the CLI installer locally:

```bash
npm run cli:test
```

## Local Data

The MVP stores data in:

```text
data/agentpower-db.json
```

This file represents the local development database. It contains projects, generated project brains, tasks, agent runs, pull requests, review reports, donations, treasury ledger entries, and compute contributions.

To reset local demo data, stop the dev server and remove the file:

```bash
rm data/agentpower-db.json
```

## Product Model

### Project Launcher

The launcher is the web wizard on the home page. It collects:

- project name,
- idea,
- target users,
- budget,
- autonomy level,
- license,
- stack preference,
- requirements.

Submitting the wizard creates the full local project model.

### Project Brain

The Project Brain is generated from the launcher input and stored with the project. It contains:

- mission,
- target users,
- non-goals,
- stack,
- roadmap,
- autonomy rules,
- security policy,
- generated repository documents.

### AGENTS.md Rules

Generated agent rules include:

- allowed changes,
- blocked high-risk changes,
- required tests or test explanation,
- branch and PR expectations,
- human review requirements,
- definition of done.

### Task Queue

Initial tasks are generated from the roadmap. Each task includes:

- mock GitHub issue number,
- title and body,
- source,
- priority,
- risk level,
- status,
- budget cap.

### Agent Orchestrator

In the MVP, orchestration is represented by the `enqueueTask` workflow in `src/lib/store.ts`. It:

- selects the task,
- records Builder, Review, and Security agent runs,
- creates a pull request model,
- creates a Review Gate report,
- records agent runtime cost in the treasury ledger.

For projects initialized through `npx agentpower init`, the generated `agents/` folder contains the self-hosted worker entrypoint and role definitions. The worker is a safe placeholder until the project owner connects a queue, model provider, GitHub App, and sandbox runtime.

### Review Gate

The Review Gate records:

- task reference,
- CI state,
- scope check,
- risk flags,
- final recommendation.

Medium and high-risk work is classified for human review. The MVP keeps Level 1 autonomy: agents can create pull requests, but humans decide merges.

### Treasury

The treasury ledger records:

- founder starting budget,
- mock donations,
- agent runtime costs,
- runtime/compute-related entries.

The public dashboard displays the current balance and project activity.

### Payment Gateways

Each project can connect its own payment gateway. The MVP ships with:

- `mock`, enabled by default for local development,
- `stripe`, configurable from the project Payment Gateways panel.

The gateway connection records:

- provider,
- mode: `test` or `live`,
- display name,
- masked publishable key,
- masked secret or restricted key,
- masked webhook signing secret,
- active/disabled state,
- checkout readiness mode.

Donations are tied to the active gateway through:

- `paymentGatewayId`,
- `paymentProvider`,
- `externalReference`.

This is the foundation for adding more providers later without rewriting the donation model.

### Runtime Economy

The host/admin of a self-hosted project can configure the economics of their agent runtime:

- model provider: OpenAI, Anthropic, local LLM, or custom,
- base URL,
- primary model,
- masked API key and fingerprint,
- estimated cost per 1 power day,
- included agent runs per power day,
- platform margin,
- owner margin,
- minimum sell price.

AgentPower calculates:

```text
pricePerDay = max(minimumPrice, baseModelCost * (1 + platformMargin + ownerMargin))
```

This makes it possible for hosted projects to sell runtime capacity, fund open-source work, and keep project owners/operators profitable while maintainers stay in control of merges.

### Compute Contributors

Supporters can pledge:

- API token capacity,
- GPU capacity,
- external AI worker capacity.

In the MVP these pledges are recorded for maintainer approval. Real worker execution is intentionally not enabled without a sandbox and trust model.

## Architecture

```text
Next.js App Router UI
  |
  |-- Project Wizard
  |-- Maintainer Console
  |-- Public Dashboard
  |-- Donation Page
  |
API Route Handlers
  |
  |-- /api/projects
  |-- /api/project-dashboards/[slug]
  |-- /api/tasks/[id]/enqueue
  |-- /api/pull-requests/[id]/decision
  |-- /api/projects/[id]/donations
  |-- /api/projects/[id]/payment-gateways
  |-- /api/projects/[id]/model-providers
  |-- /api/projects/[id]/power-pricing
  |-- /api/projects/[id]/compute-contributions
  |
Domain Layer
  |
  |-- src/lib/store.ts
  |-- src/lib/project-generator.ts
  |-- src/lib/github-mock.ts
  |-- src/lib/types.ts
  |
Local Persistence
  |
  |-- data/agentpower-db.json
```

## Production Adapter Map

The MVP uses local adapters with production-shaped boundaries:

| Production target | MVP implementation |
| --- | --- |
| PostgreSQL | JSON store in `src/lib/store.ts` |
| Redis/BullMQ | Synchronous `enqueueTask` workflow |
| GitHub App | `src/lib/github-mock.ts` |
| GitHub Issues/PRs | Local task and pull request models |
| Stripe Checkout | Stripe-ready gateway record plus mock donation settlement |
| Additional payment gateways | Provider-ready `PaymentGatewayConnection` model |
| OpenAI/Anthropic model setup | Project-level `ModelProviderConnection` records |
| Runtime pricing | Project-level `PowerPricing` records |
| Docker sandbox | Recorded agent runs and cost ledger |
| Worker marketplace | Compute contribution pledge records |

The target PostgreSQL schema is documented in `docs/database-schema.sql`.

## API Routes

### Projects

```http
GET /api/projects
POST /api/projects
```

Creates and lists projects. `POST` also creates the Project Brain, generated docs, initial tasks, mock GitHub repo metadata, and founder budget ledger entry.

### Project Dashboard

```http
GET /api/project-dashboards/[slug]
```

Returns the public project dashboard model.

### Task Queue

```http
POST /api/tasks/[id]/enqueue
```

Runs the mock Builder, Review, and Security agent workflow for a task.

### Maintainer Gate

```http
POST /api/pull-requests/[id]/decision
```

Body:

```json
{
  "decision": "merge"
}
```

Allowed decisions:

- `merge`
- `reject`
- `retry`

### Donations

```http
POST /api/projects/[id]/donations
```

Records a donation through the active project gateway and adds it to the treasury ledger.

### Payment Gateways

```http
POST /api/projects/[id]/payment-gateways
```

Connects a project payment gateway.

Example Stripe payload:

```json
{
  "provider": "stripe",
  "mode": "test",
  "displayName": "Stripe",
  "publishableKey": "pk_test_...",
  "secretKey": "sk_test_...",
  "webhookSecret": "whsec_..."
}
```

The local MVP masks credentials and marks the gateway as `real_ready`; production must encrypt secrets or use a dedicated secret manager.

### Compute Contributions

```http
POST /api/projects/[id]/compute-contributions
```

Records a pledged worker, GPU, or API-token contribution.

### Model Providers

```http
POST /api/projects/[id]/model-providers
```

Connects a model provider and recalculates the project power day price.

Supported MVP providers:

- `openai`
- `anthropic`
- `local`
- `custom`

### Power Pricing

```http
POST /api/projects/[id]/power-pricing
```

Updates included agent runs, platform margin, owner margin, and minimum sell price.

## Key Files

```text
src/app/page.tsx                              Home page and launcher entry
src/components/launch-client.tsx             Wizard, task queue, maintainer gate, treasury UI
src/components/donate-client.tsx             Mock donation form
src/app/projects/[slug]/page.tsx             Public project dashboard
src/app/projects/[slug]/donate/page.tsx      Donation page
bin/agentpower.mjs                           npx CLI initializer
src/lib/store.ts                             Local database and workflow logic
src/lib/project-generator.ts                 Project Brain, docs, and initial task generation
src/lib/github-mock.ts                       Mock GitHub repository adapter
src/lib/types.ts                             Domain model
docs/MVP_DECISIONS.md                        Implementation decisions
docs/PAYMENT_GATEWAYS.md                     Payment provider adapter contract
docs/RUNTIME_ECONOMY.md                      Power day and profitable runtime model
docs/PUBLIC_LAUNCH.md                        Open-source launch checklist
docs/LAUNCH_READINESS.md                     Launch levels and remaining work
docs/database-schema.sql                     Target PostgreSQL schema
.env.example                                 Public environment template without secrets
LICENSE                                      MIT license
CONTRIBUTING.md                              Contribution rules
SECURITY.md                                  Security policy
```

## Security Model

AI agents must not merge or automatically approve high-risk changes.

Human review is required for changes touching:

- license,
- billing,
- authentication,
- authorization and permissions,
- production secrets,
- deployment credentials,
- encryption,
- database migrations,
- security rules.

The MVP defaults to autonomy Level 1:

```text
AI creates pull requests. Humans merge.
```

## Autonomy Levels

| Level | Meaning |
| --- | --- |
| 0 | AI proposes roadmap and issues only |
| 1 | AI creates pull requests; humans merge |
| 2 | AI may merge docs/tests after CI |
| 3 | AI may merge low-risk bugfixes after review |
| 4 | AI may prepare patch releases |
| 5 | Experimental full autonomy |

Only Level 1 is operationally implemented in the MVP. Higher levels are product targets.

## Current Limitations

- GitHub integration is a mock, not a real GitHub App installation.
- Stripe connection is recorded, but Checkout Session creation is not live yet.
- Agent execution is recorded, not executed in Docker.
- Queueing is synchronous, not Redis/BullMQ.
- Persistence is local JSON, not PostgreSQL.
- Compute contributors are pledges, not live worker execution.

These limitations are deliberate so the MVP can run locally without secrets.

## Roadmap

1. Replace JSON persistence with PostgreSQL.
2. Replace synchronous task enqueue with Redis/BullMQ workers.
3. Add real GitHub App installation flow and repository creation.
4. Add real GitHub issue, branch, commit, pull request, and status check writes.
5. Add real Stripe Checkout sessions and webhook reconciliation.
6. Run agents inside Docker workspaces with budget limits and audit logs.
7. Add real compute contributor worker registration and trust policy.
8. Expand Review Gate with diff inspection, test artifact parsing, and security scanning.
9. Add more payment gateways through the adapter contract.
10. Publish the CLI package so projects can run `npx agentpower init`.

## Open-Source Launch Readiness

This repository is structured to be publishable as an open-source project:

- MIT license is included.
- Contribution guide is included.
- Security policy is included.
- Code of Conduct is included.
- Environment template is included.
- Payment gateway adapter documentation is included.
- Public launch checklist is included.
- Launch readiness levels are documented.

The core idea is recursive: open source projects can use AgentPower to fund and generate open source work through reviewed agent pull requests.

See `docs/LAUNCH_READINESS.md` for the exact difference between public open-source beta, hosted beta, real payments, real GitHub App integration, and real autonomous agent runtime.

## Development Notes

This app was scaffolded with Next.js App Router, TypeScript, Tailwind CSS, and ESLint.

Useful commands:

```bash
npm run dev
npm run lint
npm run build
```
