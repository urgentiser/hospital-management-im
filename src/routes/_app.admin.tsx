import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Administration — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Platform · Admin" title="Administration" description="Users, roles, reference data, and system settings." />
  ),
});
