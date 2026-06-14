import { LaunchClient } from "@/components/launch-client";
import { getProjectDashboard, listProjects } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await listProjects();
  const dashboards = (
    await Promise.all(projects.map((project) => getProjectDashboard(project.slug)))
  ).filter((dashboard) => dashboard !== null);

  return <LaunchClient initialDashboards={dashboards} />;
}
