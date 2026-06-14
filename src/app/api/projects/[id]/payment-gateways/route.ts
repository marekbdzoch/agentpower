import { NextResponse } from "next/server";
import { connectPaymentGateway } from "@/lib/store";
import type { PaymentGatewayMode, PaymentGatewayProvider } from "@/lib/types";

const providers: PaymentGatewayProvider[] = ["mock", "stripe"];
const modes: PaymentGatewayMode[] = ["test", "live"];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    provider?: PaymentGatewayProvider;
    mode?: PaymentGatewayMode;
    displayName?: string;
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  };
  const provider = providers.includes(body.provider as PaymentGatewayProvider) ? body.provider! : "stripe";
  const mode = modes.includes(body.mode as PaymentGatewayMode) ? body.mode! : "test";
  const gateway = await connectPaymentGateway(id, {
    provider,
    mode,
    displayName: body.displayName || (provider === "stripe" ? "Stripe" : "Mock Gateway"),
    publishableKey: body.publishableKey,
    secretKey: body.secretKey,
    webhookSecret: body.webhookSecret,
  });

  return NextResponse.json({ gateway }, { status: 201 });
}
