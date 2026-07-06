import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/ward")({
  head: () => ({ meta: [{ title: "Ward — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Clinical · Ward" title="Ward" description="Bed board, ward transfers, and nursing worklists." />
  ),
});
