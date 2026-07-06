import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Administration — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "admin",
        eyebrow: "Platform · Administration",
        title: "Users & Roles",
        description: "Invite users, assign roles and manage reference data across the platform.",
        workflow: ["invited", "active", "suspended"],
        columns: [
          { key: "title", label: "User" },
          { key: "Email", label: "Email" },
          { key: "Role", label: "Role" },
        ],
        fields: [
          { key: "name", label: "Full name", required: true },
          { key: "email", label: "Email", required: true },
          { key: "role", label: "Role", type: "select", required: true, options: ["Clinical Lead", "Case Manager", "Billing", "Pharmacy", "Admin", "Read-only"] },
        ],
        titleFrom: (f) => String(f["Full name"] || "New user"),
        subtitleFrom: (f) => `${f["Role"]} · ${f["Email"]}`,
      }}
    />
  ),
});
