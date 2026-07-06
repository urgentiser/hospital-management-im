import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardList,
  Plus,
  Search,
  Eye,
  Ban,
  Stethoscope,
  FileSearch,
  UserPlus,
  MoreHorizontal,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/_app/preadmissions")({
  head: () => ({ meta: [{ title: "Pre-admissions — Impilo" }] }),
  component: PreadmissionsPage,
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

const SCHEMES = ["Discovery Health", "Momentum", "Bonitas", "GEMS", "Polmed", "Bank Of Botswana", "Private"];
const VISIT_TYPES = ["In Patient", "Day Case", "Out Patient"];
const FUNDING_TYPES = ["Medical Aid", "Private", "COID", "IOD", "Government"];

type Assessment = {
  at: string;
  clinician: string;
  vitals: { bp: string; pulse: string; temp: string; spo2: string };
  allergies: string;
  medications: string;
  notes: string;
  risk: "low" | "medium" | "high";
};

type Preadmission = {
  id: string;
  patient: string;
  lifeNumber: string;
  dob: string;
  gender: string;
  facility: string;
  scheme: string;
  plan: string;
  membershipNumber: string;
  authorisationNumber: string;
  authorisationStatus: "Approved" | "Pending" | "Declined";
  copayment: number;
  fundingType: string;
  visitType: string;
  expectedDate: string;
  expectedTime: string;
  procedure: string;
  practitioner: string;
  status: "draft" | "verified" | "assessed" | "ready" | "cancelled";
  createdAt: string;
  updatedAt: string;
  assessments: Assessment[];
  history: { at: string; action: string; by: string; note?: string }[];
};

const STORAGE_KEY = "impilo-preadmissions-v1";
const now = () => new Date().toISOString();
const fmt = (iso: string) => new Date(iso).toLocaleString();
const uid = () => "PA-" + Math.floor(1_000_000 + Math.random() * 9_000_000);

