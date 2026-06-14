#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../agentpower.config.json", import.meta.url), "utf8"));

console.log("AgentPower worker starting");
console.log({
  project: config.project.name,
  provider: "openai-compatible",
  runtime: "self-hosted",
  maintainerGate: config.project.maintainerGate,
});

console.log("\nThis is a self-hosted worker placeholder.");
console.log("Wire this process to your queue, model provider, GitHub App, and sandbox runtime.");
console.log("Agents should open pull requests only. Maintainers/admins approve merges.");
