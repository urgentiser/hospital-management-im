import { Link } from "@tanstack/react-router";
import {
  Building2, FileCog, FileText, Flag, Printer, ShieldCheck, ToolCase, Users, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tile = {
  key: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
};

const tiles: Tile[] = [
  { key: "users",        label: "Users & permissions", hint: "Roles · access",      icon: Users,      to: "/admin/users" },
  { key: "facilities",   label: "Facility config",     hint: "Sites · billing",     icon: Building2,  to: "/admin/facilities" },
  { key: "workflow",     label: "Workflow config",     hint: "Rules · routing",     icon: Wrench,     to: "/admin/workflow" },
  { key: "documents",    label: "Document config",     hint: "Templates · tags",    icon: FileText,   to: "/admin/documents" },
  { key: "featureFlags", label: "Feature flags",       hint: "Toggle · govern",     icon: Flag,       to: "/admin/feature-flags" },
  { key: "printing",     label: "Printing",            hint: "Devices · queues",    icon: Printer,    to: "/admin/printing" },
  { key: "reference",    label: "Reference data",      hint: "Code sets · lookups", icon: FileCog,    to: "/admin/reference" },
  { key: "support",      label: "Support tools",       hint: "Diagnostics",         icon: ToolCase,   to: "/admin/support" },
];

export function AdminStrip({ activeKey }: { activeKey?: string }) {
  return (
    <div className="mb-6 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Administration workspace
        </div>
        <span className="text-[11px] text-muted-foreground">Governance · configuration</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {tiles.map((t) => {
          const Icon = t.icon;
          const active = activeKey === t.key;
          return (
            <Link
              key={t.key}
              to={t.to}
              className={cn(
                "group flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 transition",
                "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active && "border-primary/50 bg-primary/5 ring-2 ring-primary/30",
              )}
            >
              <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="mt-1 text-[12px] font-semibold text-foreground">{t.label}</span>
              <span className="text-[11px] text-muted-foreground">{t.hint}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
