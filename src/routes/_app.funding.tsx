import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/funding")({
  head: () => ({ meta: [{ title: "Funding — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Operational · Funding" title="Funding" description="Scheme funding rules and benefit checks." />
  ),
});
