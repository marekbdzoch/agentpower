# Public Open-Source Launch Checklist

For a stricter launch-level breakdown, see `docs/LAUNCH_READINESS.md`.

## Repository

- `README.md` explains the product, setup, architecture, security model, and roadmap.
- `LICENSE` is present.
- `CONTRIBUTING.md` is present.
- `SECURITY.md` is present.
- `CODE_OF_CONDUCT.md` is present.
- `.env.example` lists required environment variables without secrets.

## Product

- Local project launch works.
- Generated project docs work.
- Task queue works.
- Builder, Review, and Security agent run records work.
- Maintainer merge/reject/retry works.
- Donations are tied to an active payment gateway.
- Compute pledges are visible.

## Payment Gateways

- Mock gateway works by default.
- Stripe can be connected at project level.
- Credentials are masked in local data.
- Future providers have a documented adapter contract.

## Before Real Payments

- Replace local JSON persistence with PostgreSQL.
- Encrypt project gateway credentials or store them in a secret manager.
- Add real Stripe Checkout Session creation.
- Add webhook signature verification.
- Add webhook reconciliation tests.
- Add audit logs for credential changes.
