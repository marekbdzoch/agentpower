# AgentPower Setup

This project was initialized with AgentPower.

## Choices

- Payment gateway: stripe
- Agent provider: openai-compatible
- Runtime: self-hosted
- Autonomy level: 1
- Maintainer gate: required

## What Was Added

- `agentpower.config.json`
- `AGENTS.md`
- `agents/`
- `agents/.env.example`
- `.github/workflows/agentpower.yml`
- issue and pull request templates
- runtime economy defaults for selling power days

## Next Steps

1. Fill `agents/.env`.
2. Host the worker yourself or with a trusted compute contributor.
3. Connect your payment gateway.
4. Install/configure a GitHub App or token with minimal permissions.
5. Keep maintainers/admins as the final merge gate.

## Principle

This is living software: the community funds direction, agents propose pull requests, and maintainers approve what becomes part of the project.
