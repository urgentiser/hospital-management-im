import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/app-shell";
import { Construction } from "lucide-react";

type ModuleConfig = {
  path:
    | "/_app/pharmacy"
    | "/_app/theatre"
    | "/_app/ward"
    | "/_app/facilities"
    | "/_app/practitioners"
    | "/_app/case-management"
    | "/_app/billing"
    | "/_app/funding"
    | "/_app/documents"
    | "/_app/reports"
    | "/_app/audit"
    | "/_app/admin";
  title: string;
  eyebrow: string;
  description: string;
};

export function ModuleStub({ title, eyebrow, description }: Omit<ModuleConfig, "path">) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card className="p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Construction className="h-6 w-6" />
        </div>
        <h3 className="mt-5 font-display text-2xl tracking-tight">Module ready to wire</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          UI shell, navigation, and route are provisioned. Connect to the {title.toLowerCase()} BFF endpoint to populate live data.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] text-muted-foreground">
            BFF contract pending
          </span>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] text-primary">
            Design system ready
          </span>
        </div>
      </Card>
    </>
  );
}

// Route factory below — each module is its own file so file-based routing picks it up.
export const Route = createFileRoute("/_app/pharmacy")({
  head: () => ({ meta: [{ title: "Pharmacy — Impilo" }] }),
  component: () => (
    <ModuleStub
      eyebrow="Clinical · Pharmacy"
      title="Pharmacy"
      description="Dispensing queues, formulary lookups, and PCMS product references."
    />
  ),
});
