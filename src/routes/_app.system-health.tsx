import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/system-health")({
  head: () => ({ meta: [{ title: "System Health — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Platform · System Health"
      title="System Health"
      description="Service uptime, dependency status and platform SLO dashboards."
    />
  ),
});
