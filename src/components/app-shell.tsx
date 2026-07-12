import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
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
  ClipboardEdit,
  ClipboardCheck,
  Receipt,
  FileText,
  ScrollText,
  Settings,
  Search,
  Bell,
  CircleUser,
  Command,
  ExternalLink,
  Plus,
  Sparkles,
  RotateCcw,
  Menu,
  Triangle,
  HardHat,
  Zap,
  Calculator,
  Inbox,
  Smartphone,
  Radio,
  AlertTriangle,
  BellRing,
  HeartHandshake,
  Hash,
  KeyRound,
  Printer,
  Database,
  LifeBuoy,
  FileCog,
  Workflow,
  Flag,
  Coins,
  FileSearch,
  FileStack,
  ActivitySquare,
} from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { AskImpiloAI } from "@/components/ask-impilo-ai";
import { Sheet, SheetContent } from "@/components/ui/sheet";



type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string };
type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Patient Care",
    items: [
      { to: "/patients", label: "Patient Maintenance", icon: Users, badge: "320" },
      { to: "/triage", label: "Triage", icon: Triangle },
      { to: "/preadmissions", label: "Preadmissions", icon: ClipboardEdit },
      { to: "/clinical-assessments", label: "Clinical Assessments", icon: ClipboardCheck },
      { to: "/admissions", label: "Admissions", icon: BedDouble, badge: "128" },
      { to: "/medical-events", label: "Medical Events", icon: ActivitySquare },
      { to: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    title: "Clinical Operations",
    items: [
      { to: "/ward", label: "Ward Management", icon: HeartPulse },
      { to: "/theatre", label: "Theatre Management", icon: Activity },
      { to: "/pharmacy", label: "Pharmacy", icon: Pill },
      { to: "/case-management", label: "Case Management", icon: ClipboardList },
      { to: "/clinical-coding", label: "Clinical Coding", icon: Hash },
    ],
  },
  {
    title: "Funding & Revenue",
    items: [
      { to: "/authorisations", label: "Authorisations", icon: ShieldCheck, badge: "42" },
      { to: "/funding", label: "Funding", icon: Wallet },
      { to: "/billing", label: "Billing", icon: Receipt },
      { to: "/accounting", label: "Accounting", icon: Calculator },
      { to: "/coid", label: "COID", icon: HardHat },
      { to: "/reimbursements", label: "Reimbursements", icon: Coins },
      { to: "/supplier-invoices", label: "Supplier Invoices", icon: FileStack },
      { to: "/account-enquiries", label: "Account Enquiries", icon: FileSearch },
    ],
  },
  {
    title: "Organisation",
    items: [
      { to: "/facilities", label: "Facilities", icon: Building2 },
      { to: "/practitioners", label: "Practitioners", icon: Stethoscope },
      { to: "/workflow-inbox", label: "Workflow Inbox", icon: Inbox },
      { to: "/mylife-portal", label: "MyLife Portal Instructions", icon: Smartphone },
    ],
  },
  {
    title: "Platform Operations",
    items: [
      { to: "/integrations", label: "Integrations", icon: Zap },
      { to: "/service-bus", label: "Azure Service Bus Monitor", icon: Radio },
      { to: "/failed-messages", label: "Failed Messages", icon: AlertTriangle },
      { to: "/audit", label: "Audit Trail", icon: ScrollText },
      { to: "/notifications", label: "Notifications", icon: BellRing },
      { to: "/system-health", label: "System Health", icon: HeartHandshake },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/admin/users", label: "Users & Permissions", icon: KeyRound },
      { to: "/admin/facilities", label: "Facility Configuration", icon: Building2 },
      { to: "/admin/workflow", label: "Workflow Configuration", icon: Workflow },
      { to: "/admin/documents", label: "Document Configuration", icon: FileCog },
      { to: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
      { to: "/admin/printing", label: "Printing", icon: Printer },
      { to: "/admin/reference", label: "Reference Data", icon: Database },
      { to: "/admin/support", label: "Support Tools", icon: LifeBuoy },
      { to: "/admin", label: "Administration Home", icon: Settings },
    ],
  },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <HeartPulse className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-lg tracking-tight text-sidebar-foreground">Impilo</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Modern Platform</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hidden">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {group.title}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors " +
                        (active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")
                      }
                    >
                      <Icon
                        className={
                          "h-4 w-4 shrink-0 " +
                          (active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")
                        }
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <a
          href="#"
          className="flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5 text-xs text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/20 text-accent">
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
            <div className="leading-tight">
              <div className="font-medium">Open PCMS</div>
              <div className="text-[10px] text-muted-foreground">Product master data</div>
            </div>
          </div>
        </a>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);


  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground lg:hidden">
          <SidebarContent pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Topbar */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/70 px-3 backdrop-blur-xl sm:gap-3 sm:px-4 lg:pl-[17rem] lg:pr-6">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex min-w-0 max-w-xl flex-1 items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:px-3.5"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            <span className="hidden sm:inline">Search patients, admissions, authorisations…</span>
            <span className="sm:hidden">Search…</span>
          </span>
          <kbd className="hidden items-center gap-1 rounded-md border border-border bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:flex">
            <Command className="h-3 w-3" /> K
          </kbd>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-accent md:inline-flex">
            <Sparkles className="h-3 w-3" /> Demo
          </span>
          <button
            title="Reset demo data"
            onClick={() => {
              try {
                localStorage.removeItem("impilo-workflow-v2");
                toast.success("Demo data reset", { description: "Reloading with fresh seed data…" });
                setTimeout(() => window.location.reload(), 400);
              } catch {
                toast.error("Could not reset demo data");
              }
            }}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground md:inline-flex"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <Link
            to="/admissions"
            search={{ new: "1" }}
            className="hidden items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-opacity hover:opacity-90 md:inline-flex"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">New Admission</span>
            <span className="lg:hidden">New</span>
          </Link>
          <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 py-1 pl-1 pr-1 sm:pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <CircleUser className="h-4 w-4" />
            </div>
            <div className="hidden text-left leading-tight md:block">
              <div className="text-xs font-medium">Dr. K. Naidoo</div>
              <div className="text-[10px] text-muted-foreground">Clinical Lead</div>
            </div>
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <AskImpiloAI />




      <main className="min-h-[calc(100vh-4rem)] bg-gradient-hero lg:pl-64">
        <div className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:pb-24 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">{eyebrow}</div>
        )}
        <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success border-success/30",
    admitted: "bg-success/15 text-success border-success/30",
    delivered: "bg-success/15 text-success border-success/30",
    approved: "bg-success/15 text-success border-success/30",
    pending: "bg-warning/15 text-warning border-warning/30",
    review: "bg-info/15 text-info border-info/30",
    retry: "bg-warning/15 text-warning border-warning/30",
    transferred: "bg-info/15 text-info border-info/30",
    discharged: "bg-muted text-muted-foreground border-border",
    closed: "bg-muted text-muted-foreground border-border",
    declined: "bg-destructive/15 text-destructive border-destructive/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    deadletter: "bg-destructive/15 text-destructive border-destructive/30",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize " + cls}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-2xl border border-border bg-card/60 bg-gradient-surface shadow-soft backdrop-blur-sm " + className
      }
    >
      {children}
    </div>
  );
}
