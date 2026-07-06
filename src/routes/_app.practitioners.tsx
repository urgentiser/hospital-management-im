import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/practitioners")({
  head: () => ({ meta: [{ title: "Practitioners — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "practitioners",
        eyebrow: "Operational · Practitioners",
        title: "Practitioners",
        description: "Credentialing, onboarding and speciality routing for clinical staff.",
        workflow: ["pending", "active", "suspended"],
        columns: [
          { key: "title", label: "Practitioner" },
          { key: "HPCSA", label: "HPCSA" },
          { key: "Speciality", label: "Speciality" },
          { key: "Facility", label: "Facility" },
        ],
        fields: [
          { key: "name", label: "Full name", required: true, placeholder: "Dr. …" },
          { key: "hpcsa", label: "HPCSA number", required: true },
          { key: "speciality", label: "Speciality" },
          { key: "facility", label: "Primary facility" },
          { key: "email", label: "Email" },
        ],
        titleFrom: (f) => String(f["Full name"] || "New practitioner"),
        subtitleFrom: (f) => `${f["Speciality"]} · ${f["Primary facility"]}`,
      }}
    />
  ),
});
