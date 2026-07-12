import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/mylife-portal")({
  head: () => ({ meta: [{ title: "MyLife Portal Instructions — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Organisation · MyLife Portal"
      title="MyLife Portal Instructions"
      description="Publish, review and manage patient-facing MyLife portal instructions."
    />
  ),
});
