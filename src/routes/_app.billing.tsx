import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({ meta: [{ title: "Billing — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Operational · Billing" title="Billing" description="Claims submission, payments, and reconciliation." />
  ),
});
