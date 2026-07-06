import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/documents")({
  head: () => ({ meta: [{ title: "Documents — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Operational · Documents" title="Documents" description="Clinical and administrative document repository." />
  ),
});
