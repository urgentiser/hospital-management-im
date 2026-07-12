import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/admin/workflow")({
  head: () => ({ meta: [{ title: "Workflow Configuration — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Administration · Workflow"
      title="Workflow Configuration"
      description="Configure workflow states, transitions and routing rules."
    />
  ),
});
