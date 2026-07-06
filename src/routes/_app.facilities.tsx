import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/facilities")({
  head: () => ({ meta: [{ title: "Facilities — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Operational · Facilities" title="Facilities" description="Manage facilities, wards, and bed configuration." />
  ),
});
