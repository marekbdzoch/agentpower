<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AgentPower Project Rules

## Scope
- Keep the MVP runnable locally without external GitHub, Stripe, PostgreSQL, Redis, or Docker credentials.
- Preserve the adapter boundaries in `src/lib/store.ts`, `src/lib/github-mock.ts`, and API route handlers so real services can replace mocks later.
- Any real integration with billing, auth, permissions, deployment credentials, secrets, encryption, database migrations, or security policy requires human review.

## Definition of Done
- Launching a project creates a Project Brain, generated documentation, initial tasks, treasury entry, and mock GitHub repository metadata.
- Running agents creates Builder, Review, and Security agent runs plus an open pull request and Review Gate report.
- Maintainers can merge, reject, or retry an open agent pull request.
- Donations update the public treasury ledger.
- `npm run lint` and `npm run build` pass before completion.
