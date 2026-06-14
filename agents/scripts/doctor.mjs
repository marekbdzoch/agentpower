#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";

const required = [
  "agentpower.config.json",
  "AGENTS.md",
  "agents/README.md",
  "agents/worker.mjs",
  "agents/.env.example"
];

let failed = false;

for (const file of required) {
  try {
    await access(file);
    console.log(`ok   ${file}`);
  } catch {
    failed = true;
    console.log(`miss ${file}`);
  }
}

try {
  const config = JSON.parse(await readFile("agentpower.config.json", "utf8"));
  console.log(`ok   config project=${config.project.name} payment=${config.payments.provider} agent=${config.agents.provider}`);
} catch (error) {
  failed = true;
  console.log(`fail config parse: ${error.message}`);
}

if (failed) {
  process.exit(1);
}
