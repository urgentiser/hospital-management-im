import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/adhoc")({
  head: () => ({
    meta: [
      { title: "Adhoc Charges — Impilo" },
      { name: "description", content: "Capture and approve adhoc charges, adjustments and discounts outside the standard billing flow." },
    ],
  }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "adhoc",
        eyebrow: "Financial · Adhoc",
        title: "Adhoc",
        description: "Post one-off charges, credits and manual adjustments with reason and approval trail.",
        workflow: ["captured", "approved", "posted"],
        outcomes: ["rejected", "reversed"],
        columns: [
          { key: "title", label: "Item" },
          { key: "Patient", label: "Patient" },
          { key: "Amount", label: "Amount" },
          { key: "Reason", label: "Reason" },
        ],
        fields: [
          { key: "patient", label: "Patient", required: true },
          { key: "type", label: "Type", type: "select",
            options: ["Charge", "Credit / discount", "Refund", "Write-off", "Manual journal"] },
          { key: "amount", label: "Amount", required: true, placeholder: "R 0.00 (use minus for credits)" },
          { key: "reason", label: "Reason", required: true },
          { key: "reference", label: "Reference", placeholder: "Related visit / invoice" },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
        titleFrom: (f) => `${f["Type"] || "Adhoc"} — ${f["Reason"]}`,
        subtitleFrom: (f) => `${f["Patient"]} · ${f["Amount"]}`,
        kpis: (items) => [
          { label: "Captured", value: items.filter((i) => i.status === "captured").length },
          { label: "Approved", value: items.filter((i) => i.status === "approved").length },
          { label: "Posted", value: items.filter((i) => i.status === "posted").length },
          { label: "Reversed", value: items.filter((i) => i.status === "reversed").length },
        ],
      }}
    />
  ),
});
