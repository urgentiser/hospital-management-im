import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "Audit — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Platform · Audit" title="Audit" description="Full audit trail with correlation IDs across the platform." />
  ),
});
