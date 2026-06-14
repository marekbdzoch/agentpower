# Launch Readiness

This document defines what must be true before AgentPower can be considered ready for different launch levels.

## Current State

AgentPower is ready to be published as an open-source MVP / public beta repository.

It is not yet ready for production money movement, real autonomous code execution, or unattended merges.

## Launch Level 1: Public Open-Source Repository

This is the first realistic launch target.

Required:

- `README.md` explains the product, setup, architecture, payment gateway model, security posture, limitations, and roadmap.
- `LICENSE` exists.
- `CONTRIBUTING.md` exists.
- `SECURITY.md` exists.
- `CODE_OF_CONDUCT.md` exists.
- `.env.example` exists and contains no real secrets.
- `.gitignore` excludes local database files and secret-bearing files.
- `npx agentpower init` creates `agentpower.config.json`, `AGENTS.md`, `agents/`, GitHub workflow, and project setup docs.
- Host/admin runtime pricing is documented and configurable through model provider plus power day pricing records.
- `npm run lint` passes.
- `npm run build` passes.
- A new contributor can run the app locally with `npm install` and `npm run dev`.
- The repo clearly states that payments, GitHub, queueing, and agent execution are currently mocked/local adapters.

Status: ready after final review and commit.

## Launch Level 2: Public Hosted Demo

This is a public URL where people can try the MVP without entering real payment keys.

Required:

- Deploy the Next.js app to a public host.
- Add hosted environment variables from `.env.example`.
- Replace local JSON persistence or accept that demo data is ephemeral.
- Disable or sandbox any forms that accept real Stripe secrets.
- Add a visible "MVP demo, do not enter production secrets" warning unless encrypted secret storage is implemented.
- Add basic rate limiting for project creation, donation mock, gateway connection, and task enqueue routes.
- Add server-side validation for all route payloads.
- Add structured error pages and empty states.
- Confirm public dashboard routes do not expose secrets.
- Run a manual browser smoke test on desktop and mobile.

Status: not complete.

## Launch Level 3: Real Stripe Payments

This is the first level where money can move.

Required:

- Implement real Stripe Checkout Session creation.
- Use Stripe `client_reference_id` or metadata to reconcile sessions with internal projects/donations.
- Store gateway credentials encrypted or in a dedicated secret manager.
- Do not store raw Stripe secret keys in the database.
- Verify Stripe webhooks with the webhook signing secret and raw request body.
- Handle `checkout.session.completed` before marking a donation as succeeded.
- Handle failed, expired, refunded, disputed, and duplicate webhook events.
- Add idempotency for donation creation and webhook processing.
- Add an audit log for all gateway credential changes.
- Add a maintainer-facing payment status view.
- Add a clear policy for whether funds go to the platform account, a project-owned account, or a connected account.
- Have a lawyer/accountant review tax, payout, donation, marketplace, and nonprofit language before calling payments "donations" in production.

Status: not complete.

## Launch Level 4: Real GitHub App

Required:

- Register a GitHub App.
- Implement installation flow and installation token handling.
- Store installation metadata.
- Create repositories through GitHub API.
- Create files, branches, issues, pull requests, and status checks through GitHub API.
- Verify GitHub webhooks.
- Add audit logs for every GitHub write.
- Keep dangerous scopes documented and minimal.
- Ensure agents never push directly to default branches.

Status: not complete.

## Launch Level 5: Real Agent Runtime

Required:

- Run Builder, Review, and Security agents in isolated workspaces.
- Add hard budget limits per project and per task.
- Add runtime timeouts and retry limits.
- Add network egress controls.
- Prevent access to production secrets by default.
- Store run logs and artifacts.
- Parse CI results and test output.
- Block high-risk diffs before maintainer review.
- Add a maintainer override flow.

Status: not complete.

## Launch Level 6: Community-Ready Operations

Required:

- Publish a clear roadmap.
- Create issue templates.
- Create pull request template.
- Add GitHub Actions for lint/build.
- Add release process.
- Add governance rules for maintainers.
- Add security disclosure process.
- Add contributor onboarding docs.
- Add public architecture diagrams or docs.
- Add funding policy and payment provider policy.
- Add runtime economy policy for model costs, power day pricing, owner margin, and platform margin.

Status: partially complete.

## Minimum Next Steps

To feel confident publishing the repository publicly:

1. Review `README.md` for positioning and scope.
2. Commit the current MVP.
3. Add GitHub Actions for `npm run lint` and `npm run build`.
4. Publish the npm package with the `agentpower` bin so `npx agentpower init` works from any project.
5. Add issue and pull request templates.
6. Add a prominent warning that current payments and agents are mocked.
7. Publish the repo under the MIT license.

To feel confident launching a hosted beta:

1. Add hosted persistence.
2. Add route validation and rate limiting.
3. Add encrypted secret storage or disable real Stripe key entry.
4. Add GitHub Actions.
5. Deploy to a public host.
6. Run end-to-end browser verification on the deployed URL.

To feel confident launching with real money:

1. Implement real Stripe Checkout.
2. Implement verified Stripe webhooks.
3. Add idempotency and audit logs.
4. Encrypt/store credentials safely.
5. Add revenue reports for power day sales, model costs, owner margin, and platform margin.
6. Get legal/accounting review for payment and donation language.
