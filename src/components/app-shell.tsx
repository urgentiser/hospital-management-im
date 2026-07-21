import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  BedDouble,
  ShieldCheck,
  BadgeCheck,
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
  UserRound,
  X,
} from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { AskImpiloAI } from "@/components/ask-impilo-ai";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, LogOut, UserCog } from "lucide-react";
import { usePatientContext, availablePatients } from "@/lib/patient-context";
import { useAuth } from "@/security/auth-provider";
import { getAuthorisedFacilityNames } from "@/security/facility-scope";
import { canAccessRoute } from "@/security/route-guard";
import { connectedApplications } from "@/configuration/connected-apps";
import { appConfig } from "@/configuration/app-config";
import { ConnectedApplicationsLauncher } from "@/components/connected-applications-launcher";
import { CurrentStateModuleButton, CurrentStatePortfolioLauncher } from "@/components/current-state/module-specification";
import { resolveCurrentStateModuleKey } from "@/current-state/module-manifest";



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
      { to: "/member-validation", label: "Member Validation", icon: BadgeCheck },
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
      { to: "/payments", label: "Payments", icon: Banknote },
      { to: "/claims", label: "Claims", icon: FileCheck },
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
      { to: "/services", label: "Services", icon: ClipboardList },
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

function isItemActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

