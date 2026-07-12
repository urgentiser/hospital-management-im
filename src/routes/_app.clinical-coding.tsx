import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/clinical-coding")({
  head: () => ({ meta: [{ title: "Clinical Coding — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Clinical Operations · Clinical Coding"
      title="Clinical Coding"
      description="ICD-10 / CPT / NHRPL coding, coder review queues, and audit workflow."
    />
  ),
});
