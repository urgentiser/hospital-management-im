import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/supplier-invoices")({
  head: () => ({ meta: [{ title: "Supplier Invoices — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Funding & Revenue · Supplier Invoices"
      title="Supplier Invoices"
      description="Capture, match and post supplier invoices with credit notes and GL routing."
    />
  ),
});
