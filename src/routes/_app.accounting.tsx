import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/accounting")({
  head: () => ({
    meta: [
      { title: "Accounting — Impilo" },
      { name: "description", content: "General ledger journals, revenue postings and month-end close for Impilo." },
    ],
  }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "accounting",
        eyebrow: "Financial · Accounting",
        title: "Accounting",
        description: "Prepare, review and post GL journals; monitor revenue, provisions and month-end close.",
        workflow: ["draft", "pending", "posted", "closed"],
        outcomes: ["reversed"],
        columns: [
          { key: "title", label: "Journal" },
          { key: "Account", label: "GL account" },
          { key: "Amount", label: "Amount" },
          { key: "Period", label: "Period" },
          { key: "Journal", label: "Ref" },
        ],
        fields: [
          { key: "description", label: "Description", required: true, placeholder: "e.g. June revenue posting" },
          { key: "account", label: "GL account", required: true, placeholder: "e.g. 4000 Revenue" },
          { key: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
          { key: "period", label: "Period", required: true, placeholder: "e.g. June 2026" },
          { key: "journal", label: "Journal ref", placeholder: "JV-0000" },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
        titleFrom: (f) => String(f["Description"] || "New journal"),
        subtitleFrom: (f) => `${f["Account"]} · ${f["Amount"]}`,
        kpis: (items) => [
          { label: "Draft", value: items.filter((i) => i.status === "draft").length },
          { label: "Pending review", value: items.filter((i) => i.status === "pending").length },
          { label: "Posted", value: items.filter((i) => i.status === "posted").length },
          { label: "Closed", value: items.filter((i) => i.status === "closed").length },
        ],
      }}
    />
  ),
});
