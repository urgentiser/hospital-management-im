import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/admin/documents")({
  head: () => ({ meta: [{ title: "Document Configuration — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Administration · Documents"
      title="Document Configuration"
      description="Document templates, categories, retention and signing rules."
    />
  ),
});
