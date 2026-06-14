import { NextResponse } from "next/server";
import { getProjectDashboard } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const dashboard = await getProjectDashboard(slug);

  if (!dashboard) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(dashboard);
}
