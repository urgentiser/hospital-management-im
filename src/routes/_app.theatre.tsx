import { createFileRoute } from "@tanstack/react-router";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/theatre")({
  head: () => ({ meta: [{ title: "Theatre — Impilo" }] }),
  component: () => (
    <ModuleStub eyebrow="Clinical · Theatre" title="Theatre" description="Theatre slot booking, case lists, and utilisation dashboards." />
  ),
});
