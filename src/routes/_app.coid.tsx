import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/coid")({
  head: () => ({
    meta: [
      { title: "COID Claims — Impilo" },
      { name: "description", content: "Compensation for Occupational Injuries and Diseases (COID) claim intake and lifecycle." },
    ],
  }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "coid",
        eyebrow: "Statutory · COID",
        title: "COID",
        description: "Register injury-on-duty and occupational disease cases, submit to the Compensation Commissioner and track through payment.",
        workflow: ["intake", "submitted", "assessment", "approved", "paid"],
        outcomes: ["rejected"],
        columns: [
          { key: "title", label: "Case" },
          { key: "Employer", label: "Employer" },
          { key: "COID Ref", label: "COID Ref" },
          { key: "Injury", label: "Injury" },
        ],
        fields: [
          { key: "patient", label: "Patient", required: true, placeholder: "Full name" },
          { key: "employer", label: "Employer", required: true },
          { key: "coidRef", label: "COID reference", placeholder: "W.CL-000000" },
          { key: "injury", label: "Injury / condition", required: true },
          { key: "incidentDate", label: "Incident date", placeholder: "YYYY-MM-DD" },
          { key: "bodyPart", label: "Body part" },
          { key: "notes", label: "Description", type: "textarea" },
        ],
        titleFrom: (f) => `Injury on duty — ${f["Patient"]}`,
        subtitleFrom: (f) => `Employer: ${f["Employer"]}`,
        kpis: (items) => [
          { label: "Open", value: items.filter((i) => ["intake", "submitted", "assessment"].includes(i.status)).length },
          { label: "Approved", value: items.filter((i) => i.status === "approved").length },
          { label: "Paid", value: items.filter((i) => i.status === "paid").length },
          { label: "Rejected", value: items.filter((i) => i.status === "rejected").length },
        ],
      }}
    />
  ),
});
