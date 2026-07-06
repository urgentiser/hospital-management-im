import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Insight · Reports" title="Reports" description="Operational reporting, extracts, and BI dashboards." />
  ),
});
