import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/failed-messages")({
  head: () => ({ meta: [{ title: "Failed Messages — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Platform · Failed Messages"
      title="Failed Messages"
      description="Dead-letter queue triage — inspect payloads, retry or discard messages."
    />
  ),
});
