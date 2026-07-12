import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Platform · Notifications"
      title="Notifications"
      description="Notification streams, templates and delivery status across channels."
    />
  ),
});
