import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/case-management")({
  head: () => ({ meta: [{ title: "Case Management — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Operational · Cases" title="Case Management" description="Long-running case timelines and multi-party workflows." />
  ),
});
