import { NextResponse } from "next/server";
import { decidePullRequest } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { decision?: "merge" | "reject" | "retry" };
  const decision = body.decision ?? "retry";

  if (!["merge", "reject", "retry"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const result = await decidePullRequest(id, decision);
  return NextResponse.json(result);
}
