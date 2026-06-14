export const SUPPORTED_PAYMENT_PROVIDERS = ["stripe", "mock", "custom"];
export const SUPPORTED_AGENT_PROVIDERS = ["openai-compatible", "anthropic-compatible", "local-llm", "custom"];
export const SUPPORTED_AGENT_RUNTIMES = ["self-hosted", "docker", "external-worker"];
export const SUPPORTED_MAINTAINER_GATES = ["required", "docs-only-auto", "disabled"];

export function validateAgentPowerManifest(manifest) {
  const issues = [];

  if (!manifest || typeof manifest !== "object") {
    return {
      valid: false,
      issues: ["Manifest must be a JSON object."],
    };
  }

  requireString(manifest, ["project", "name"], issues);
  requireNumberInRange(manifest, ["project", "autonomyLevel"], 0, 5, issues);
  requireChoice(manifest, ["project", "maintainerGate"], SUPPORTED_MAINTAINER_GATES, issues);
  requireChoice(manifest, ["payments", "provider"], SUPPORTED_PAYMENT_PROVIDERS, issues);
  requireBoolean(manifest, ["payments", "allowProjectOwnedGateway"], issues);
  requireChoice(manifest, ["agents", "provider"], SUPPORTED_AGENT_PROVIDERS, issues);
  requireChoice(manifest, ["agents", "runtime"], SUPPORTED_AGENT_RUNTIMES, issues);
  requireString(manifest, ["agents", "directory"], issues);
  requireBoolean(manifest, ["agents", "selfHosted"], issues);
  requireString(manifest, ["economy", "unitName"], issues);
  requirePositiveInteger(manifest, ["economy", "includedAgentRuns"], issues);
  requireNonNegativeInteger(manifest, ["economy", "estimatedModelCostCents"], issues);
  requireNonNegativeInteger(manifest, ["economy", "platformMarginPercent"], issues);
  requireNonNegativeInteger(manifest, ["economy", "ownerMarginPercent"], issues);
  requireNonNegativeInteger(manifest, ["economy", "minimumPriceCents"], issues);
  requireNonNegativeInteger(manifest, ["economy", "recommendedPriceCents"], issues);
  requireBoolean(manifest, ["reviewGate", "requireCi"], issues);
  requireBoolean(manifest, ["reviewGate", "requireHumanReviewForHighRisk"], issues);

  if (!Array.isArray(getPath(manifest, ["reviewGate", "protectedAreas"]))) {
    issues.push("reviewGate.protectedAreas must be an array.");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

function getPath(value, path) {
  return path.reduce((current, key) => current?.[key], value);
}

function pathName(path) {
  return path.join(".");
}

function requireString(manifest, path, issues) {
  const value = getPath(manifest, path);

  if (typeof value !== "string" || value.trim() === "") {
    issues.push(`${pathName(path)} must be a non-empty string.`);
  }
}

function requireBoolean(manifest, path, issues) {
  if (typeof getPath(manifest, path) !== "boolean") {
    issues.push(`${pathName(path)} must be a boolean.`);
  }
}

function requireChoice(manifest, path, choices, issues) {
  const value = getPath(manifest, path);

  if (!choices.includes(value)) {
    issues.push(`${pathName(path)} must be one of: ${choices.join(", ")}.`);
  }
}

function requireNumberInRange(manifest, path, min, max, issues) {
  const value = getPath(manifest, path);

  if (!Number.isInteger(value) || value < min || value > max) {
    issues.push(`${pathName(path)} must be an integer from ${min} to ${max}.`);
  }
}

function requirePositiveInteger(manifest, path, issues) {
  const value = getPath(manifest, path);

  if (!Number.isInteger(value) || value <= 0) {
    issues.push(`${pathName(path)} must be a positive integer.`);
  }
}

function requireNonNegativeInteger(manifest, path, issues) {
  const value = getPath(manifest, path);

  if (!Number.isInteger(value) || value < 0) {
    issues.push(`${pathName(path)} must be a non-negative integer.`);
  }
}
