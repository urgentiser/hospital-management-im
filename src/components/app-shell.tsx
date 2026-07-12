import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Receipt,
  FileText,
  BarChart3,
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
  HardHat,
  Zap,
  Calculator,
  Stethoscope as TriageIcon,
  Briefcase,
  ServerCog,
  AlertOctagon,
  MailWarning,
  LogOut,
  UserCog,
  ChevronDown,
  MapPin,
  Clock,
  Activity as ActivityIcon,
} from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { AskImpiloAI } from "@/components/ask-impilo-ai";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLES, ROLE_COLOR, type Role } from "@/rules/roles";
import { ALL_FACILITIES, FACILITIES } from "@/rules/facilities";
import type { Permission } from "@/rules/permissions";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string; permission?: Permission };
type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/my-work", label: "My Work", icon: Briefcase, permission: "my-work:view" },
      { to: "/notifications", label: "Notifications", icon: Bell, permission: "notifications:view" },
      { to: "/reports", label: "Reports & BI", icon: BarChart3, permission: "reports:view" },
    ],
  },
  {
    title: "Clinical",
    items: [
      { to: "/patients", label: "Patients", icon: Users, badge: "24", permission: "patients:view" },
      { to: "/preadmissions", label: "Pre-admissions", icon: ClipboardEdit },
      { to: "/admissions", label: "Admissions", icon: BedDouble, badge: "22", permission: "admissions:view" },
      { to: "/medical-events", label: "Medical Events", icon: ActivityIcon, permission: "medical-events:view" },
      { to: "/authorisations", label: "Authorisations", icon: ShieldCheck, permission: "authorisations:view" },
      { to: "/pharmacy", label: "Pharmacy", icon: Pill, permission: "pharmacy:view" },
      { to: "/theatre", label: "Theatre", icon: Activity, permission: "theatre:view" },
      { to: "/ward", label: "Ward Management", icon: HeartPulse, permission: "ward:view" },
      { to: "/triage", label: "Triage", icon: TriageIcon },
    ],
  },
  {
    title: "Operational",
    items: [
      { to: "/facilities", label: "Facilities", icon: Building2 },
      { to: "/practitioners", label: "Practitioners", icon: Stethoscope },
      { to: "/case-management", label: "Case Management", icon: ClipboardList },
      { to: "/billing", label: "Billing & Payments", icon: Receipt, permission: "billing:view" },
      { to: "/funding", label: "Funding", icon: Wallet },
      { to: "/documents", label: "Documents", icon: FileText, permission: "documents:view" },
    ],
  },
  {
    title: "Financial & Ops",
    items: [
      { to: "/coid", label: "COID", icon: HardHat },
      { to: "/adhoc", label: "Adhoc", icon: Zap },
      { to: "/accounting", label: "Accounting", icon: Calculator },
    ],
  },
  {
    title: "Platform",
    items: [
      { to: "/integrations", label: "Integration Monitor", icon: Activity, permission: "integrations:view" },
      { to: "/failed-messages", label: "Failed Messages", icon: MailWarning, permission: "failed-messages:view" },
      { to: "/system-health", label: "System Health", icon: ServerCog, permission: "system-health:view" },
      { to: "/audit", label: "Audit", icon: ScrollText, permission: "audit:view" },
      { to: "/admin", label: "Administration", icon: Settings, permission: "admin:view" },
      { to: "/pcms", label: "PCMS External", icon: ExternalLink, permission: "pcms:launch" },
    ],
  },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { can } = useAuth();
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
                const denied = item.permission ? !can(item.permission) : false;
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      title={denied ? "You don't have access to this page" : undefined}
                      className={
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors " +
                        (denied ? "pointer-events-none opacity-40 " : "") +
                        (active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")
                      }
                    >
                      <Icon className={"h-4 w-4 shrink-0 " + (active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
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
        <Link
          to="/pcms"
          className="flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5 text-xs text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/20 text-accent">
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
            <div className="leading-tight">
              <div className="font-medium">Open PCMS</div>
              <div className="text-[10px] text-muted-foreground">External system</div>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}

function RoleSimulator() {
  const { session, activeRole, switchRole } = useAuth();
  const [open, setOpen] = useState(false);
  if (!session || !activeRole) return null;
  const availableRoles = session.user.roles.length > 0 ? session.user.roles : ROLES;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={"hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:inline-flex " + ROLE_COLOR[activeRole]}
        title="Role simulator"
      >
        <UserCog className="h-3 w-3" />
        <span>Role: {activeRole}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Simulate role</div>
            {availableRoles.map((r: Role) => (
              <button
                key={r}
                onClick={() => { switchRole(r); setOpen(false); }}
                className={"flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/50 " + (r === activeRole ? "bg-muted/40" : "")}
              >
                <span>{r}</span>
                {r === activeRole && <span className="text-[10px] text-primary">Active</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FacilitySelector() {
  const { activeFacility, switchFacility } = useAuth();
  const [open, setOpen] = useState(false);
  const label = activeFacility === ALL_FACILITIES ? "All facilities" : FACILITIES.find((f) => f.id === activeFacility)?.name ?? "Select facility";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground md:inline-flex"
      >
        <MapPin className="h-3 w-3" />
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Facility scope</div>
            <button
              onClick={() => { switchFacility(ALL_FACILITIES); setOpen(false); }}
              className={"flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/50 " + (activeFacility === ALL_FACILITIES ? "bg-muted/40" : "")}
            >
              <span>All facilities</span>
              {activeFacility === ALL_FACILITIES && <span className="text-[10px] text-primary">Active</span>}
            </button>
            {FACILITIES.map((f) => (
              <button
                key={f.id}
                onClick={() => { switchFacility(f.id); setOpen(false); }}
                className={"flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/50 " + (activeFacility === f.id ? "bg-muted/40" : "")}
              >
                <div className="flex flex-col">
                  <span>{f.name}</span>
                  <span className="text-[10px] text-muted-foreground">{f.city} · {f.province}</span>
                </div>
                {activeFacility === f.id && <span className="text-[10px] text-primary">Active</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SessionPill() {
  const { expiresAt, isExpiring, extend } = useAuth();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  if (!expiresAt) return null;
  const remainingMin = Math.max(0, Math.round((expiresAt - now) / 60000));
  if (remainingMin > 5 && !isExpiring) return null;
  return (
    <button
      onClick={extend}
      className="hidden items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-500 md:inline-flex"
      title="Click to extend session"
    >
      <Clock className="h-3 w-3" /> Session {remainingMin}m — Extend
    </button>
  );
}

function UserMenu() {
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const initials = useMemo(() => session?.user.displayName.split(" ").map((s) => s[0]).slice(0, 2).join("") ?? "?", [session]);
  if (!session) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg border border-border bg-card/60 py-1 pl-1 pr-1 sm:pr-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">{initials}</div>
        <div className="hidden text-left leading-tight md:block">
          <div className="text-xs font-medium">{session.user.displayName}</div>
          <div className="text-[10px] text-muted-foreground">{session.user.jobTitle}</div>
        </div>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground">{session.user.email}</div>
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50">
              <CircleUser className="h-3.5 w-3.5" /> View profile
            </Link>
            <button onClick={() => { setOpen(false); logout(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
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

  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground lg:hidden">
          <SidebarContent pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

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
          className="flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:px-3.5"
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
          <SessionPill />
          <FacilitySelector />
          <RoleSimulator />
          <span className="hidden items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-accent xl:inline-flex">
            <Sparkles className="h-3 w-3" /> Demo
          </span>
          <button
            title="Reset demo data"
            onClick={() => {
              try {
                localStorage.removeItem("impilo-workflow-v2");
                toast.success("Demo data reset", { description: "Reloading with fresh seed data…" });
                setTimeout(() => window.location.reload(), 400);
              } catch { toast.error("Could not reset demo data"); }
            }}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground xl:inline-flex"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <Link
            to="/admissions"
            search={{ new: "1" }}
            className="hidden items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-opacity hover:opacity-90 lg:inline-flex"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xl:inline">New Admission</span>
            <span className="xl:hidden">New</span>
          </Link>
          <Link to="/notifications" className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </Link>
          <UserMenu />
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
    cleared: "bg-success/15 text-success border-success/30",
    clean: "bg-success/15 text-success border-success/30",
    healthy: "bg-success/15 text-success border-success/30",
    pending: "bg-warning/15 text-warning border-warning/30",
    processing: "bg-warning/15 text-warning border-warning/30",
    scanning: "bg-warning/15 text-warning border-warning/30",
    "bed-allocated": "bg-info/15 text-info border-info/30",
    "in-theatre": "bg-info/15 text-info border-info/30",
    review: "bg-info/15 text-info border-info/30",
    retry: "bg-warning/15 text-warning border-warning/30",
    transferred: "bg-info/15 text-info border-info/30",
    discharged: "bg-muted text-muted-foreground border-border",
    closed: "bg-muted text-muted-foreground border-border",
    archived: "bg-muted text-muted-foreground border-border",
    ignored: "bg-muted text-muted-foreground border-border",
    draft: "bg-muted text-muted-foreground border-border",
    degraded: "bg-warning/15 text-warning border-warning/30",
    declined: "bg-destructive/15 text-destructive border-destructive/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    down: "bg-destructive/15 text-destructive border-destructive/30",
    deadletter: "bg-destructive/15 text-destructive border-destructive/30",
    refunded: "bg-info/15 text-info border-info/30",
    reversed: "bg-destructive/15 text-destructive border-destructive/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize " + cls}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status.replace(/-/g, " ")}
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
