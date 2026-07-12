import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/medical-events")({
  head: () => ({ meta: [{ title: "Medical Events — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Patient Care · Medical Events"
      title="Medical Events"
      description="Capture, review and timeline clinical events across an episode of care."
    />
  ),
});
