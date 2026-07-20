import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Pill, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { CurrentStateModuleButton } from "@/components/current-state/module-specification";
import { SECTIONS } from "@/components/pharmacy/actions";

export const Route = createFileRoute("/_app/pharmacy")({
  head: () => ({
    meta: [
      { title: "Pharmacy — Impilo" },
      { name: "description", content: "Dispense, compound, label and manage retail, ward and theatre pharmacy workflows." },
    ],
  }),
  component: PharmacyLayout,
});

function PharmacyLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSlug = pathname.startsWith("/pharmacy/") ? pathname.split("/")[2] : null;
  const activeSection = SECTIONS.find((s) => s.slug === activeSlug) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Clinical · Pharmacy"
        title={activeSection ? activeSection.title : "Pharmacy"}
        description={
          activeSection
            ? activeSection.description
            : "A single control plane for dispensing, compounding, labelling, retail and account workflows. Choose a section below to dive in."
        }
        actions={
          <>
            <CurrentStateModuleButton moduleKey="pharmacy" compact />
            <div className="hidden items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary sm:inline-flex">
              <Pill className="h-3.5 w-3.5" /> Pharmacy console
            </div>
          </>
        }
      />

      <nav className="mb-6 -mx-1 flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hidden">
        <TabLink to="/pharmacy" exact label="Overview" />
        <TabLink to={"/pharmacy/business-flow" as "/pharmacy"} label="Guided Workflow" />
        {SECTIONS.map((s) => (
          <TabLink key={s.key} to={`/pharmacy/${s.slug}` as "/pharmacy"} label={s.title} />
        ))}
      </nav>

      {activeSection && (
        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/pharmacy" className="hover:text-foreground">Pharmacy</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{activeSection.title}</span>
        </div>
      )}

      <Outlet />
    </>
  );
}

function TabLink({ to, label, exact }: { to: "/pharmacy"; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: !!exact }}
      className="shrink-0 rounded-full border border-transparent px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground data-[status=active]:border-primary/40 data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
    >
      {label}
    </Link>
  );
}
