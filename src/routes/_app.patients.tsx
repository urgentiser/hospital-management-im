import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/patients")({
  head: () => ({ meta: [{ title: "Patients — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "patients",
        eyebrow: "Clinical · Patient Service",
        title: "Patients",
        description: "Search, register and manage patient records across every facility.",
        workflow: ["active", "review", "pending", "closed"],
        outcomes: ["failed"],
        columns: [
          { key: "title", label: "Patient" },
          { key: "MRN", label: "MRN" },
          { key: "Scheme", label: "Scheme" },
          { key: "Facility", label: "Facility" },
          { key: "Practitioner", label: "Practitioner" },
        ],
        fields: [
          { key: "name", label: "Full name", required: true, placeholder: "e.g. Sarah Johnson" },
          { key: "mrn", label: "MRN", required: true, placeholder: "MRN-000000" },
          { key: "dob", label: "Date of birth", placeholder: "YYYY-MM-DD" },
          { key: "gender", label: "Gender", type: "select", options: ["M", "F", "Other"] },
          { key: "scheme", label: "Scheme", type: "select", options: ["Discovery Health", "Bonitas", "GEMS", "Momentum Health", "Polmed", "Other"] },
          { key: "facility", label: "Facility", type: "select", options: ["Life Fourways", "Life Groenkloof", "Life Kingsbury", "Life Vincent Pallotti", "Life Glynnwood", "Life East London", "Life Westville", "Life Entabeni"] },
          { key: "practitioner", label: "Practitioner", placeholder: "e.g. Dr. S. Naidoo" },
        ],
        titleFrom: (f) => String(f["Full name"] || "New patient"),
        subtitleFrom: (f) => `${f["MRN"]} · ${f["Scheme"] || "Unassigned"}`,
        kpis: (items) => [
          { label: "Total patients", value: items.length },
          { label: "Active", value: items.filter((i) => i.status === "active").length },
          { label: "In review", value: items.filter((i) => i.status === "review").length },
          { label: "Closed", value: items.filter((i) => i.status === "closed").length },
        ],
      }}
    />
  ),
});
