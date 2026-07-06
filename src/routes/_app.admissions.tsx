import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BedDouble,
  Plus,
  Search,
  MoreHorizontal,
  LayoutDashboard,
  List,
  UserPlus,
  LogOut,
  Ban,
  StopCircle,
  Undo2,
  Baby,
  MapPin,
  Receipt,
  FileText,
  ClipboardCheck,
  ShieldAlert,
  ShieldOff,
  ArrowRightLeft,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useWorkflow, type WorkflowItem } from "@/lib/workflow-store";

export const Route = createFileRoute("/_app/admissions")({
  head: () => ({ meta: [{ title: "Admissions — Impilo" }] }),
  component: AdmissionsPage,
});

const FACILITIES = [
  "Life Fourways",
  "Life Groenkloof",
  "Life Kingsbury",
  "Life Vincent Pallotti",
  "Life Glynnwood",
  "Life East London",
  "Life Westville",
  "Life Entabeni",
];
const WARDS = ["Ward 2A", "Ward 3B", "Ward 4C", "ICU", "HDU", "Maternity", "Paediatrics", "Surgical"];
const SCHEMES = ["Discovery Health", "Momentum", "GEMS", "Polmed", "Bonitas", "Medshield", "Self-Pay"];

type ActionKind =
  | null
  | "view"
  | "admit"
  | "cancel"
  | "discharge"
  | "discontinue"
  | "finalise"
  | "invoices"
  | "billing-checks"
  | "move-ward"
  | "no-auth"
  | "location"
  | "register-birth"
  | "statement"
  | "undischarge";

