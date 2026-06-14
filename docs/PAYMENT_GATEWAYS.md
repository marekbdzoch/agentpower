# Payment Gateway Adapters

AgentPower is designed so every open-source project can connect its own payment gateway.

The MVP includes:

- `mock` gateway for local development,
- `stripe` gateway connection records,
- a project-level Payment Gateways UI,
- donation records tied to the active gateway,
- a database model ready for more providers.

## Stripe Setup

For Stripe, a project owner connects:

- publishable key, for client-side Stripe surfaces,
- secret or restricted key, for server-side Checkout Session creation,
- webhook signing secret, for verifying incoming Stripe webhook events,
- mode: `test` or `live`.

Stripe documents that sandbox keys use prefixes such as `pk_test_`, `sk_test_`, and `rk_test_`, while live keys use `pk_live_`, `sk_live_`, and `rk_live_`. Webhook signing secrets are separate from API keys and are scoped to webhook endpoints.

## Current MVP Behavior

The current app does not call Stripe yet. It records a Stripe connection as `real_ready` when a server-side key is provided, masks key values in local data, and ties future donations to the active provider.

This keeps the repo safe for public open-source development while preserving the production integration shape.

## Production Contract

A real payment adapter should implement:

```ts
type CreateCheckoutInput = {
  projectId: string;
  amountCents: number;
  currency: "usd" | "eur";
  contributorName: string;
  successUrl: string;
  cancelUrl: string;
};

type CreateCheckoutResult = {
  provider: "stripe" | string;
  externalReference: string;
  checkoutUrl: string;
};
```

Stripe Checkout should use a server-created Checkout Session and include an internal project or donation reference for reconciliation. Stripe supports `client_reference_id` on Checkout Sessions for this purpose.

## Adding Providers

To add another gateway:

1. Extend `PaymentGatewayProvider` in `src/lib/types.ts`.
2. Add provider validation in `src/app/api/projects/[id]/payment-gateways/route.ts`.
3. Add adapter-specific validation and masked credential fields.
4. Record all donations with `paymentGatewayId`, `paymentProvider`, and `externalReference`.
5. Add webhook verification before marking payments as succeeded.

## Secret Handling

The local MVP stores masked key values only. Production must store provider credentials encrypted or in a dedicated secret manager. Webhook verification must use the provider signing secret and the raw request body.
