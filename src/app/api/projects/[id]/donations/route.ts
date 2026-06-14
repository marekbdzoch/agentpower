import { NextResponse } from "next/server";
import { addDonation } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    amountCents?: number;
    contributorName?: string;
  };

  const amountCents = Number(body.amountCents ?? 2500);
  const donation = await addDonation(
    id,
    Number.isFinite(amountCents) && amountCents > 0 ? amountCents : 2500,
    body.contributorName || "Anonymous supporter",
  );

  return NextResponse.json({ donation }, { status: 201 });
}
