# AgentPower MVP Decisions

## Goal

Build a locally runnable MVP for a platform where a founder launches an open-source project, gets generated project documentation and issues, funds runtime, and lets AI agents produce pull requests that maintainers review.

## Implementation Strategy

The MVP uses local mocks for external infrastructure while preserving production-shaped boundaries:

- PostgreSQL -> `data/agentpower-db.json` through `src/lib/store.ts`
- Redis/BullMQ -> synchronous `enqueueTask` workflow
- GitHub App -> `src/lib/github-mock.ts`
- Payment gateways -> project-level `PaymentGatewayConnection` records with mock and Stripe-ready providers
- Stripe -> gateway connection route plus donation API route writing treasury ledger entries
- Docker sandbox -> recorded Builder, Review, and Security agent runs
- Community compute -> pledged API token, GPU, or worker contribution records

This keeps the full workflow demonstrable without secrets or cloud accounts.

## Product Workflow

1. Founder launches a project through the wizard.
2. The backend creates a project, Project Brain, generated documents, task queue, mock repo metadata, and founder budget ledger entry.
3. A maintainer runs agents on a task.
4. The Builder Agent records an implementation run.
5. Review and Security agents record checks.
6. Review Gate creates a pull request model with CI state and merge recommendation.
7. Maintainer chooses merge, reject, or retry.
8. Project owners connect Stripe or keep the default mock gateway.
9. Supporters add donations to the treasury through the active provider.
10. Compute contributors can pledge a worker/API/GPU contribution for maintainer approval.

## Security Rules

The MVP keeps Level 1 autonomy as the operational default. AI can create pull requests, but a human controls merge decisions.

Changes touching license, billing, auth, permissions, production secrets, deployment credentials, encryption, database migrations, or security policy must be classified as human review.

## Upgrade Path

- Replace JSON store with PostgreSQL tables matching the type names in `src/lib/types.ts`.
- Use `docs/database-schema.sql` as the first concrete PostgreSQL migration target.
- Replace synchronous enqueue with BullMQ jobs and worker processes.
- Replace GitHub mock with a GitHub App installation token flow.
- Replace Stripe-ready gateway records with real Checkout Session creation and webhook reconciliation.
- Add more payment gateway providers through the adapter contract in `docs/PAYMENT_GATEWAYS.md`.
- Replace recorded agent runs with Docker sandbox execution and log artifact storage.