const OPEN_GROUPS_STORAGE_KEY = "impilo-sidebar-open-groups";

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { principal } = useAuth();
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessRoute(principal, item.to)),
    }))
    .filter((group) => group.items.length > 0);

  // Which visible group contains the current route — always keep that one open.
  const activeGroupTitle =
    visibleGroups.find((g) => g.items.some((i) => isItemActive(pathname, i.to)))?.title ?? null;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(OPEN_GROUPS_STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Record<string, boolean>;
      } catch {
        /* ignore */
      }
    }
    // Default: only the active group is expanded; others collapsed.
    const initial: Record<string, boolean> = {};
    for (const g of visibleGroups) initial[g.title] = g.title === activeGroupTitle;
    return initial;
  });

  // Ensure the active group is always expanded when the route changes.
  useEffect(() => {
    if (!activeGroupTitle) return;
    setOpenGroups((prev) => (prev[activeGroupTitle] ? prev : { ...prev, [activeGroupTitle]: true }));
  }, [activeGroupTitle]);

  useEffect(() => {
    try {
      window.localStorage.setItem(OPEN_GROUPS_STORAGE_KEY, JSON.stringify(openGroups));
    } catch {
      /* ignore */
    }
  }, [openGroups]);

  const toggleGroup = (title: string) =>
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border/70 px-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary/95 shadow-[0_8px_20px_-8px_rgba(231,28,32,0.6)]">
          <HeartPulse className="h-[18px] w-[18px] text-primary-foreground" />
          <span aria-hidden className="absolute -inset-px rounded-xl ring-1 ring-inset ring-white/10" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-[17px] font-semibold tracking-tight text-sidebar-foreground">Impilo</span>
          <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-sidebar-foreground/50">Healthcare Platform</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hidden">
        {visibleGroups.map((group) => {
          const isOpen = !!openGroups[group.title];
          const hasActive = group.items.some((i) => isItemActive(pathname, i.to));
          return (
            <div key={group.title} className="mb-1.5">
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45 transition-colors hover:text-sidebar-foreground"
              >
                <ChevronRight
                  className={
                    "h-3 w-3 shrink-0 opacity-70 transition-transform " + (isOpen ? "rotate-90" : "")
                  }
                />
                <span className="flex-1 text-left">{group.title}</span>
                {!isOpen && hasActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary shadow-[0_0_6px_rgba(231,28,32,0.7)]" aria-hidden />
                )}
              </button>
              {isOpen && (
                <ul className="mt-0.5 space-y-px">
                  {group.items.map((item) => {
                    const active = isItemActive(pathname, item.to);
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={
                            "group relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] outline-none transition-all focus-visible:ring-2 focus-visible:ring-sidebar-primary/50 " +
                            (active
                              ? "bg-sidebar-accent/80 text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground")
                          }
                        >
                          <span
                            aria-hidden
                            className={
                              "absolute left-0 top-1/2 h-4 -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-all " +
                              (active ? "w-[3px] opacity-100" : "w-0 opacity-0")
                            }
                          />
                          <Icon
                            className={
                              "h-4 w-4 shrink-0 transition-colors " +
                              (active ? "text-sidebar-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/90")
                            }
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={
                                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums " +
                                (active
                                  ? "bg-white/12 text-sidebar-foreground"
                                  : "bg-sidebar-accent/50 text-sidebar-foreground/70")
                              }
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <a
          href={connectedApplications.pcms.url || undefined}
          target={connectedApplications.pcms.openMode === "new-tab" ? "_blank" : undefined}
          rel="noopener noreferrer"
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
        <ConnectedApplicationsLauncher compact excludeKeys={["pcms"]} />
        <CurrentStatePortfolioLauncher compact />
      </div>
    </>
  );
}

import { useFacilityContext, FACILITIES, type Facility } from "@/lib/facility-context";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const facility = useFacilityContext((s) => s.facility);
  const setFacility = useFacilityContext((s) => s.setFacility);
  const { principal, logout } = useAuth();
  const authorisedFacilities = getAuthorisedFacilityNames(principal, [...FACILITIES]);
  const primaryRole = principal?.roles[0] ?? "Impilo User";
  const currentStateModuleKey = resolveCurrentStateModuleKey(pathname);

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
          {/* Patient context chip */}
          <PatientContextChip />
          {currentStateModuleKey && (
            <div className="hidden xl:block">
              <CurrentStateModuleButton moduleKey={currentStateModuleKey} compact />
            </div>
          )}
          {/* Facility selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="hidden items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:inline-flex"
                aria-label="Select facility"
              >
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="max-w-[10rem] truncate">{facility}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Active facility
              </DropdownMenuLabel>
              {authorisedFacilities.map((f) => (
                <DropdownMenuItem key={f} onClick={() => setFacility(f as Facility)}>
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{f}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Environment + health */}
          <span
            className="hidden items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-accent lg:inline-flex"
            title="Environment"
          >
            <Sparkles className="h-3 w-3" /> {appConfig.environment}
          </span>
          <Link
            to={"/system-health" as never}
            title="System health · All services operational"
            aria-label="System health"
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:inline-flex"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Healthy
          </Link>

          {appConfig.dataMode === "mock" && (
          <button
            title="Reset demo data"
            aria-label="Reset demo data"
            onClick={() => {
              try {
                localStorage.removeItem("impilo-workflow-v2");
                toast.success("Demo data reset", { description: "Reloading with fresh seed data…" });
                setTimeout(() => window.location.reload(), 400);
              } catch {
                toast.error("Could not reset demo data");
              }
            }}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 xl:inline-flex"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          )}
          <Link
            to="/admissions"
            search={{ new: "1" }}
            className="hidden items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">New Admission</span>
            <span className="lg:hidden">New</span>
          </Link>
          <button
            aria-label="Notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open user menu"
                className="flex items-center gap-2 rounded-lg border border-border bg-card/60 py-1 pl-1 pr-1 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:pr-2.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <CircleUser className="h-4 w-4" />
                </div>
                <div className="hidden text-left leading-tight md:block">
                  <div className="text-xs font-medium">{principal?.displayName ?? "Impilo User"}</div>
                  <div className="text-[10px] text-muted-foreground">{primaryRole}</div>
                </div>
                <ChevronDown className="ml-0.5 hidden h-3 w-3 text-muted-foreground md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm">{principal?.displayName ?? "Impilo User"}</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {primaryRole} · {facility}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCog className="h-4 w-4 text-muted-foreground" /> Preferences
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={"/admin/users" as never}>
                  <KeyRound className="h-4 w-4 text-muted-foreground" /> Users & permissions
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void logout()}>
                <LogOut className="h-4 w-4 text-muted-foreground" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>



      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <AskImpiloAI />




      <main className="min-h-[calc(100vh-4rem)] bg-gradient-hero lg:pl-64">
        <div className="mx-auto w-full max-w-[1560px] px-6 pb-28 pt-5 sm:pb-24 lg:px-8 lg:py-6">{children}</div>
      </main>

    </div>
  );
}

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            {c.to && !last ? (
              <Link to={c.to as never} className="hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className={last ? "text-foreground" : undefined}>{c.label}</span>
            )}
            {!last && <ChevronRight className="h-3 w-3" />}
          </span>
        );
      })}
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <div className="mb-5">
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              <span className="h-px w-6 bg-primary/40" aria-hidden />
              {eyebrow}
            </div>
          )}
          <h1 className="truncate font-display text-[24px] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-[26px]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-3xl truncate text-[13px] leading-snug text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">{actions}</div>}
      </div>
    </div>
  );
}


