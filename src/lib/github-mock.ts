import type { GeneratedDocument, Project, Task } from "@/lib/types";

export type MockRepository = {
  id: string;
  fullName: string;
  url: string;
};

export function createMockRepository(slug: string): MockRepository {
  const fullName = `agentpower-labs/${slug}`;

  return {
    id: `mock-repo-${crypto.randomUUID()}`,
    fullName,
    url: `https://github.com/${fullName}`,
  };
}

export function summarizeBootstrap(project: Project, documents: GeneratedDocument[], tasks: Task[]) {
  return {
    repository: project.githubFullName,
    filesCreated: documents.map((document) => document.path),
    issuesCreated: tasks.map((task) => ({
      number: task.githubIssueNumber,
      title: task.title,
      risk: task.riskLevel,
    })),
  };
}
