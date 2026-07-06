import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Search,
  MoreHorizontal,
  UserCog,
  ClipboardCheck,
  Users,
  MessageSquarePlus,
  ArrowUpCircle,
  Receipt,
  RotateCcw,
  Wrench,
  Eye,
  Plus,
  Settings2,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
} from "lucide-react";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useWorkflow, type WorkflowItem } from "@/lib/workflow-store";

export const Route = createFileRoute("/_app/case-management")({
  head: () => ({ meta: [{ title: "Case Management — Impilo" }] }),
  component: CaseManagementPage,
});

const CASE_MANAGERS = [
  "Case Mgr J. Adams",
  "Case Mgr L. Pillay",
  "Case Mgr T. Naidoo",
  "Case Mgr P. van Wyk",
  "Case Mgr M. Khumalo",
];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const CATEGORIES = ["Clinical", "Financial", "Compliance", "Complaint", "Multi-party"];
const BILLING_CHECK_KEYS = [
  "Auth on file",
  "Tariff codes correct",
  "Co-payment captured",
  "Practitioner billing verified",
  "Scheme member active",
] as const;

type Action =
  | null
  | "view"
  | "new"
  | "assign"
  | "billing-checks"
  | "roster"
  | "enquiry"
  | "escalate"
  | "finalise"
  | "unfinal"
  | "resolve"
  | "manage"
  | "admin";

