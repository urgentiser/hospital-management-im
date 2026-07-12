import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/account-enquiries")({
  head: () => ({ meta: [{ title: "Account Enquiries — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Funding & Revenue · Account Enquiries"
      title="Account Enquiries"
      description="Search accounts, view balances, transactions and reconciliation status."
    />
  ),
});
