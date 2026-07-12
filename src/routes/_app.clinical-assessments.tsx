import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/clinical-assessments")({
  head: () => ({ meta: [{ title: "Clinical Assessments — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Patient Care · Clinical Assessments"
      title="Clinical Assessments"
      description="Structured clinical assessment forms, scores, and outcomes tracking."
    />
  ),
});