function CaseManagementPage() {
  const items = useWorkflow((s) => s.items["case-management"]);
  const create = useWorkflow((s) => s.create);
  const update = useWorkflow((s) => s.update);
  const advance = useWorkflow((s) => s.advance);
  const addNote = useWorkflow((s) => s.addNote);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<Action>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = items.find((i) => i.id === activeId) ?? null;

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (ownerFilter !== "all" && i.fields.Owner !== ownerFilter) return false;
      if (priorityFilter !== "all" && i.fields.Priority !== priorityFilter) return false;
      if (query) {
        const hay = [i.id, i.title, i.subtitle ?? "", ...Object.values(i.fields).map(String)]
          .join(" ").toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, query, statusFilter, ownerFilter, priorityFilter]);

  const kpis = useMemo(() => {
    const open = items.filter((i) => !["closed", "escalated"].includes(i.status)).length;
    const escalated = items.filter((i) => i.status === "escalated").length;
    const overdue = items.filter((i) => {
      const sla = Number(i.fields["SLA Days"] ?? 0);
      const days = (Date.now() - new Date(i.createdAt).getTime()) / 86_400_000;
      return sla > 0 && days > sla && !["closed"].includes(i.status);
    }).length;
    const unresolved = items.reduce(
      (n, i) => n + (Number(i.fields["Open Issues"] ?? 0) || 0), 0,
    );
    return { open, escalated, overdue, unresolved };
  }, [items]);

  const openAction = (id: string | null, kind: Action) => {
    setActiveId(id);
    setAction(kind);
  };
  const closeAction = () => setAction(null);
  const toggleSel = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <PageHeader
        eyebrow="Operational · Cases"
        title="Case Management"
        description="Long-running case timelines with multi-party workflows, SLA tracking and escalation."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => openAction(null, "roster")}>
              <Users className="h-4 w-4" /> Case Manager Roster
            </Button>
            <Button size="sm" variant="outline" onClick={() => openAction(null, "admin")}>
              <Settings2 className="h-4 w-4" /> Case Administration
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={selected.length === 0}
              onClick={() => openAction(null, "assign")}
            >
              <UserCog className="h-4 w-4" /> Assign {selected.length > 0 ? `(${selected.length})` : ""}
            </Button>
            <Button onClick={() => openAction(null, "new")} className="bg-gradient-primary shadow-glow hover:opacity-90">
              <Plus className="h-4 w-4" /> New case
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Open cases", value: kpis.open, icon: Briefcase, tone: "text-primary" },
          { label: "Escalated", value: kpis.escalated, icon: Flag, tone: "text-destructive" },
          { label: "Overdue SLA", value: kpis.overdue, icon: AlertTriangle, tone: "text-warning" },
          { label: "Unresolved issues", value: kpis.unresolved, icon: Wrench, tone: "text-muted-foreground" },
        ].map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <k.icon className={"h-4 w-4 " + k.tone} />
            </div>
            <div className="mt-2 font-display text-3xl tracking-tight">{k.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a case — ID, patient, owner, priority…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Owner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              {CASE_MANAGERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["intake", "assessment", "in-progress", "closed", "escalated"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-3" />
                <th className="px-5 py-3 font-medium">Case</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">SLA</th>
                <th className="px-5 py-3 font-medium">Billing</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No cases match your filters.
                </td></tr>
              )}
              {filtered.map((it) => {
                const sla = Number(it.fields["SLA Days"] ?? 0);
                const days = (Date.now() - new Date(it.createdAt).getTime()) / 86_400_000;
                const overdue = sla > 0 && days > sla && it.status !== "closed";
                const bill = String(it.fields["Bill Status"] ?? "open");
                return (
                  <tr key={it.id} className="hover:bg-muted/30">
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selected.includes(it.id)}
                        onCheckedChange={() => toggleSel(it.id)}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{it.title}</div>
                      <div className="text-xs text-muted-foreground">{it.id} · {it.subtitle}</div>
                    </td>
                    <td className="px-5 py-3">{String(it.fields.Owner ?? "—")}</td>
                    <td className="px-5 py-3">
                      <PriorityChip value={String(it.fields.Priority ?? "Medium")} />
                    </td>
                    <td className="px-5 py-3">
                      {sla > 0 ? (
                        <span className={overdue ? "text-destructive" : "text-muted-foreground"}>
                          {overdue ? "Overdue " : ""}{Math.max(0, Math.round(sla - days))}d left
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={bill === "finalised" ? "default" : "secondary"} className="capitalize">
                        {bill}
                      </Badge>
                    </td>
                    <td className="px-5 py-3"><StatusChip status={it.status} /></td>
                    <td className="px-3 py-3 text-right">
                      <RowActions item={it} onSelect={(k) => openAction(it.id, k)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View / Manage */}
      <Sheet open={(action === "view" || action === "manage") && !!active} onOpenChange={(o) => !o && closeAction()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {active && (
            <CaseDetail
              item={active}
              editable={action === "manage"}
              onSave={(patch) => {
                update("case-management", active.id, {
                  title: patch.title,
                  subtitle: patch.subtitle,
                  fields: { ...active.fields, ...patch.fields },
                });
                addNote("case-management", active.id, "Case details updated");
                toast.success("Case updated");
                closeAction();
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* New / Manage form dialog */}
      <NewCaseDialog
        open={action === "new"}
        onClose={closeAction}
        onSubmit={(v) => {
          const created = create("case-management", {
            title: v.title,
            subtitle: `${v.category} · ${v.patient || "unassigned patient"}`,
            status: "intake",
            fields: {
              Owner: v.owner,
              Priority: v.priority,
              Category: v.category,
              Patient: v.patient,
              "SLA Days": Number(v.sla) || 7,
              "Bill Status": "open",
              "Open Issues": 0,
              Summary: v.summary,
            },
          });
          toast.success("Case opened", { description: created.id });
          closeAction();
        }}
      />

      {/* Assign */}
      <AssignDialog
        open={action === "assign"}
        onClose={closeAction}
        ids={activeId ? [activeId] : selected}
        onSubmit={(owner, note) => {
          const ids = activeId ? [activeId] : selected;
          ids.forEach((id) => {
            const c = items.find((i) => i.id === id);
            if (!c) return;
            update("case-management", id, { fields: { ...c.fields, Owner: owner } });
            addNote("case-management", id, `Assigned to ${owner}. ${note}`);
          });
          toast.success(`Assigned ${ids.length} case${ids.length === 1 ? "" : "s"} to ${owner}`);
          setSelected([]);
          closeAction();
        }}
      />

      {/* Billing checks */}
      {active && (
        <BillingChecksDialog
          open={action === "billing-checks"}
          onClose={closeAction}
          item={active}
          onSubmit={(checks) => {
            const passed = Object.values(checks).filter(Boolean).length;
            update("case-management", active.id, {
              fields: {
                ...active.fields,
                "Billing Checks": `${passed}/${BILLING_CHECK_KEYS.length}`,
                "Checks Updated": new Date().toLocaleString(),
              },
            });
            addNote(
              "case-management", active.id,
              `Billing checks: ${passed}/${BILLING_CHECK_KEYS.length} passed. ${Object.entries(checks).map(([k, v]) => `${k}:${v ? "✓" : "✗"}`).join(", ")}`,
            );
            toast.success(`Billing checks saved (${passed}/${BILLING_CHECK_KEYS.length})`);
            closeAction();
          }}
        />
      )}

      {/* Enquiry */}
      {active && (
        <EnquiryDialog
          open={action === "enquiry"}
          onClose={closeAction}
          item={active}
          onSubmit={(v) => {
            addNote("case-management", active.id, `Enquiry (${v.channel} · ${v.from}): ${v.message}`);
            update("case-management", active.id, {
              fields: {
                ...active.fields,
                "Open Issues": (Number(active.fields["Open Issues"] ?? 0) || 0) + 1,
                "Last Enquiry": new Date().toLocaleString(),
              },
            });
            toast.success("Enquiry logged");
            closeAction();
          }}
        />
      )}

      {/* Escalate */}
      {active && (
        <EscalateDialog
          open={action === "escalate"}
          onClose={closeAction}
          item={active}
          onSubmit={(v) => {
            advance("case-management", active.id, "escalated", `Escalated to National: ${v.reason}`);
            update("case-management", active.id, {
              fields: {
                ...active.fields,
                "Escalated To": v.to,
                "Escalation Reason": v.reason,
                Priority: "Critical",
              },
            });
            toast.success(`Escalated to ${v.to}`);
            closeAction();
          }}
        />
      )}

      {/* Finalise / Unfinal */}
      {active && (
        <ConfirmDialog
          open={action === "finalise"}
          onClose={closeAction}
          title="Finalise bill"
          description={`Mark billing for ${active.id} as finalised. This locks tariff codes and submits to the scheme.`}
          confirmLabel="Finalise bill"
          onConfirm={(note) => {
            update("case-management", active.id, {
              fields: {
                ...active.fields,
                "Bill Status": "finalised",
                "Finalised At": new Date().toLocaleString(),
              },
            });
            addNote("case-management", active.id, `Bill finalised. ${note}`);
            toast.success("Bill finalised");
            closeAction();
          }}
        />
      )}
      {active && (
        <ConfirmDialog
          open={action === "unfinal"}
          onClose={closeAction}
          title="Unfinal bill"
          description={`Reopen the finalised bill for ${active.id}. Requires an audit reason.`}
          confirmLabel="Unfinal bill"
          destructive
          requireReason
          onConfirm={(reason) => {
            if (String(active.fields["Bill Status"]) !== "finalised") {
              toast.error("Bill is not finalised");
              return;
            }
            update("case-management", active.id, {
              fields: {
                ...active.fields,
                "Bill Status": "open",
                "Unfinal Reason": reason,
                "Unfinal At": new Date().toLocaleString(),
              },
            });
            addNote("case-management", active.id, `Bill unfinal-ed: ${reason}`);
            toast.success("Bill reopened");
            closeAction();
          }}
        />
      )}

      {/* Resolve issues */}
      {active && (
        <ResolveIssuesDialog
          open={action === "resolve"}
          onClose={closeAction}
          item={active}
          onSubmit={(count, note) => {
            const remaining = Math.max(0, (Number(active.fields["Open Issues"] ?? 0) || 0) - count);
            update("case-management", active.id, {
              fields: { ...active.fields, "Open Issues": remaining },
            });
            addNote("case-management", active.id, `Resolved ${count} issue(s). ${note}`);
            if (remaining === 0) {
              advance("case-management", active.id, "in-progress", "All open issues resolved");
            }
            toast.success(`Resolved ${count} issue${count === 1 ? "" : "s"}`);
            closeAction();
          }}
        />
      )}

      {/* Roster */}
      <RosterSheet
        open={action === "roster"}
        onClose={closeAction}
        cases={items}
      />

      {/* Case Administration */}
      <AdminDialog open={action === "admin"} onClose={closeAction} />
    </>
  );
}

/* ---------- Row actions ---------- */
function RowActions({ item, onSelect }: { item: WorkflowItem; onSelect: (k: Exclude<Action, null>) => void }) {
  const isClosed = item.status === "closed";
  const finalised = String(item.fields["Bill Status"] ?? "open") === "finalised";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Case</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onSelect("view")}><Eye className="mr-2 h-4 w-4" /> View case</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("manage")}><Briefcase className="mr-2 h-4 w-4" /> Manage case</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("assign")}><UserCog className="mr-2 h-4 w-4" /> Assign case</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("enquiry")}><MessageSquarePlus className="mr-2 h-4 w-4" /> Log enquiry</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("resolve")}><Wrench className="mr-2 h-4 w-4" /> Resolve issues</DropdownMenuItem>
        <DropdownMenuItem disabled={isClosed} onClick={() => onSelect("escalate")}>
          <ArrowUpCircle className="mr-2 h-4 w-4" /> Escalate to National
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Billing</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onSelect("billing-checks")}>
          <ClipboardCheck className="mr-2 h-4 w-4" /> Billing checks
        </DropdownMenuItem>
        <DropdownMenuItem disabled={finalised} onClick={() => onSelect("finalise")}>
          <Receipt className="mr-2 h-4 w-4" /> Finalise bill
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!finalised} onClick={() => onSelect("unfinal")}
          className="text-destructive focus:text-destructive">
          <RotateCcw className="mr-2 h-4 w-4" /> Unfinal bill
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PriorityChip({ value }: { value: string }) {
  const map: Record<string, string> = {
    Low: "bg-muted text-muted-foreground",
    Medium: "bg-primary/15 text-primary",
    High: "bg-warning/20 text-warning",
    Critical: "bg-destructive/20 text-destructive",
  };
  return <span className={"inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium " + (map[value] ?? map.Medium)}>{value}</span>;
}

/* ---------- Detail ---------- */
function CaseDetail({
  item, editable, onSave,
}: {
  item: WorkflowItem;
  editable: boolean;
  onSave: (v: { title: string; subtitle: string; fields: Record<string, string | number> }) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [owner, setOwner] = useState(String(item.fields.Owner ?? CASE_MANAGERS[0]));
  const [priority, setPriority] = useState(String(item.fields.Priority ?? "Medium"));
  const [category, setCategory] = useState(String(item.fields.Category ?? CATEGORIES[0]));
  const [sla, setSla] = useState(String(item.fields["SLA Days"] ?? 7));
  const [summary, setSummary] = useState(String(item.fields.Summary ?? ""));

  return (
    <>
      <SheetHeader className="text-left">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">Case</div>
        <SheetTitle className="font-display text-2xl">{item.title}</SheetTitle>
        <SheetDescription>{item.subtitle}</SheetDescription>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
          <StatusChip status={item.status} />
          <PriorityChip value={String(item.fields.Priority ?? "Medium")} />
        </div>
      </SheetHeader>

      {editable ? (
        <div className="mt-6 grid gap-4">
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Owner"><SelectFrom value={owner} onChange={setOwner} options={CASE_MANAGERS} /></Field>
            <Field label="Priority"><SelectFrom value={priority} onChange={setPriority} options={PRIORITIES} /></Field>
            <Field label="Category"><SelectFrom value={category} onChange={setCategory} options={CATEGORIES} /></Field>
            <Field label="SLA (days)"><Input type="number" value={sla} onChange={(e) => setSla(e.target.value)} /></Field>
          </div>
          <Field label="Summary"><Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
          <Button
            className="bg-gradient-primary hover:opacity-90"
            onClick={() =>
              onSave({
                title,
                subtitle: `${category} · ${String(item.fields.Patient ?? "unassigned patient")}`,
                fields: {
                  Owner: owner, Priority: priority, Category: category,
                  "SLA Days": Number(sla) || 0, Summary: summary,
                },
              })
            }
          >Save changes</Button>
        </div>
      ) : (
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
      )}

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
  open, onClose, title, description, icon: Icon, children, footer, wide,
}: {
  open: boolean; onClose: () => void; title: string; description?: string;
  icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode;
  footer?: React.ReactNode; wide?: boolean;
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function SelectFrom({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function NewCaseDialog({
  open, onClose, onSubmit,
}: {
  open: boolean; onClose: () => void;
  onSubmit: (v: { title: string; owner: string; priority: string; category: string; patient: string; sla: string; summary: string }) => void;
}) {
  const [v, set] = useState({
    title: "", owner: CASE_MANAGERS[0], priority: "Medium", category: CATEGORIES[0],
    patient: "", sla: "7", summary: "",
  });
  const upd = (k: keyof typeof v, val: string) => set((s) => ({ ...s, [k]: val }));
  return (
    <DialogShell open={open} onClose={onClose} title="Open a new case" icon={Plus} wide
      description="Register a new long-running case and route it to a case manager."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (!v.title) return toast.error("Case title is required");
              onSubmit(v);
              set({ title: "", owner: CASE_MANAGERS[0], priority: "Medium", category: CATEGORIES[0], patient: "", sla: "7", summary: "" });
            }}
            className="bg-gradient-primary hover:opacity-90"
          >Open case</Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Case title *"><Input value={v.title} onChange={(e) => upd("title", e.target.value)} placeholder="e.g. Post-op recovery — N. Dlamini" /></Field>
        </div>
        <Field label="Patient"><Input value={v.patient} onChange={(e) => upd("patient", e.target.value)} placeholder="Patient name" /></Field>
        <Field label="Owner"><SelectFrom value={v.owner} onChange={(x) => upd("owner", x)} options={CASE_MANAGERS} /></Field>
        <Field label="Priority"><SelectFrom value={v.priority} onChange={(x) => upd("priority", x)} options={PRIORITIES} /></Field>
        <Field label="Category"><SelectFrom value={v.category} onChange={(x) => upd("category", x)} options={CATEGORIES} /></Field>
        <Field label="SLA (days)"><Input type="number" value={v.sla} onChange={(e) => upd("sla", e.target.value)} /></Field>
        <div className="md:col-span-2">
          <Field label="Summary"><Textarea rows={3} value={v.summary} onChange={(e) => upd("summary", e.target.value)} /></Field>
        </div>
      </div>
    </DialogShell>
  );
}

function AssignDialog({
  open, onClose, ids, onSubmit,
}: {
  open: boolean; onClose: () => void; ids: string[];
  onSubmit: (owner: string, note: string) => void;
}) {
  const [owner, setOwner] = useState(CASE_MANAGERS[0]);
  const [note, setNote] = useState("");
  return (
    <DialogShell open={open} onClose={onClose} title="Assign cases" icon={UserCog}
      description={`Route ${ids.length} case${ids.length === 1 ? "" : "s"} to a case manager.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={ids.length === 0}
            onClick={() => { onSubmit(owner, note); setNote(""); }}
            className="bg-gradient-primary hover:opacity-90"
          >Assign</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Assign to"><SelectFrom value={owner} onChange={setOwner} options={CASE_MANAGERS} /></Field>
        <Field label="Handover note"><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Context, priorities, next actions…" /></Field>
        {ids.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
            {ids.length} case reference{ids.length === 1 ? "" : "s"}: <span className="font-mono">{ids.join(", ")}</span>
          </div>
        )}
      </div>
    </DialogShell>
  );
}

function BillingChecksDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (checks: Record<string, boolean>) => void;
}) {
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(BILLING_CHECK_KEYS.map((k) => [k, false])),
  );
  return (
    <DialogShell open={open} onClose={onClose} title="Manage billing checks" icon={ClipboardCheck}
      description={`Confirm each pre-billing check for case ${item.id}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(checks)} className="bg-gradient-primary hover:opacity-90">Save checks</Button>
        </>
      }
    >
      <ul className="space-y-2">
        {BILLING_CHECK_KEYS.map((k) => (
          <li key={k} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Checkbox
              checked={checks[k]}
              onCheckedChange={(v) => setChecks((s) => ({ ...s, [k]: Boolean(v) }))}
            />
            <span className="text-sm">{k}</span>
          </li>
        ))}
      </ul>
    </DialogShell>
  );
}

function EnquiryDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (v: { from: string; channel: string; message: string }) => void;
}) {
  const [from, setFrom] = useState("");
  const [channel, setChannel] = useState("Phone");
  const [message, setMessage] = useState("");
  return (
    <DialogShell open={open} onClose={onClose} title="Log enquiry" icon={MessageSquarePlus}
      description={`Record an enquiry received on case ${item.id}. Opens a new tracked issue.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (!from || !message) return toast.error("From and message are required");
              onSubmit({ from, channel, message });
              setFrom(""); setMessage("");
            }}
            className="bg-gradient-primary hover:opacity-90"
          >Log enquiry</Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="From *"><Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Caller / requester" /></Field>
        <Field label="Channel"><SelectFrom value={channel} onChange={setChannel} options={["Phone", "Email", "Portal", "WhatsApp", "In-person"]} /></Field>
        <div className="md:col-span-2">
          <Field label="Message *"><Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
        </div>
      </div>
    </DialogShell>
  );
}

function EscalateDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (v: { to: string; reason: string }) => void;
}) {
  const [to, setTo] = useState("National Case Management Office");
  const [reason, setReason] = useState("");
  return (
    <DialogShell open={open} onClose={onClose} title="Escalate to National" icon={ArrowUpCircle}
      description={`Escalate case ${item.id}. This raises priority to Critical and notifies the National office.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!reason) return toast.error("Reason is required");
              onSubmit({ to, reason });
              setReason("");
            }}
          >Escalate</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Escalate to"><SelectFrom value={to} onChange={setTo} options={[
          "National Case Management Office",
          "National Medical Director",
          "Regional Ops Lead",
          "Group Clinical Governance",
        ]} /></Field>
        <Field label="Reason *"><Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for escalation, clinical / financial risk, timeline…" /></Field>
      </div>
    </DialogShell>
  );
}

