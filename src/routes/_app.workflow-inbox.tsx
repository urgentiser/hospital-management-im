import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/workflow-inbox")({
  head: () => ({ meta: [{ title: "Workflow Inbox — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Organisation · Workflow Inbox"
      title="Workflow Inbox"
      description="Unified task inbox for approvals, hand-offs and follow-ups across teams."
    />
  ),
});
