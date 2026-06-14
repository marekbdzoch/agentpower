import { NextResponse } from "next/server";
import { connectModelProvider } from "@/lib/store";
import type { ModelProvider } from "@/lib/types";

const providers: ModelProvider[] = ["openai", "anthropic", "local", "custom"];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    provider?: ModelProvider;
    displayName?: string;
    apiKey?: string;
    baseUrl?: string;
    primaryModel?: string;
    fallbackModel?: string;
    costPerPowerDayCents?: number;
  };
  const provider = providers.includes(body.provider as ModelProvider) ? body.provider! : "openai";
  const result = await connectModelProvider(id, {
    provider,
    displayName: body.displayName || provider,
    apiKey: body.apiKey,
    baseUrl: body.baseUrl,
    primaryModel: body.primaryModel || "",
    fallbackModel: body.fallbackModel,
    costPerPowerDayCents: Number(body.costPerPowerDayCents ?? 900),
  });

  return NextResponse.json(result, { status: 201 });
}
