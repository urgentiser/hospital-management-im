import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/pharmacy")({
  head: () => ({ meta: [{ title: "Pharmacy — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Clinical · Pharmacy"
      title="Pharmacy"
      description="Dispensing queues, formulary lookups, and PCMS product references."
    />
  ),
});
