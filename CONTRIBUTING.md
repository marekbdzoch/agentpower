# Contributing

AgentPower is an open-source MVP for community-funded autonomous software projects.

## Development

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run lint
npm run build
```

## Pull Requests

- Keep changes small and tied to a clear issue or product goal.
- Update `README.md` when behavior or public setup changes.
- Update `docs/database-schema.sql` when local data entities change.
- Do not add live billing, auth, secret handling, deployment, encryption, or permission changes without explicit human review.

## Payment Gateway Adapters

New payment providers should follow the adapter model documented in `docs/PAYMENT_GATEWAYS.md`.
