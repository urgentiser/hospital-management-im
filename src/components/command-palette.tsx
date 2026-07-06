import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  BedDouble,
  ShieldCheck,
  Building2,
  Stethoscope,
  Wallet,
  HeartPulse,
  Pill,
  Activity,
  ClipboardList,
  Receipt,
  FileText,
  BarChart3,
  ScrollText,
  Settings,
  Plus,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { useWorkflow, type ModuleKey } from "@/lib/workflow-store";

const modules: { key: ModuleKey; to: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "patients", to: "/patients", label: "Patients", icon: Users },
  { key: "admissions", to: "/admissions", label: "Admissions", icon: BedDouble },
  { key: "authorisations", to: "/authorisations", label: "Authorisations", icon: ShieldCheck },
  { key: "pharmacy", to: "/pharmacy", label: "Pharmacy", icon: Pill },
  { key: "theatre", to: "/theatre", label: "Theatre", icon: Activity },
  { key: "ward", to: "/ward", label: "Ward", icon: HeartPulse },
  { key: "facilities", to: "/facilities", label: "Facilities", icon: Building2 },
  { key: "practitioners", to: "/practitioners", label: "Practitioners", icon: Stethoscope },
  { key: "case-management", to: "/case-management", label: "Case Management", icon: ClipboardList },
  { key: "billing", to: "/billing", label: "Billing", icon: Receipt },
  { key: "funding", to: "/funding", label: "Funding", icon: Wallet },
  { key: "documents", to: "/documents", label: "Documents", icon: FileText },
  { key: "integrations", to: "/integrations", label: "Integrations", icon: Activity },
  { key: "audit", to: "/audit", label: "Audit", icon: ScrollText },
  { key: "admin", to: "/admin", label: "Administration", icon: Settings },
  { key: "reports", to: "/reports", label: "Reports", icon: BarChart3 },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const items = useWorkflow((s) => s.items);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: { mod: ModuleKey; to: string; id: string; title: string; subtitle?: string }[] = [];
    for (const m of modules) {
      for (const it of items[m.key]) {
        const hay = [it.id, it.title, it.subtitle ?? "", ...Object.values(it.fields).map(String)].join(" ").toLowerCase();
        if (hay.includes(q)) {
          out.push({ mod: m.key, to: m.to, id: it.id, title: it.title, subtitle: it.subtitle });
          if (out.length >= 12) return out;
        }
      }
    }
    return out;
  }, [items, query]);

  const go = (to: string, opts?: { search?: Record<string, string> }) => {
    onOpenChange(false);
    navigate({ to, search: opts?.search ?? {} });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search records, jump to a module, or run a quick action…"
      />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        {results.length > 0 && (
          <>
            <CommandGroup heading="Records">
              {results.map((r) => (
                <CommandItem
                  key={`${r.mod}-${r.id}`}
                  value={`${r.id} ${r.title} ${r.subtitle ?? ""}`}
                  onSelect={() => go(r.to)}
                >
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm">{r.title}</div>
                      {r.subtitle && <div className="truncate text-xs text-muted-foreground">{r.subtitle}</div>}
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/admissions", { search: { new: "1" } })}>
            <Plus className="h-4 w-4" /> New admission
          </CommandItem>
          <CommandItem onSelect={() => go("/patients", { search: { new: "1" } })}>
            <Plus className="h-4 w-4" /> Register patient
          </CommandItem>
          <CommandItem onSelect={() => go("/authorisations", { search: { new: "1" } })}>
            <Plus className="h-4 w-4" /> Submit authorisation
          </CommandItem>
          <CommandItem onSelect={() => go("/theatre", { search: { new: "1" } })}>
            <Plus className="h-4 w-4" /> Book theatre slot
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              try {
                localStorage.removeItem("impilo-workflow-v2");
                toast.success("Demo data reset", { description: "Reloading with fresh seed data…" });
                setTimeout(() => window.location.reload(), 400);
              } catch {
                toast.error("Could not reset demo data");
              }
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset demo data
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </CommandItem>
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <CommandItem key={m.key} onSelect={() => go(m.to)}>
                <Icon className="h-4 w-4" /> {m.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
