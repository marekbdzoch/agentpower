import { NextResponse } from "next/server";
import { enqueueTask } from "@/lib/store";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await enqueueTask(id);

  return NextResponse.json(result, { status: 201 });
}
