import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/admin/feature-flags")({
  head: () => ({ meta: [{ title: "Feature Flags — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Administration · Feature Flags"
      title="Feature Flags"
      description="Toggle capabilities per environment, tenant or facility."
    />
  ),
});
