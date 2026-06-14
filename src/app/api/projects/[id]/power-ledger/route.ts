import { NextResponse } from "next/server";
import { getProjectDashboard } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const dashboard = await getProjectDashboard(id);

  if (!dashboard) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    projectId: dashboard.project.id,
    balanceDays: dashboard.powerBalanceDays,
    pricePerDayCents: dashboard.powerPricing.pricePerDayCents,
    entries: dashboard.powerLedger,
  });
}