function AdmissionsPage() {
  const items = useWorkflow((s) => s.items.admissions);
  const create = useWorkflow((s) => s.create);
  const update = useWorkflow((s) => s.update);
  const advance = useWorkflow((s) => s.advance);
  const addNote = useWorkflow((s) => s.addNote);

  const [view, setView] = useState<"list" | "dashboard">("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [facilityFilter, setFacilityFilter] = useState<string>("all");
  const [authFilter, setAuthFilter] = useState<"all" | "no-auth">("all");
  const [action, setAction] = useState<ActionKind>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = items.find((i) => i.id === activeId) ?? null;

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (facilityFilter !== "all" && i.fields.Facility !== facilityFilter) return false;
      if (authFilter === "no-auth" && String(i.fields.Auth ?? "").toLowerCase() !== "none") return false;
      if (query) {
        const hay = [i.id, i.title, i.subtitle ?? "", ...Object.values(i.fields).map(String)]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, query, statusFilter, facilityFilter, authFilter]);

  const kpis = useMemo(() => {
    const admitted = items.filter((i) => i.status === "admitted").length;
    const pending = items.filter((i) => i.status === "pending").length;
    const discharged = items.filter((i) => i.status === "discharged").length;
    const noAuth = items.filter((i) => String(i.fields.Auth ?? "").toLowerCase() === "none").length;
    const avgLos =
      items.reduce((acc, i) => {
        const n = parseInt(String(i.fields.LOS ?? "0"), 10);
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0) / Math.max(items.length, 1);
    const byFacility = FACILITIES.map((f) => ({
      facility: f,
      count: items.filter((i) => i.fields.Facility === f).length,
    }));
    const maxF = Math.max(1, ...byFacility.map((b) => b.count));
    return { admitted, pending, discharged, noAuth, avgLos, byFacility, maxF };
  }, [items]);

  const openAction = (id: string, kind: ActionKind) => {
    setActiveId(id);
    setAction(kind);
  };
  const closeAction = () => setAction(null);

  return (
    <>
      <PageHeader
        eyebrow="Clinical · Admissions Service"
        title="Admissions"
        description="Admit, transfer, discharge and bill inpatients across every Life Healthcare facility."
        actions={
          <>
            <div className="inline-flex rounded-lg border border-border bg-background/60 p-0.5">
              <Button
                size="sm"
                variant={view === "list" ? "default" : "ghost"}
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" /> List
              </Button>
              <Button
                size="sm"
                variant={view === "dashboard" ? "default" : "ghost"}
                onClick={() => setView("dashboard")}
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAuthFilter(authFilter === "no-auth" ? "all" : "no-auth");
                setView("list");
              }}
            >
              <ShieldOff className="h-4 w-4" />
              {authFilter === "no-auth" ? "Showing No-Auth" : "No Auth Admissions"}
            </Button>
            <Button onClick={() => setAction("admit")} className="bg-gradient-primary shadow-glow hover:opacity-90">
              <UserPlus className="h-4 w-4" /> Admit a Patient
            </Button>
          </>
        }
      />

      {view === "dashboard" ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Currently admitted", value: kpis.admitted, icon: BedDouble, tone: "text-success" },
            { label: "Pending", value: kpis.pending, icon: Clock, tone: "text-warning" },
            { label: "Discharged today", value: kpis.discharged, icon: LogOut, tone: "text-muted-foreground" },
            { label: "No-auth flagged", value: kpis.noAuth, icon: ShieldAlert, tone: "text-destructive" },
          ].map((k) => (
            <Card key={k.label} className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <k.icon className={"h-4 w-4 " + k.tone} />
              </div>
              <div className="mt-2 font-display text-3xl tracking-tight">{k.value}</div>
            </Card>
          ))}
          <Card className="p-5 md:col-span-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Avg length of stay</div>
            <div className="mt-2 font-display text-3xl tracking-tight">{kpis.avgLos.toFixed(1)} days</div>
            <p className="mt-1 text-xs text-muted-foreground">Rolling average across all active admissions.</p>
          </Card>
          <Card className="p-5 md:col-span-2">
            <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Admissions by facility</div>
            <ul className="space-y-2">
              {kpis.byFacility.map((b) => (
                <li key={b.facility} className="text-xs">
                  <div className="flex justify-between">
                    <span>{b.facility}</span>
                    <span className="font-mono text-muted-foreground">{b.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-primary"
                      style={{ width: `${(b.count / kpis.maxF) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patients, MRN, wards…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Facility" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All facilities</SelectItem>
                {FACILITIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {["pending", "admitted", "transferred", "discharged", "cancelled", "discontinued"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Facility</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Auth</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      No admissions match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((it) => {
                  const auth = String(it.fields.Auth ?? "AUTH-—");
                  const isNoAuth = auth.toLowerCase() === "none";
                  return (
                    <tr key={it.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3 font-mono text-xs">{it.id}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium">{it.title}</div>
                        <div className="text-xs text-muted-foreground">{String(it.fields.MRN ?? "")}</div>
                      </td>
                      <td className="px-5 py-3">{String(it.fields.Facility ?? "—")}</td>
                      <td className="px-5 py-3">
                        {String(it.fields.Ward ?? "—")} · Bed {String(it.fields.Bed ?? "—")}
                      </td>
                      <td className="px-5 py-3">
                        {isNoAuth ? (
                          <Badge variant="destructive" className="gap-1"><ShieldOff className="h-3 w-3" /> No auth</Badge>
                        ) : (
                          <span className="font-mono text-xs">{auth}</span>
                        )}
                      </td>
                      <td className="px-5 py-3"><StatusChip status={it.status} /></td>
                      <td className="px-3 py-3 text-right">
                        <RowActions
                          item={it}
                          onSelect={(k) => openAction(it.id, k)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* View Admission Sheet */}
      <Sheet open={action === "view" && !!active} onOpenChange={(o) => !o && closeAction()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {active && <AdmissionDetail item={active} />}
        </SheetContent>
      </Sheet>

      {/* Admit dialog */}
      <AdmitDialog
        open={action === "admit"}
        onClose={closeAction}
        onSubmit={(vals) => {
          const created = create("admissions", {
            title: vals.patient,
            subtitle: `${vals.facility} · ${vals.ward} · Bed ${vals.bed}`,
            status: "admitted",
            fields: {
              MRN: vals.mrn,
              Facility: vals.facility,
              Ward: vals.ward,
              Bed: vals.bed,
              Scheme: vals.scheme,
              Auth: vals.auth || "None",
              Reason: vals.reason,
              Practitioner: vals.practitioner,
              Admitted: new Date().toLocaleString(),
              LOS: "0",
              "Billing Status": "open",
            },
          });
          toast.success("Patient admitted", { description: `${created.id} · ${vals.patient}` });
          closeAction();
        }}
      />

      {/* Simple action dialogs */}
      {active && (
        <>
          <ConfirmDialog
            open={action === "cancel"}
            onClose={closeAction}
            title="Cancel admission"
            description={`Cancel admission ${active.id} for ${active.title}? This releases the reserved bed.`}
            confirmLabel="Cancel admission"
            destructive
            onConfirm={(reason) => {
              advance("admissions", active.id, "cancelled", reason || "Cancelled by user");
              update("admissions", active.id, {
                fields: { ...active.fields, "Billing Status": "voided" },
              });
              toast.success("Admission cancelled");
              closeAction();
            }}
          />
          <ConfirmDialog
            open={action === "discontinue"}
            onClose={closeAction}
            title="Discontinue admission"
            description="Close an in-progress admission that will not proceed to discharge (e.g. patient absconded, transferred externally)."
            confirmLabel="Discontinue"
            destructive
            onConfirm={(reason) => {
              advance("admissions", active.id, "discontinued", reason || "Admission discontinued");
              toast.success("Admission discontinued");
              closeAction();
            }}
          />
          <DischargeDialog
            open={action === "discharge"}
            onClose={closeAction}
            item={active}
            onSubmit={(vals) => {
              advance("admissions", active.id, "discharged", `Discharged: ${vals.disposition}. ${vals.summary}`);
              update("admissions", active.id, {
                fields: {
                  ...active.fields,
                  Discharged: new Date().toLocaleString(),
                  Disposition: vals.disposition,
                  "Discharge Summary": vals.summary,
                },
              });
              toast.success("Patient discharged");
              closeAction();
            }}
          />
          <MoveWardDialog
            open={action === "move-ward"}
            onClose={closeAction}
            item={active}
            onSubmit={(vals) => {
              const prev = `${active.fields.Ward} bed ${active.fields.Bed}`;
              update("admissions", active.id, {
                subtitle: `${active.fields.Facility} · ${vals.ward} · Bed ${vals.bed}`,
                fields: { ...active.fields, Ward: vals.ward, Bed: vals.bed },
              });
              addNote("admissions", active.id, `Moved from ${prev} to ${vals.ward} bed ${vals.bed}. ${vals.reason}`);
              advance("admissions", active.id, "transferred", `Internal transfer to ${vals.ward}`);
              // Immediately return to admitted after transfer log
              advance("admissions", active.id, "admitted", "Transfer complete");
              toast.success(`Moved to ${vals.ward} · Bed ${vals.bed}`);
              closeAction();
            }}
          />
          <UndischargeDialog
            open={action === "undischarge"}
            onClose={closeAction}
            item={active}
            onSubmit={(reason) => {
              if (active.status !== "discharged") {
                toast.error("Only discharged EU patients can be undischarged");
                return;
              }
              advance("admissions", active.id, "admitted", `Undischarged (EU): ${reason}`);
              update("admissions", active.id, {
                fields: { ...active.fields, Discharged: "—", "EU Undischarge": new Date().toLocaleString() },
              });
              toast.success("EU patient undischarged");
              closeAction();
            }}
          />
          <RegisterBirthDialog
            open={action === "register-birth"}
            onClose={closeAction}
            item={active}
            onSubmit={(baby) => {
              const babyRecord = create("admissions", {
                title: `Baby of ${active.title}`,
                subtitle: `${active.fields.Facility} · Maternity · Neonate`,
                status: "admitted",
                fields: {
                  MRN: `${active.fields.MRN}-N`,
                  Facility: String(active.fields.Facility),
                  Ward: "Maternity",
                  Bed: `NN-${Math.floor(Math.random() * 20) + 1}`,
                  Scheme: String(active.fields.Scheme ?? "Self-Pay"),
                  Auth: "Pending",
                  "Mother MRN": String(active.fields.MRN),
                  "Baby Name": baby.name,
                  Gender: baby.gender,
                  "Weight (g)": baby.weight,
                  "Time of Birth": baby.time,
                  "Birth Type": baby.type,
                  Admitted: new Date().toLocaleString(),
                  LOS: "0",
                  "Billing Status": "open",
                },
              });
              addNote(
                "admissions",
                active.id,
                `Birth registered: ${baby.name} (${baby.gender}, ${baby.weight}g) at ${baby.time}. Neonate record ${babyRecord.id}.`,
              );
              toast.success("Birth registered", { description: `Neonate ${babyRecord.id} admitted` });
              closeAction();
            }}
          />
          <LocationDialog open={action === "location"} onClose={closeAction} item={active} />
          <FinaliseBillDialog
            open={action === "finalise"}
            onClose={closeAction}
            item={active}
            onSubmit={(total) => {
              update("admissions", active.id, {
                fields: {
                  ...active.fields,
                  "Billing Status": "finalised",
                  "Bill Total": `R ${total.toLocaleString()}`,
                  "Finalised At": new Date().toLocaleString(),
                },
              });
              addNote("admissions", active.id, `Bill finalised: R ${total.toLocaleString()}`);
              toast.success("Bill finalised");
              closeAction();
            }}
          />
          <InvoicesDialog open={action === "invoices"} onClose={closeAction} item={active} />
          <StatementDialog open={action === "statement"} onClose={closeAction} item={active} />
          <BillingChecksDialog
            open={action === "billing-checks"}
            onClose={closeAction}
            item={active}
            onSubmit={(checks) => {
              const passed = Object.values(checks).filter(Boolean).length;
              const total = Object.keys(checks).length;
              update("admissions", active.id, {
                fields: {
                  ...active.fields,
                  "Billing Checks": `${passed}/${total}`,
                  "Checks Updated": new Date().toLocaleString(),
                },
              });
              addNote(
                "admissions",
                active.id,
                `Billing checks reviewed: ${passed}/${total} passed. ${Object.entries(checks)
                  .map(([k, v]) => `${k}:${v ? "✓" : "✗"}`)
                  .join(", ")}`,
              );
              toast.success(`Billing checks saved (${passed}/${total})`);
              closeAction();
            }}
          />
          <NoAuthDialog
            open={action === "no-auth"}
            onClose={closeAction}
            item={active}
            onSubmit={(reason) => {
              update("admissions", active.id, {
                fields: { ...active.fields, Auth: "None", "No-Auth Reason": reason },
              });
              addNote("admissions", active.id, `Flagged No-Auth: ${reason}`);
              toast.success("Admission flagged No-Auth");
              closeAction();
            }}
          />
        </>
      )}
    </>
  );
}

function RowActions({
  item,
  onSelect,
}: {
  item: WorkflowItem;
  onSelect: (k: Exclude<ActionKind, null>) => void;
}) {
  const isDischarged = item.status === "discharged";
  const isClosed = ["cancelled", "discontinued"].includes(item.status);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Admission</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onSelect("view")}><Eye className="mr-2 h-4 w-4" /> View admission</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("location")}><MapPin className="mr-2 h-4 w-4" /> Patient location</DropdownMenuItem>
        <DropdownMenuItem disabled={isClosed || isDischarged} onClick={() => onSelect("move-ward")}>
          <ArrowRightLeft className="mr-2 h-4 w-4" /> Move to ward
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isClosed || isDischarged} onClick={() => onSelect("discharge")}>
          <LogOut className="mr-2 h-4 w-4" /> Discharge patient
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!isDischarged} onClick={() => onSelect("undischarge")}>
          <Undo2 className="mr-2 h-4 w-4" /> Undischarge EU patient
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isClosed || isDischarged} onClick={() => onSelect("register-birth")}>
          <Baby className="mr-2 h-4 w-4" /> Register birth
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Billing</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onSelect("finalise")}><Receipt className="mr-2 h-4 w-4" /> Finalise bill</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("invoices")}><FileText className="mr-2 h-4 w-4" /> Invoices & statements</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("statement")}><FileText className="mr-2 h-4 w-4" /> Statement of account</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("billing-checks")}><ClipboardCheck className="mr-2 h-4 w-4" /> Manage billing checks</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("no-auth")}><ShieldOff className="mr-2 h-4 w-4" /> Flag as No-Auth</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isClosed}
          onClick={() => onSelect("cancel")}
          className="text-destructive focus:text-destructive"
        >
          <Ban className="mr-2 h-4 w-4" /> Cancel admission
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isClosed}
          onClick={() => onSelect("discontinue")}
          className="text-destructive focus:text-destructive"
        >
          <StopCircle className="mr-2 h-4 w-4" /> Discontinue admission
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- Detail Sheet ---------- */
function AdmissionDetail({ item }: { item: WorkflowItem }) {
  return (
    <>
      <SheetHeader className="text-left">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">Admission</div>
        <SheetTitle className="font-display text-2xl">{item.title}</SheetTitle>
        <SheetDescription>{item.subtitle}</SheetDescription>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
          <StatusChip status={item.status} />
        </div>
      </SheetHeader>
      <div className="mt-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Details</div>
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card/40 p-4 text-sm">
          {Object.entries(item.fields).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 font-medium">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Activity
        </div>
        <ol className="relative space-y-3 border-l border-border pl-4">
          {item.history.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="text-sm font-medium">{h.action}</div>
              <div className="text-[11px] text-muted-foreground">{h.at} · {h.by}</div>
              {h.note && <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 text-xs">{h.note}</div>}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

/* ---------- Dialogs ---------- */
function DialogShell({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={wide ? "max-w-2xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-primary" />} {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-2">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

function AdmitDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: {
    patient: string; mrn: string; facility: string; ward: string; bed: string;
    scheme: string; auth: string; reason: string; practitioner: string;
  }) => void;
}) {
  const [v, set] = useState({
    patient: "", mrn: "", facility: FACILITIES[0], ward: WARDS[0], bed: "",
    scheme: SCHEMES[0], auth: "", reason: "", practitioner: "",
  });
  const upd = (k: keyof typeof v, val: string) => set((s) => ({ ...s, [k]: val }));
  const submit = () => {
    if (!v.patient || !v.mrn || !v.bed) {
      toast.error("Patient, MRN and bed are required");
      return;
    }
    onSubmit(v);
    set({ patient: "", mrn: "", facility: FACILITIES[0], ward: WARDS[0], bed: "", scheme: SCHEMES[0], auth: "", reason: "", practitioner: "" });
  };
  return (
    <DialogShell
      open={open} onClose={onClose}
      title="Admit a patient" icon={UserPlus} wide
      description="Register a new inpatient admission and reserve a bed."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-primary hover:opacity-90">Admit patient</Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Patient full name *"><Input value={v.patient} onChange={(e) => upd("patient", e.target.value)} /></Field>
        <Field label="MRN *"><Input value={v.mrn} onChange={(e) => upd("mrn", e.target.value)} placeholder="MRN-0000000" /></Field>
        <Field label="Facility"><SelectFrom value={v.facility} onChange={(x) => upd("facility", x)} options={FACILITIES} /></Field>
        <Field label="Ward"><SelectFrom value={v.ward} onChange={(x) => upd("ward", x)} options={WARDS} /></Field>
        <Field label="Bed *"><Input value={v.bed} onChange={(e) => upd("bed", e.target.value)} placeholder="e.g. 12" /></Field>
        <Field label="Scheme"><SelectFrom value={v.scheme} onChange={(x) => upd("scheme", x)} options={SCHEMES} /></Field>
        <Field label="Authorisation ref"><Input value={v.auth} onChange={(e) => upd("auth", e.target.value)} placeholder="AUTH-40921 or leave blank for No-Auth" /></Field>
        <Field label="Practitioner"><Input value={v.practitioner} onChange={(e) => upd("practitioner", e.target.value)} placeholder="Dr. …" /></Field>
        <div className="md:col-span-2">
          <Field label="Reason for admission"><Textarea rows={3} value={v.reason} onChange={(e) => upd("reason", e.target.value)} /></Field>
        </div>
      </div>
    </DialogShell>
  );
}

function ConfirmDialog({
  open, onClose, title, description, confirmLabel, destructive, onConfirm,
}: {
  open: boolean; onClose: () => void; title: string; description: string;
  confirmLabel: string; destructive?: boolean; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <DialogShell open={open} onClose={onClose} title={title} description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Back</Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => { onConfirm(reason); setReason(""); }}
          >{confirmLabel}</Button>
        </>
      }
    >
      <Field label="Reason / note">
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide a short reason for the audit trail" />
      </Field>
    </DialogShell>
  );
}

function DischargeDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (v: { disposition: string; summary: string }) => void;
}) {
  const [disposition, setDisposition] = useState("Home");
  const [summary, setSummary] = useState("");
  return (
    <DialogShell open={open} onClose={onClose} title="Discharge patient" icon={LogOut}
      description={`Discharge ${item.title} from ${String(item.fields.Facility)} · ${String(item.fields.Ward)}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSubmit({ disposition, summary }); setSummary(""); }} className="bg-gradient-primary hover:opacity-90">
            Confirm discharge
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Disposition">
          <SelectFrom value={disposition} onChange={setDisposition}
            options={["Home", "Step-down facility", "Transfer to other hospital", "Deceased", "Left against advice"]} />
        </Field>
        <Field label="Discharge summary"><Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Clinical summary, medications, follow-up plan…" /></Field>
      </div>
    </DialogShell>
  );
}

function MoveWardDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (v: { ward: string; bed: string; reason: string }) => void;
}) {
  const [ward, setWard] = useState(WARDS[0]);
  const [bed, setBed] = useState("");
  const [reason, setReason] = useState("");
  return (
    <DialogShell open={open} onClose={onClose} title="Move to ward" icon={ArrowRightLeft}
      description={`Currently in ${String(item.fields.Ward)} · Bed ${String(item.fields.Bed)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!bed) return toast.error("Bed is required"); onSubmit({ ward, bed, reason }); }} className="bg-gradient-primary hover:opacity-90">
            Move patient
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="New ward"><SelectFrom value={ward} onChange={setWard} options={WARDS} /></Field>
        <Field label="New bed"><Input value={bed} onChange={(e) => setBed(e.target.value)} placeholder="e.g. 07" /></Field>
        <div className="md:col-span-2">
          <Field label="Reason"><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Clinical escalation / stepdown / isolation…" /></Field>
        </div>
      </div>
    </DialogShell>
  );
}

function UndischargeDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const disabled = item.status !== "discharged";
  return (
    <DialogShell open={open} onClose={onClose} title="Undischarge EU patient" icon={Undo2}
      description="Reverse an emergency-unit discharge captured in error. Requires a written reason."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Back</Button>
          <Button disabled={disabled} onClick={() => onSubmit(reason)}>Undischarge</Button>
        </>
      }
    >
      {disabled ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          This admission is not currently discharged. Only discharged EU patients can be undischarged.
        </div>
      ) : (
        <Field label="Reason for reversal"><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      )}
    </DialogShell>
  );
}

function RegisterBirthDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (v: { name: string; gender: string; weight: string; time: string; type: string }) => void;
}) {
  const [v, set] = useState({ name: "", gender: "F", weight: "3200", time: new Date().toLocaleTimeString().slice(0, 5), type: "Normal vaginal" });
  const upd = (k: keyof typeof v, val: string) => set((s) => ({ ...s, [k]: val }));
  return (
    <DialogShell open={open} onClose={onClose} title="Register birth" icon={Baby}
      description={`Create a neonate record linked to mother ${item.title}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!v.name) return toast.error("Baby name required"); onSubmit(v); }} className="bg-gradient-primary hover:opacity-90">
            Register neonate
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Baby name"><Input value={v.name} onChange={(e) => upd("name", e.target.value)} placeholder="Baby …" /></Field>
        <Field label="Gender"><SelectFrom value={v.gender} onChange={(x) => upd("gender", x)} options={["F", "M", "Unknown"]} /></Field>
        <Field label="Weight (g)"><Input type="number" value={v.weight} onChange={(e) => upd("weight", e.target.value)} /></Field>
        <Field label="Time of birth"><Input value={v.time} onChange={(e) => upd("time", e.target.value)} /></Field>
        <div className="md:col-span-2">
          <Field label="Delivery type"><SelectFrom value={v.type} onChange={(x) => upd("type", x)} options={["Normal vaginal", "Assisted", "Elective C-section", "Emergency C-section"]} /></Field>
        </div>
      </div>
    </DialogShell>
  );
}

function LocationDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: WorkflowItem }) {
  return (
    <DialogShell open={open} onClose={onClose} title="Patient location" icon={MapPin}
      description="Real-time bed assignment based on the latest ward movements.">
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {String(item.fields.Facility)} <span className="text-border">/</span>{" "}
            {String(item.fields.Ward)} <span className="text-border">/</span> Bed {String(item.fields.Bed)}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-border bg-card/60 p-3">
              <div className="text-muted-foreground">Facility</div>
              <div className="mt-1 font-medium">{String(item.fields.Facility)}</div>
            </div>
            <div className="rounded-lg border border-border bg-card/60 p-3">
              <div className="text-muted-foreground">Ward</div>
              <div className="mt-1 font-medium">{String(item.fields.Ward)}</div>
            </div>
            <div className="rounded-lg border border-border bg-card/60 p-3">
              <div className="text-muted-foreground">Bed</div>
              <div className="mt-1 font-mono">{String(item.fields.Bed)}</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Last movement: {item.history[0]?.at ?? "—"} — {item.history[0]?.action ?? "—"}
        </div>
      </div>
    </DialogShell>
  );
}

function FinaliseBillDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (total: number) => void;
}) {
  const los = parseInt(String(item.fields.LOS ?? "1"), 10) || 1;
  const lines = [
    { desc: "Ward fees", qty: los, rate: 3200 },
    { desc: "Consumables", qty: 1, rate: 4500 },
    { desc: "Theatre & anaesthetics", qty: 1, rate: 8600 },
    { desc: "Pharmacy", qty: 1, rate: 2100 },
  ];
  const total = lines.reduce((a, l) => a + l.qty * l.rate, 0);
  return (
    <DialogShell open={open} onClose={onClose} title="Finalise bill" icon={Receipt} wide
      description={`Close the encounter and lock line items for ${item.title}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(total)} className="bg-gradient-primary hover:opacity-90">Finalise & lock</Button>
        </>
      }
    >
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="py-2">Description</th><th>Qty</th><th>Rate</th><th className="text-right">Amount</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {lines.map((l) => (
            <tr key={l.desc}>
              <td className="py-2">{l.desc}</td>
              <td>{l.qty}</td>
              <td>R {l.rate.toLocaleString()}</td>
              <td className="text-right">R {(l.qty * l.rate).toLocaleString()}</td>
            </tr>
          ))}
          <tr className="font-medium"><td colSpan={3} className="py-3 text-right">Total</td><td className="text-right">R {total.toLocaleString()}</td></tr>
        </tbody>
      </table>
    </DialogShell>
  );
}

function InvoicesDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: WorkflowItem }) {
  const invoices = [
    { id: `INV-${item.id.slice(-4)}-01`, date: "2026-07-01", amount: 18400, status: "sent" },
    { id: `INV-${item.id.slice(-4)}-02`, date: "2026-07-03", amount: 6300, status: "paid" },
    { id: `STMT-${item.id.slice(-4)}`, date: "2026-07-05", amount: 24700, status: "generated" },
  ];
  return (
    <DialogShell open={open} onClose={onClose} title="Invoices & statements" icon={FileText} wide
      description="Documents generated against this admission encounter.">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="py-2">Document</th><th>Date</th><th>Amount</th><th>Status</th><th /></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invoices.map((i) => (
            <tr key={i.id}>
              <td className="py-2 font-mono text-xs">{i.id}</td>
              <td>{i.date}</td>
              <td>R {i.amount.toLocaleString()}</td>
              <td><StatusChip status={i.status} /></td>
              <td className="text-right"><Button size="sm" variant="outline" onClick={() => toast.success(`${i.id} downloaded`)}>Download</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </DialogShell>
  );
}

function StatementDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: WorkflowItem }) {
  const rows = [
    { date: "2026-07-01", desc: "Ward fees × 3", debit: 9600, credit: 0 },
    { date: "2026-07-02", desc: "Theatre & anaesthetics", debit: 8600, credit: 0 },
    { date: "2026-07-03", desc: "Scheme payment — Discovery", debit: 0, credit: 12000 },
    { date: "2026-07-04", desc: "Pharmacy", debit: 2100, credit: 0 },
  ];
  let bal = 0;
  const balances = rows.map((r) => { bal += r.debit - r.credit; return bal; });
  return (
    <DialogShell open={open} onClose={onClose} title="Statement of account" icon={FileText} wide
      description={`Running account for ${item.title} (${String(item.fields.Scheme)})`}>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="py-2">Date</th><th>Description</th><th className="text-right">Debit</th><th className="text-right">Credit</th><th className="text-right">Balance</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-2">{r.date}</td>
              <td>{r.desc}</td>
              <td className="text-right">{r.debit ? `R ${r.debit.toLocaleString()}` : "—"}</td>
              <td className="text-right">{r.credit ? `R ${r.credit.toLocaleString()}` : "—"}</td>
              <td className="text-right font-medium">R {balances[i].toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DialogShell>
  );
}

const CHECKLIST = [
  "Authorisation valid",
  "ICD-10 codes captured",
  "Procedure codes captured",
  "Discharge summary uploaded",
  "Signed consent on file",
  "Scheme benefits verified",
];

function BillingChecksDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (checks: Record<string, boolean>) => void;
}) {
  const [state, setState] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CHECKLIST.map((c) => [c, false])),
  );
  const passed = Object.values(state).filter(Boolean).length;
  return (
    <DialogShell open={open} onClose={onClose} title="Manage billing checks" icon={ClipboardCheck}
      description={`Pre-billing quality gate for ${item.title}. ${passed}/${CHECKLIST.length} passing.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(state)} className="bg-gradient-primary hover:opacity-90">Save checks</Button>
        </>
      }
    >
      <ul className="space-y-2">
        {CHECKLIST.map((c) => (
          <li key={c} className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={state[c]} onCheckedChange={(v) => setState((s) => ({ ...s, [c]: !!v }))} />
              {c}
            </label>
            {state[c] ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
          </li>
        ))}
      </ul>
    </DialogShell>
  );
}

function NoAuthDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("Emergency admission — auth pending");
  return (
    <DialogShell open={open} onClose={onClose} title="Flag as No-Auth" icon={ShieldOff}
      description={`Mark ${item.title} as an admission without prior scheme authorisation.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => onSubmit(reason)}>Flag No-Auth</Button>
        </>
      }
    >
      <Field label="Reason"><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
    </DialogShell>
  );
}

/* ---------- tiny helpers ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function SelectFrom({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
