import { NextResponse } from "next/server";
import { addComputeContribution } from "@/lib/store";
import type { ComputeContribution } from "@/lib/types";

const allowedTypes: ComputeContribution["type"][] = ["api_tokens", "gpu", "worker"];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    contributorName?: string;
    type?: ComputeContribution["type"];
    limits?: string;
  };
  const type = allowedTypes.includes(body.type as ComputeContribution["type"]) ? body.type! : "worker";
  const contribution = await addComputeContribution(
    id,
    body.contributorName || "Community compute contributor",
    type,
    body.limits || "2 agent jobs/day, no production secrets, maintainer allowlist required",
  );

  return NextResponse.json({ contribution }, { status: 201 });
}