const STATUS_LABEL: Record<string, string> = {
  deadletter: "Dead letter",
  in_progress: "In progress",
  submitted: "Submitted",
};

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success border-success/30",
    admitted: "bg-success/15 text-success border-success/30",
    delivered: "bg-success/15 text-success border-success/30",
    approved: "bg-success/15 text-success border-success/30",
    completed: "bg-success/15 text-success border-success/30",
    dispensed: "bg-success/15 text-success border-success/30",
    pending: "bg-warning/15 text-warning border-warning/30",
    queued: "bg-warning/15 text-warning border-warning/30",
    submitted: "bg-info/15 text-info border-info/30",
    in_progress: "bg-info/15 text-info border-info/30",
    review: "bg-info/15 text-info border-info/30",
    retry: "bg-warning/15 text-warning border-warning/30",
    transferred: "bg-info/15 text-info border-info/30",
    draft: "bg-muted text-muted-foreground border-border",
    discharged: "bg-muted text-muted-foreground border-border",
    closed: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-muted text-muted-foreground border-border",
    declined: "bg-destructive/15 text-destructive border-destructive/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    deadletter: "bg-destructive/15 text-destructive border-destructive/30",
    suppressed: "bg-destructive/15 text-destructive border-destructive/30",
  };
  const key = status?.toLowerCase?.() ?? "";
  const cls = map[key] ?? "bg-muted text-muted-foreground border-border";
  const label = STATUS_LABEL[key] ?? status;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize tabular-nums " +
        cls
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-2xl border border-border/80 bg-card shadow-soft " + className
      }
    >
      {children}
    </div>
  );
}

function PatientContextChip() {
  const currentId = usePatientContext((s) => s.currentPatientId);
  const setPatient = usePatientContext((s) => s.setPatient);
  const current = currentId ? availablePatients.find((p) => p.id === currentId) ?? null : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={current ? `Patient context: ${current.name}` : "Select patient context"}
          className={
            "hidden items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:inline-flex " +
            (current
              ? "border-primary/40 bg-primary/10 text-foreground hover:border-primary/60"
              : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground")
          }
        >
          <UserRound className={"h-3.5 w-3.5 " + (current ? "text-primary" : "text-muted-foreground")} />
          {current ? (
            <>
              <span className="max-w-[9rem] truncate">{current.name}</span>
              <span className="hidden font-mono text-[10px] text-muted-foreground lg:inline">{current.mrn}</span>
            </>
          ) : (
            <span>No patient</span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Patient context
        </DropdownMenuLabel>
        {current && (
          <>
            <DropdownMenuItem onClick={() => setPatient(null)} className="text-destructive focus:text-destructive">
              <X className="h-3.5 w-3.5" />
              <span>Clear current patient</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {availablePatients.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => setPatient(p.id)}>
            <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-xs font-medium">{p.name}</span>
              <span className="truncate text-[10px] text-muted-foreground">
                <span className="font-mono">{p.mrn}</span> · {p.scheme}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