function ConfirmDialog({
  open, onClose, title, description, confirmLabel, destructive, requireReason, onConfirm,
}: {
  open: boolean; onClose: () => void; title: string; description: string;
  confirmLabel: string; destructive?: boolean; requireReason?: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <DialogShell open={open} onClose={onClose} title={title} description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Back</Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              if (requireReason && !reason) return toast.error("Reason is required");
              onConfirm(reason);
              setReason("");
            }}
          >{confirmLabel}</Button>
        </>
      }
    >
      <Field label={requireReason ? "Reason *" : "Reason / note"}>
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Audit trail entry" />
      </Field>
    </DialogShell>
  );
}

function ResolveIssuesDialog({
  open, onClose, item, onSubmit,
}: {
  open: boolean; onClose: () => void; item: WorkflowItem;
  onSubmit: (count: number, note: string) => void;
}) {
  const openCount = Number(item.fields["Open Issues"] ?? 0) || 0;
  const [count, setCount] = useState<string>("1");
  const [note, setNote] = useState("");
  return (
    <DialogShell open={open} onClose={onClose} title="Resolve issues" icon={Wrench}
      description={`Close open issues on case ${item.id}. ${openCount} currently open.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={openCount === 0}
            onClick={() => {
              const n = Math.min(openCount, Math.max(1, Number(count) || 0));
              onSubmit(n, note);
              setNote("");
            }}
            className="bg-gradient-primary hover:opacity-90"
          >Resolve</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label={`Issues to resolve (max ${openCount})`}>
          <Input type="number" min={1} max={openCount || 1} value={count} onChange={(e) => setCount(e.target.value)} />
        </Field>
        <Field label="Resolution note"><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done, who acted, outcome…" /></Field>
        {openCount === 0 && (
          <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> No open issues on this case.
          </div>
        )}
      </div>
    </DialogShell>
  );
}

function RosterSheet({
  open, onClose, cases,
}: {
  open: boolean; onClose: () => void; cases: WorkflowItem[];
}) {
  const rows = useMemo(() => {
    return CASE_MANAGERS.map((m) => {
      const owned = cases.filter((c) => c.fields.Owner === m);
      const open = owned.filter((c) => !["closed"].includes(c.status)).length;
      const crit = owned.filter((c) => c.fields.Priority === "Critical").length;
      const escalated = owned.filter((c) => c.status === "escalated").length;
      return { name: m, open, crit, escalated, total: owned.length };
    }).sort((a, b) => b.open - a.open);
  }, [cases]);
  const max = Math.max(1, ...rows.map((r) => r.open));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">Roster</div>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Case Manager Roster
          </SheetTitle>
          <SheetDescription>Live case load across the national case management team.</SheetDescription>
        </SheetHeader>
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li key={r.name} className="rounded-xl border border-border bg-card/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.open} open · {r.crit} critical · {r.escalated} escalated · {r.total} lifetime
                  </div>
                </div>
                <Badge variant={r.open > 6 ? "destructive" : "secondary"}>{r.open} active</Badge>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-primary" style={{ width: `${(r.open / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

function AdminDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [defSla, setDefSla] = useState("7");
  const [defOwner, setDefOwner] = useState(CASE_MANAGERS[0]);
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [notify, setNotify] = useState(true);
  return (
    <DialogShell open={open} onClose={onClose} title="Case administration" icon={Settings2} wide
      description="Tenant-wide defaults for the case management workflow."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            onClick={() => { toast.success("Case admin settings saved"); onClose(); }}
            className="bg-gradient-primary hover:opacity-90"
          >Save settings</Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Default SLA (days)"><Input type="number" value={defSla} onChange={(e) => setDefSla(e.target.value)} /></Field>
        <Field label="Default owner"><SelectFrom value={defOwner} onChange={setDefOwner} options={CASE_MANAGERS} /></Field>
        <div className="md:col-span-2 grid gap-3 rounded-xl border border-border bg-muted/20 p-4">
          <label className="flex items-center gap-3 text-sm">
            <Checkbox checked={autoEscalate} onCheckedChange={(v) => setAutoEscalate(Boolean(v))} />
            Auto-escalate cases past SLA to National office
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(Boolean(v))} />
            Notify case owner on new enquiry
          </label>
        </div>
        <div className="md:col-span-2">
          <Field label="Case categories">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
            </div>
          </Field>
        </div>
      </div>
    </DialogShell>
  );
}
