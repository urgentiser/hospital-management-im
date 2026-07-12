import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/service-bus")({
  head: () => ({ meta: [{ title: "Azure Service Bus Monitor — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Platform · Service Bus"
      title="Azure Service Bus Monitor"
      description="Live queue, topic and subscription telemetry for Azure Service Bus."
    />
  ),
});
