import { NextResponse } from "next/server";
import { updatePowerPricing } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    includedAgentRuns?: number;
    platformMarginPercent?: number;
    ownerMarginPercent?: number;
    minimumPriceCents?: number;
  };
  const pricing = await updatePowerPricing(id, {
    includedAgentRuns: Number(body.includedAgentRuns ?? 8),
    platformMarginPercent: Number(body.platformMarginPercent ?? 20),
    ownerMarginPercent: Number(body.ownerMarginPercent ?? 30),
    minimumPriceCents: Number(body.minimumPriceCents ?? 1500),
  });

  return NextResponse.json({ pricing });
}
