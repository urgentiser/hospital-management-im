import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Shield, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { CurrentStateModuleButton } from "@/components/current-state/module-specification";
import { SECTIONS } from "@/components/admin/actions";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Impilo" },
      { name: "description", content: "Users, roles, facility reference data, and platform administration actions." },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSlug = pathname.startsWith("/admin/") ? pathname.split("/")[2] : null;
  const activeSection = SECTIONS.find((s) => s.slug === activeSlug) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Platform · Administration"
        title={activeSection ? activeSection.title : "Administration"}
        description={
          activeSection
            ? activeSection.description
            : "A single control plane for identity, facilities, reference data and platform operations. Choose a section below to dive in."
        }
        actions={
          <>
            <CurrentStateModuleButton moduleKey="admin" compact />
            <div className="hidden items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary sm:inline-flex">
              <Shield className="h-3.5 w-3.5" /> Admin console
            </div>
          </>
        }
      />

      {/* Breadcrumbs / tabs */}
      <nav className="mb-6 -mx-1 flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hidden">
        <TabLink to="/admin" exact label="Overview" />
        {SECTIONS.map((s) => (
          <TabLink key={s.key} to={`/admin/${s.slug}`} label={s.title} />
        ))}
      </nav>

      {activeSection && (
        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/admin" className="hover:text-foreground">Administration</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{activeSection.title}</span>
        </div>
      )}

      <Outlet />
    </>
  );
}

function TabLink({ to, label, exact }: { to: string; label: string; exact?: boolean }) {
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
