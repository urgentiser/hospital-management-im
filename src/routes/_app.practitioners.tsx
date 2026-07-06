import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/practitioners")({
  head: () => ({ meta: [{ title: "Practitioners — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Operational · Practitioners" title="Practitioners" description="Directory of practitioners, credentials, and scheme mappings." />
  ),
});
