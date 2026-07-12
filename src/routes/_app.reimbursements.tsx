import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/reimbursements")({
  head: () => ({ meta: [{ title: "Reimbursements — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Funding & Revenue · Reimbursements"
      title="Reimbursements"
      description="Track scheme, patient and third-party reimbursements end-to-end."
    />
  ),
});
