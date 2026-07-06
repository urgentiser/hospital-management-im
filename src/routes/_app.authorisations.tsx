import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/authorisations")({
  head: () => ({ meta: [{ title: "Authorisations — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "authorisations",
        eyebrow: "Clinical · Funding & Authorisation",
        title: "Authorisations",
        description: "Submit and track scheme authorisations from request through approval or appeal.",
        workflow: ["pending", "review", "approved"],
        outcomes: ["declined"],
        columns: [
          { key: "title", label: "Procedure" },
          { key: "Patient", label: "Patient" },
          { key: "Scheme", label: "Scheme" },
          { key: "Amount", label: "Amount" },
          { key: "Submitted", label: "Submitted" },
        ],
        fields: [
          { key: "procedure", label: "Procedure", required: true },
          { key: "patient", label: "Patient", required: true },
          { key: "scheme", label: "Scheme", type: "select", required: true, options: ["Discovery Health", "Bonitas", "GEMS", "Momentum Health", "Polmed"] },
          { key: "amount", label: "Amount (ZAR)", type: "number", required: true },
          { key: "submittedAt", label: "Submitted", placeholder: "YYYY-MM-DD" },
          { key: "clinical", label: "Clinical motivation", type: "textarea" },
        ],
        titleFrom: (f) => String(f["Procedure"] || "New authorisation"),
        subtitleFrom: (f) => `${f["Patient"]} · ${f["Scheme"]}`,
        kpis: (items) => [
          { label: "Pending", value: items.filter((i) => i.status === "pending").length },
          { label: "Review", value: items.filter((i) => i.status === "review").length },
          { label: "Approved", value: items.filter((i) => i.status === "approved").length },
          { label: "Declined", value: items.filter((i) => i.status === "declined").length },
        ],
      }}
    />
  ),
});
