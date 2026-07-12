import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/admin/support")({
  head: () => ({ meta: [{ title: "Support Tools — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Administration · Support"
      title="Support Tools"
      description="Impersonation, diagnostics and support utilities for operators."
    />
  ),
});