function seed(): Preadmission[] {
  const base: Omit<Preadmission, "assessments" | "history">[] = [
    {
      id: "PA-7086684",
      patient: "Mr GOPOLANG, MAKOKWE",
      lifeNumber: "5462587",
      dob: "1982-06-12",
      gender: "Male",
      facility: "Life Fourways",
      scheme: "Bank Of Botswana",
      plan: "Bank Of Botswana",
      membershipNumber: "998877",
      authorisationNumber: "668877",
      authorisationStatus: "Approved",
      copayment: 1200,
      fundingType: "Medical Aid",
      visitType: "In Patient",
      expectedDate: "2026-07-14",
      expectedTime: "06:00",
      procedure: "Laparoscopic Cholecystectomy",
      practitioner: "Dr. S. Naidoo",
      status: "verified",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "PA-7086701",
      patient: "Ms DLAMINI, NOMVULA",
      lifeNumber: "6612334",
      dob: "1990-11-03",
      gender: "Female",
      facility: "Life Kingsbury",
      scheme: "Discovery Health",
      plan: "Classic Comprehensive",
      membershipNumber: "445120",
      authorisationNumber: "AUTH-40921",
      authorisationStatus: "Approved",
      copayment: 0,
      fundingType: "Medical Aid",
      visitType: "Day Case",
      expectedDate: "2026-07-12",
      expectedTime: "08:30",
      procedure: "Elective C-Section",
      practitioner: "Dr. R. Botha",
      status: "assessed",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "PA-7086715",
      patient: "Mr MOKOENA, THABO",
      lifeNumber: "7712001",
      dob: "1975-02-21",
      gender: "Male",
      facility: "Life Groenkloof",
      scheme: "GEMS",
      plan: "Ruby",
      membershipNumber: "778812",
      authorisationNumber: "",
      authorisationStatus: "Pending",
      copayment: 2500,
      fundingType: "Medical Aid",
      visitType: "In Patient",
      expectedDate: "2026-07-15",
      expectedTime: "07:00",
      procedure: "Coronary Angiogram",
      practitioner: "Dr. M. Khumalo",
      status: "draft",
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  return base.map((b) => ({
    ...b,
    assessments: [],
    history: [{ at: fmt(now()), action: "Pre-admission created", by: "System" }],
  }));
}

function load(): Preadmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Preadmission[];
    return Array.isArray(parsed) && parsed.length ? parsed : seed();
  } catch {
    return seed();
  }
}
function save(rows: Preadmission[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {}
}

function PreadmissionsPage() {
  const [rows, setRows] = useState<Preadmission[]>(() => load());
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [facilityFilter, setFacilityFilter] = useState<string>("all");

  const [openNew, setOpenNew] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [openView, setOpenView] = useState<string | null>(null);
  const [openAssess, setOpenAssess] = useState<string | null>(null);
  const [openViewAssess, setOpenViewAssess] = useState<string | null>(null);
  const [openCancel, setOpenCancel] = useState<string | null>(null);

  useEffect(() => save(rows), [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (facilityFilter !== "all" && r.facility !== facilityFilter) return false;
      if (!query) return true;
      return (
        r.id.toLowerCase().includes(query) ||
        r.patient.toLowerCase().includes(query) ||
        r.lifeNumber.includes(query) ||
        r.membershipNumber.toLowerCase().includes(query) ||
        r.authorisationNumber.toLowerCase().includes(query) ||
        r.procedure.toLowerCase().includes(query)
      );
    });
  }, [rows, q, statusFilter, facilityFilter]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "draft" || r.status === "verified").length;
    const assessed = rows.filter((r) => r.status === "assessed" || r.status === "ready").length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = rows.filter((r) => r.expectedDate === today && r.status !== "cancelled").length;
    return { total, pending, assessed, cancelled, todayCount };
  }, [rows]);

  const update = (id: string, patch: Partial<Preadmission>, action?: string, note?: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...patch,
              updatedAt: now(),
              history: action ? [{ at: fmt(now()), action, by: "You", note }, ...r.history] : r.history,
            }
          : r,
      ),
    );
  };

  const viewing = openView ? rows.find((r) => r.id === openView) ?? null : null;
  const assessing = openAssess ? rows.find((r) => r.id === openAssess) ?? null : null;
  const viewingAssess = openViewAssess ? rows.find((r) => r.id === openViewAssess) ?? null : null;
  const cancelling = openCancel ? rows.find((r) => r.id === openCancel) ?? null : null;

  return (
    <>
      <PageHeader
        eyebrow="Front Office"
        title="Pre-admissions"
        description="Preadmit patients ahead of arrival, verify scheme cover, complete clinical pre-assessments and hand-over to Admissions."
        actions={
          <>
            <Button variant="outline" onClick={() => setOpenSearch(true)}>
              <FileSearch className="h-4 w-4" /> Preadmission Search
            </Button>
            <Button onClick={() => setOpenNew(true)}>
              <Plus className="h-4 w-4" /> Preadmit Patient
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Total pre-admissions" value={kpis.total} icon={<ClipboardList className="h-4 w-4" />} />
        <Kpi label="Expected today" value={kpis.todayCount} icon={<CheckCircle2 className="h-4 w-4" />} tone="info" />
        <Kpi label="Awaiting assessment" value={kpis.pending} icon={<Stethoscope className="h-4 w-4" />} tone="warning" />
        <Kpi label="Assessed" value={kpis.assessed} icon={<ClipboardCheck className="h-4 w-4" />} tone="success" />
        <Kpi label="Cancelled" value={kpis.cancelled} icon={<Ban className="h-4 w-4" />} tone="muted" />
      </div>

      <Card className="p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID, patient, Life No, membership, authorisation…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="assessed">Assessed</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={facilityFilter} onValueChange={setFacilityFilter}>
            <SelectTrigger className="sm:w-52"><SelectValue placeholder="Facility" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All facilities</SelectItem>
              {FACILITIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Preadmission #</th>
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2">Facility</th>
                <th className="px-3 py-2">Expected</th>
                <th className="px-3 py-2">Scheme</th>
                <th className="px-3 py-2">Auth</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/60 hover:bg-muted/40">
                  <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.patient}</div>
                    <div className="text-xs text-muted-foreground">Life {r.lifeNumber} · {r.gender} · {r.dob}</div>
                  </td>
                  <td className="px-3 py-2">{r.facility}</td>
                  <td className="px-3 py-2">
                    <div>{r.expectedDate}</div>
                    <div className="text-xs text-muted-foreground">{r.expectedTime} · {r.visitType}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{r.scheme}</div>
                    <div className="text-xs text-muted-foreground">{r.plan}</div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={r.authorisationStatus === "Approved" ? "default" : r.authorisationStatus === "Pending" ? "secondary" : "destructive"}>
                      {r.authorisationStatus}
                    </Badge>
                    {r.authorisationNumber && <div className="mt-1 font-mono text-[11px] text-muted-foreground">{r.authorisationNumber}</div>}
                  </td>
                  <td className="px-3 py-2"><StatusChip status={r.status} /></td>
                  <td className="px-3 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setOpenView(r.id)}>
                          <Eye className="h-4 w-4" /> View Preadmission
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenAssess(r.id)} disabled={r.status === "cancelled"}>
                          <Stethoscope className="h-4 w-4" /> Assess Patient
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenViewAssess(r.id)} disabled={r.assessments.length === 0}>
                          <ClipboardCheck className="h-4 w-4" /> View Assessment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            update(r.id, { status: "ready" }, "Marked ready for admission");
                            toast.success("Handed over to Admissions", { description: r.patient });
                          }}
                          disabled={r.status === "cancelled" || r.status === "ready"}
                        >
                          <UserPlus className="h-4 w-4" /> Send to Admissions
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setOpenCancel(r.id)}
                          disabled={r.status === "cancelled"}
                        >
                          <Ban className="h-4 w-4" /> Cancel Preadmission
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">No pre-admissions match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Preadmit Patient */}
      <NewPreadmissionDialog
        open={openNew}
        onOpenChange={setOpenNew}
        onCreate={(pa) => {
          setRows((prev) => [pa, ...prev]);
          toast.success("Pre-admission created", { description: `${pa.id} · ${pa.patient}` });
        }}
      />

      {/* Preadmission Search */}
      <SearchDialog
        open={openSearch}
        onOpenChange={setOpenSearch}
        rows={rows}
        onOpen={(id) => { setOpenSearch(false); setOpenView(id); }}
      />

      {/* View Preadmission */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setOpenView(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {viewing && (
            <>
              <SheetHeader>
                <SheetTitle>Preadmission {viewing.id}</SheetTitle>
                <SheetDescription>{viewing.patient} · {viewing.facility}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <Section title="Patient Details">
                  <KV k="Patient" v={viewing.patient} />
                  <KV k="Life Number" v={viewing.lifeNumber} />
                  <KV k="Date of Birth" v={viewing.dob} />
                  <KV k="Gender" v={viewing.gender} />
                </Section>
                <Section title="Preadmission Details">
                  <KV k="Preadmission #" v={viewing.id} />
                  <KV k="Expected" v={`${viewing.expectedDate} ${viewing.expectedTime}`} />
                  <KV k="Facility" v={viewing.facility} />
                  <KV k="Visit Type" v={viewing.visitType} />
                  <KV k="Funding" v={viewing.fundingType} />
                  <KV k="Procedure" v={viewing.procedure} />
                  <KV k="Practitioner" v={viewing.practitioner} />
                </Section>
                <Section title="Scheme">
                  <KV k="Scheme" v={viewing.scheme} />
                  <KV k="Plan" v={viewing.plan} />
                  <KV k="Membership" v={viewing.membershipNumber} />
                  <KV k="Authorisation" v={viewing.authorisationNumber || "—"} />
                  <KV k="Auth Status" v={viewing.authorisationStatus} />
                  <KV k="Copayment" v={`R ${viewing.copayment.toLocaleString()}`} />
                </Section>
                <Section title="Status">
                  <div className="flex items-center gap-2"><StatusChip status={viewing.status} /></div>
                </Section>
                <Section title="History">
                  <ul className="space-y-2 text-sm">
                    {viewing.history.map((h, i) => (
                      <li key={i} className="rounded-md border border-border bg-card/60 p-2">
                        <div className="text-xs text-muted-foreground">{h.at} · {h.by}</div>
                        <div>{h.action}{h.note ? ` — ${h.note}` : ""}</div>
                      </li>
                    ))}
                  </ul>
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Assess Patient */}
      <AssessDialog
        open={!!assessing}
        onOpenChange={(o) => !o && setOpenAssess(null)}
        pa={assessing}
        onSave={(id, a) => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status: "assessed",
                    updatedAt: now(),
                    assessments: [a, ...r.assessments],
                    history: [{ at: fmt(now()), action: "Assessment recorded", by: a.clinician, note: `Risk: ${a.risk}` }, ...r.history],
                  }
                : r,
            ),
          );
          toast.success("Assessment saved");
        }}
      />

      {/* View Assessment */}
      <Sheet open={!!viewingAssess} onOpenChange={(o) => !o && setOpenViewAssess(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {viewingAssess && (
            <>
              <SheetHeader>
                <SheetTitle>Assessments — {viewingAssess.patient}</SheetTitle>
                <SheetDescription>{viewingAssess.assessments.length} on record</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                {viewingAssess.assessments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No assessments yet.</p>
                )}
                {viewingAssess.assessments.map((a, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card/60 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{fmt(a.at)} · {a.clinician}</div>
                      <Badge variant={a.risk === "high" ? "destructive" : a.risk === "medium" ? "secondary" : "default"}>
                        {a.risk} risk
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <KV k="BP" v={a.vitals.bp} />
                      <KV k="Pulse" v={a.vitals.pulse} />
                      <KV k="Temp" v={a.vitals.temp} />
                      <KV k="SpO₂" v={a.vitals.spo2} />
                    </div>
                    {a.allergies && <div className="mt-2 text-sm"><b>Allergies:</b> {a.allergies}</div>}
                    {a.medications && <div className="text-sm"><b>Meds:</b> {a.medications}</div>}
                    {a.notes && <div className="mt-1 text-sm text-muted-foreground">{a.notes}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Preadmission */}
      <Dialog open={!!cancelling} onOpenChange={(o) => !o && setOpenCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel preadmission</DialogTitle>
            <DialogDescription>
              This will mark {cancelling?.id} as cancelled and notify the ward. Provide a reason for the audit trail.
            </DialogDescription>
          </DialogHeader>
          <CancelForm
            onConfirm={(reason) => {
              if (cancelling) {
                update(cancelling.id, { status: "cancelled" }, "Preadmission cancelled", reason);
                toast.success("Preadmission cancelled", { description: cancelling.id });
              }
              setOpenCancel(null);
            }}
            onDismiss={() => setOpenCancel(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function Kpi({ label, value, icon, tone = "default" }: { label: string; value: number; icon: React.ReactNode; tone?: "default" | "info" | "warning" | "success" | "muted" }) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    info: "text-info",
    warning: "text-warning",
    success: "text-success",
    muted: "text-muted-foreground",
  };
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={tones[tone]}>{icon}</span>
      </div>
      <div className={"mt-1 font-display text-2xl " + tones[tone]}>{value}</div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      <div className="rounded-lg border border-border bg-card/60 p-3 text-sm">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">{children}</div>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/40 py-1 last:border-0 sm:block sm:border-0">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-sm font-medium">{v}</span>
    </div>
  );
}

function CancelForm({ onConfirm, onDismiss }: { onConfirm: (reason: string) => void; onDismiss: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <>
      <div className="space-y-2">
        <Label>Reason</Label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Patient postponed procedure" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDismiss}>Back</Button>
        <Button variant="destructive" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>
          Cancel Preadmission
        </Button>
      </DialogFooter>
    </>
  );
}

function NewPreadmissionDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (pa: Preadmission) => void }) {
  const [patient, setPatient] = useState("");
  const [lifeNumber, setLifeNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [facility, setFacility] = useState(FACILITIES[0]);
  const [scheme, setScheme] = useState(SCHEMES[0]);
  const [plan, setPlan] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [authorisationNumber, setAuthorisationNumber] = useState("");
  const [authorisationStatus, setAuthorisationStatus] = useState<"Approved" | "Pending" | "Declined">("Pending");
  const [copayment, setCopayment] = useState("0");
  const [fundingType, setFundingType] = useState(FUNDING_TYPES[0]);
  const [visitType, setVisitType] = useState(VISIT_TYPES[0]);
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedTime, setExpectedTime] = useState("08:00");
  const [procedure, setProcedure] = useState("");
  const [practitioner, setPractitioner] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const reset = () => {
    setPatient(""); setLifeNumber(""); setDob(""); setGender("Male");
    setFacility(FACILITIES[0]); setScheme(SCHEMES[0]); setPlan(""); setMembershipNumber("");
    setAuthorisationNumber(""); setAuthorisationStatus("Pending"); setCopayment("0");
    setFundingType(FUNDING_TYPES[0]); setVisitType(VISIT_TYPES[0]);
    setExpectedDate(new Date().toISOString().slice(0, 10)); setExpectedTime("08:00");
    setProcedure(""); setPractitioner(""); setConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preadmit Patient</DialogTitle>
          <DialogDescription>Capture pre-admission details, verify scheme cover and generate a preadmission number.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Patient name"><Input value={patient} onChange={(e) => setPatient(e.target.value)} placeholder="Mr GOPOLANG, MAKOKWE" /></Field>
          <Field label="Life number"><Input value={lifeNumber} onChange={(e) => setLifeNumber(e.target.value)} placeholder="5462587" /></Field>
          <Field label="Date of birth"><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
          <Field label="Gender">
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Facility">
            <Select value={facility} onValueChange={setFacility}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FACILITIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Visit type">
            <Select value={visitType} onValueChange={setVisitType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VISIT_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Expected date"><Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} /></Field>
          <Field label="Expected time"><Input type="time" value={expectedTime} onChange={(e) => setExpectedTime(e.target.value)} /></Field>
          <Field label="Procedure"><Input value={procedure} onChange={(e) => setProcedure(e.target.value)} placeholder="e.g. Laparoscopic Cholecystectomy" /></Field>
          <Field label="Practitioner"><Input value={practitioner} onChange={(e) => setPractitioner(e.target.value)} placeholder="Dr. S. Naidoo" /></Field>
          <Field label="Funding type">
            <Select value={fundingType} onValueChange={setFundingType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FUNDING_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Scheme">
            <Select value={scheme} onValueChange={setScheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SCHEMES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Plan"><Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="e.g. Classic Comprehensive" /></Field>
          <Field label="Membership #"><Input value={membershipNumber} onChange={(e) => setMembershipNumber(e.target.value)} /></Field>
          <Field label="Authorisation #"><Input value={authorisationNumber} onChange={(e) => setAuthorisationNumber(e.target.value)} /></Field>
          <Field label="Authorisation status">
            <Select value={authorisationStatus} onValueChange={(v) => setAuthorisationStatus(v as "Approved" | "Pending" | "Declined")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Copayment (R)"><Input type="number" value={copayment} onChange={(e) => setCopayment(e.target.value)} /></Field>
        </div>

        <label className="mt-3 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <input type="checkbox" className="mt-0.5" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          <span>As the Admission Clerk, I confirm that I have checked and verified the correctness of the patient and guarantor's personal, demographic and medical aid details on Impilo.</span>
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Back</Button>
          <Button
            disabled={!patient.trim() || !lifeNumber.trim() || !confirmed}
            onClick={() => {
              const pa: Preadmission = {
                id: uid(),
                patient: patient.trim(),
                lifeNumber: lifeNumber.trim(),
                dob, gender, facility, scheme, plan,
                membershipNumber: membershipNumber.trim(),
                authorisationNumber: authorisationNumber.trim(),
                authorisationStatus,
                copayment: Number(copayment) || 0,
                fundingType, visitType, expectedDate, expectedTime,
                procedure: procedure.trim(), practitioner: practitioner.trim(),
                status: authorisationStatus === "Approved" ? "verified" : "draft",
                createdAt: now(), updatedAt: now(),
                assessments: [],
                history: [{ at: fmt(now()), action: "Preadmission created", by: "Admission Clerk" }],
              };
              onCreate(pa);
              onOpenChange(false);
              reset();
            }}
          >Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function SearchDialog({ open, onOpenChange, rows, onOpen }: { open: boolean; onOpenChange: (o: boolean) => void; rows: Preadmission[]; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows.slice(0, 8);
    return rows.filter((r) =>
      r.id.toLowerCase().includes(query) ||
      r.patient.toLowerCase().includes(query) ||
      r.lifeNumber.includes(query) ||
      r.membershipNumber.toLowerCase().includes(query) ||
      r.authorisationNumber.toLowerCase().includes(query),
    ).slice(0, 20);
  }, [q, rows]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Preadmission Search</DialogTitle>
          <DialogDescription>Find by preadmission #, patient, Life number, membership or authorisation.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>
        <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-border">
          {results.length === 0 && <div className="p-4 text-sm text-muted-foreground">No matches.</div>}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpen(r.id)}
              className="flex w-full items-center justify-between gap-3 border-b border-border/50 px-3 py-2 text-left text-sm last:border-0 hover:bg-muted/60"
            >
              <div>
                <div className="font-medium">{r.patient}</div>
                <div className="text-xs text-muted-foreground">{r.id} · {r.facility} · {r.expectedDate}</div>
              </div>
              <StatusChip status={r.status} />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssessDialog({ open, onOpenChange, pa, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; pa: Preadmission | null; onSave: (id: string, a: Assessment) => void }) {
  const [clinician, setClinician] = useState("Nurse J. Adams");
  const [bp, setBp] = useState("120/80");
  const [pulse, setPulse] = useState("76");
  const [temp, setTemp] = useState("36.7");
  const [spo2, setSpo2] = useState("98");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [notes, setNotes] = useState("");
  const [risk, setRisk] = useState<"low" | "medium" | "high">("low");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assess Patient</DialogTitle>
          <DialogDescription>{pa?.patient} · {pa?.id}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Clinician"><Input value={clinician} onChange={(e) => setClinician(e.target.value)} /></Field>
          <Field label="Risk band">
            <Select value={risk} onValueChange={(v) => setRisk(v as "low" | "medium" | "high")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Blood pressure"><Input value={bp} onChange={(e) => setBp(e.target.value)} /></Field>
          <Field label="Pulse (bpm)"><Input value={pulse} onChange={(e) => setPulse(e.target.value)} /></Field>
          <Field label="Temperature (°C)"><Input value={temp} onChange={(e) => setTemp(e.target.value)} /></Field>
          <Field label="SpO₂ (%)"><Input value={spo2} onChange={(e) => setSpo2(e.target.value)} /></Field>
        </div>
        <div className="mt-3 space-y-3">
          <Field label="Allergies"><Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin" /></Field>
          <Field label="Current medications"><Input value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="e.g. Metformin 500mg BD" /></Field>
          <Field label="Clinical notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Pre-op assessment findings…" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!pa || !clinician.trim()}
            onClick={() => {
              if (!pa) return;
              onSave(pa.id, {
                at: now(),
                clinician: clinician.trim(),
                vitals: { bp, pulse, temp, spo2 },
                allergies: allergies.trim(),
                medications: medications.trim(),
                notes: notes.trim(),
                risk,
              });
              onOpenChange(false);
            }}
          >Save assessment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
