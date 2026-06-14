# Runtime Economy

AgentPower is designed so open-source projects can operate their own economic loop:

1. A project owner hosts the AgentPower app and self-hosted workers.
2. The owner connects a payment gateway such as Stripe.
3. The owner connects model providers such as OpenAI, Anthropic, local LLMs, or custom providers.
4. The owner sets the cost and margin for 1 power day.
5. Supporters buy power days.
6. Agents use funded runtime to produce pull requests.
7. Maintainers/admins approve what merges.

## Power Day

A power day is the productized runtime unit sold by a project.

It can represent:

- a daily budget of agent work,
- a fixed number of agent runs,
- a fixed model spend cap,
- a sponsor-funded day of open-source progress.

The MVP stores:

- included agent runs,
- estimated base model cost,
- platform margin,
- owner margin,
- minimum price,
- final sell price.

## Formula

```text
pricePerDay = max(
  minimumPrice,
  baseModelCost * (1 + platformMarginPercent + ownerMarginPercent)
)
```

This lets project owners keep the runtime profitable while still funding open-source work.

## Model Providers

Supported MVP provider records:

- OpenAI,
- Anthropic,
- local LLM,
- custom provider.

Production integrations must encrypt API keys or store them in a secret manager. The local MVP stores only masked values and fingerprints.

## Payment Gateway

Runtime purchases go through the active project payment gateway.

In the MVP:

- mock gateway works locally,
- Stripe can be connected as a ready provider,
- donations/runtime purchases are recorded in the treasury.

In production:

- create real Stripe Checkout Sessions,
- verify webhooks,
- reconcile paid sessions,
- track refunds/disputes,
- calculate revenue, model cost, and margin.

## Why This Matters

The intended model is not just "AI writes code." The project can become a living open-source economy:

- users fund direction,
- sponsors buy power days,
- model providers supply intelligence,
- compute contributors host workers,
- maintainers protect quality,
- owners/admins can operate the system profitably.
