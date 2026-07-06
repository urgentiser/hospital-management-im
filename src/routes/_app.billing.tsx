import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({ meta: [{ title: "Billing — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "billing",
        eyebrow: "Operational · Billing",
        title: "Billing",
        description: "Claim submission, remittance handling and reconciliation.",
        workflow: ["draft", "submitted", "paid", "reconciled"],
        outcomes: ["rejected"],
        columns: [
          { key: "title", label: "Claim" },
          { key: "Scheme", label: "Scheme" },
          { key: "Amount", label: "Amount" },
          { key: "Auth Ref", label: "Auth Ref" },
        ],
        fields: [
          { key: "reference", label: "Claim reference", required: true, placeholder: "CLM-000000" },
          { key: "scheme", label: "Scheme", type: "select", required: true, options: ["Discovery Health", "Bonitas", "GEMS", "Momentum Health", "Polmed"] },
          { key: "amount", label: "Amount (ZAR)", type: "number", required: true },
          { key: "authRef", label: "Authorisation ref", placeholder: "AUTH-…" },
        ],
        titleFrom: (f) => String(f["Claim reference"] || "New claim"),
        subtitleFrom: (f) => `${f["Scheme"]} · R ${f["Amount (ZAR)"]}`,
      }}
    />
  ),
});
