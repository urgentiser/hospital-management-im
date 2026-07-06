import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/admissions")({
  head: () => ({ meta: [{ title: "Admissions — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "admissions",
        eyebrow: "Clinical · Admissions Service",
        title: "Admissions",
        description: "Real-time bed movements, admissions, transfers and discharges across all facilities.",
        workflow: ["pending", "admitted", "transferred", "discharged"],
        columns: [
          { key: "title", label: "Patient" },
          { key: "Facility", label: "Facility" },
          { key: "Ward", label: "Ward" },
          { key: "Bed", label: "Bed" },
          { key: "Practitioner", label: "Practitioner" },
        ],
        fields: [
          { key: "patient", label: "Patient name", required: true },
          { key: "mrn", label: "MRN", required: true },
          { key: "facility", label: "Facility", type: "select", required: true, options: ["Life Fourways", "Life Groenkloof", "Life Fourways", "Life Kingsbury"] },
          { key: "ward", label: "Ward", placeholder: "e.g. Ward 3B" },
          { key: "bed", label: "Bed", placeholder: "e.g. 12" },
          { key: "practitioner", label: "Attending practitioner" },
          { key: "reason", label: "Reason for admission", type: "textarea" },
        ],
        titleFrom: (f) => String(f["Patient name"] || "New admission"),
        subtitleFrom: (f) => `${f["Facility"]} · ${f["Ward"] || "TBA"} · Bed ${f["Bed"] || "—"}`,
        kpis: (items) => [
          { label: "Currently admitted", value: items.filter((i) => i.status === "admitted").length },
          { label: "Pending", value: items.filter((i) => i.status === "pending").length },
          { label: "Transferred", value: items.filter((i) => i.status === "transferred").length },
          { label: "Discharged", value: items.filter((i) => i.status === "discharged").length },
        ],
      }}
    />
  ),
});
