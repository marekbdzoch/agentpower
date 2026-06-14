import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/store";
import type { AutonomyLevel, CreateProjectInput } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ projects: await listProjects() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateProjectInput>;
  const budget = Number(body.budgetCents ?? 25000);
  const input: CreateProjectInput = {
    name: requireText(body.name, "name"),
    idea: requireText(body.idea, "idea"),
    targetUsers: body.targetUsers || "Founders, maintainers, supporters",
    budgetCents: Number.isFinite(budget) && budget > 0 ? budget : 25000,
    autonomyLevel: normalizeAutonomy(body.autonomyLevel),
    license: body.license || "MIT",
    stackPreference: body.stackPreference || "Next.js, TypeScript, PostgreSQL, Redis/BullMQ, Docker",
    requirements: body.requirements || "Launch a community-funded autonomous open-source project MVP.",
  };

  const result = await createProject(input);
  return NextResponse.json(result, { status: 201 });
}

function requireText(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length < 2) {
    throw new Error(`Missing ${field}`);
  }

  return value.trim();
}

function normalizeAutonomy(value: unknown): AutonomyLevel {
  const level = Number(value ?? 1);

  if ([0, 1, 2, 3, 4, 5].includes(level)) {
    return level as AutonomyLevel;
  }

  return 1;
}
