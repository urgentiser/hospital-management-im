import { createFileRoute, Link, useParams, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, User, Phone, Mail, IdCard, Building2 } from "lucide-react";
import { PageHeader, StatusChip, Card } from "@/components/app-shell";
import { NotFoundState } from "@/components/states";
import { findPatient } from "@/lib/mock/patients";
import { MOCK_ADMISSIONS } from "@/lib/mock/admissions";
import { MOCK_MEDICAL_EVENTS } from "@/lib/mock/medical-events";
import { MOCK_DOCUMENTS } from "@/lib/mock/documents";
import { MOCK_TASKS } from "@/lib/mock/tasks";
import { formatSADate, formatSADateTime, formatRelative } from "@/rules/formatting";
import { useState } from "react";

export const Route = createFileRoute("/_app/patients/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Patient ${params.id} — Impilo` },
      { name: "description", content: "Patient banner, demographics, admissions, medical events, documents and audit." },
    ],
  }),
  component: PatientDetail,
});

type Tab = "demographics" | "admissions" | "medical-events" | "documents" | "tasks" | "audit";

function PatientDetail() {
  const { id } = useParams({ from: "/_app/patients/$id" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [tab, setTab] = useState<Tab>("demographics");
  const patient = findPatient(id);

  if (!patient) {
    return (
      <>
        <PageHeader title="Patient" eyebrow="Clinical" />
        <NotFoundState title="Patient not found" description={`No record for ${id}.`} action={<Link to="/patients" className="mt-3 inline-flex rounded-lg border border-border px-3 py-1.5 text-xs">Back to patients</Link>} />
      </>
    );
  }

  const admissions = MOCK_ADMISSIONS.filter((a) => a.patientId === patient.id);
  const events = MOCK_MEDICAL_EVENTS.filter((e) => e.patientId === patient.id);
  const docs = MOCK_DOCUMENTS.filter((d) => d.patientId === patient.id);
  const tasks = MOCK_TASKS.filter((t) => t.patient === patient.id);

  return (
    <>
      <div className="mb-4">
        <Link to="/patients" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All patients
        </Link>
      </div>

      {/* Persistent patient banner */}
      <div className="mb-6 rounded-2xl border border-border bg-gradient-surface p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <User className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl tracking-tight">{patient.fullName}</h1>
                <StatusChip status={patient.status} />
                {patient.alerts.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                    <AlertTriangle className="h-3 w-3" /> {a}
                  </span>
                ))}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {patient.mrn} · {patient.id} · {patient.gender} · {formatSADate(patient.dob)} ({patient.age} yrs)
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {patient.scheme} · Member {patient.membership} · {patient.practitioner} · {patient.facility}
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>Last updated {formatRelative(patient.updatedAt)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav className="mb-4 -mx-1 flex items-center gap-1 overflow-x-auto pb-2">
        {([
          ["demographics", "Demographics"],
          ["admissions", `Admissions (${admissions.length})`],
          ["medical-events", `Medical events (${events.length})`],
          ["documents", `Documents (${docs.length})`],
          ["tasks", `Tasks (${tasks.length})`],
          ["audit", "Audit"],
        ] as Array<[Tab, string]>).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={"shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors " + (tab === key ? "border-primary/40 bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground")}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "demographics" && <Demographics patient={patient} />}
      {tab === "admissions" && (
        <Card className="p-4">
          {admissions.length === 0 ? <div className="text-sm text-muted-foreground">No admissions on record.</div> : (
            <ul className="divide-y divide-border">
              {admissions.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{a.id} · {a.admissionType}</div>
                    <div className="text-xs text-muted-foreground">{a.diagnosis} · {a.ward} · Bed {a.bed}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatSADateTime(a.admittedAt)}</span>
                    <StatusChip status={a.state} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      {tab === "medical-events" && (
        <Card className="p-4">
          <ol className="relative space-y-4 border-l border-border pl-4">
            {events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="text-sm font-medium">{e.type}: {e.summary}</div>
                <div className="text-xs text-muted-foreground">{e.clinician} · {formatSADateTime(e.at)}</div>
              </li>
            ))}
            {events.length === 0 && <div className="text-sm text-muted-foreground">No events on record.</div>}
          </ol>
        </Card>
      )}
      {tab === "documents" && (
        <Card className="p-4">
          {docs.length === 0 ? <div className="text-sm text-muted-foreground">No documents.</div> : (
            <ul className="divide-y divide-border">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{d.fileName}</div>
                    <div className="text-xs text-muted-foreground">{d.category} · {(d.sizeBytes / 1024).toFixed(0)} KB</div>
                  </div>
                  <StatusChip status={d.state} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      {tab === "tasks" && (
        <Card className="p-4">
          {tasks.length === 0 ? <div className="text-sm text-muted-foreground">No tasks.</div> : (
            <ul className="divide-y divide-border">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{t.module} · due {formatSADateTime(t.dueAt)}</div>
                  </div>
                  <StatusChip status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      {tab === "audit" && (
        <Card className="p-4">
          <ol className="relative space-y-4 border-l border-border pl-4 text-sm">
            <TimelineEntry action="Patient viewed" by="Dr. K. Naidoo" at={new Date().toISOString()} />
            <TimelineEntry action="Address updated" by="Reception" at={patient.updatedAt} />
            <TimelineEntry action="Patient registered" by="System" at={patient.createdAt} />
          </ol>
        </Card>
      )}

      {/* Preserve current path in a hidden marker for tests */}
      <div className="sr-only" data-current-path={pathname} />
    </>
  );
}

function TimelineEntry({ action, by, at, note }: { action: string; by: string; at: string; note?: string }) {
  return (
    <li className="relative">
      <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
      <div className="font-medium">{action}</div>
      <div className="text-xs text-muted-foreground">{by} · {formatSADateTime(at)}{note ? ` — ${note}` : ""}</div>
    </li>
  );
}

function Demographics({ patient }: { patient: ReturnType<typeof findPatient> & object }) {
  const p = patient!;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</div>
        <dl className="space-y-2 text-sm">
          <Row icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={p.phone} />
          <Row icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={p.email} />
          <Row icon={<Building2 className="h-3.5 w-3.5" />} label="Address" value={p.address} />
        </dl>
      </Card>
      <Card className="p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Identity & scheme</div>
        <dl className="space-y-2 text-sm">
          <Row icon={<IdCard className="h-3.5 w-3.5" />} label="ID / Passport" value={p.idNumber} />
          <Row icon={<User className="h-3.5 w-3.5" />} label="Sex" value={p.gender} />
          <Row icon={<Building2 className="h-3.5 w-3.5" />} label="Facility" value={p.facility} />
          <Row icon={<IdCard className="h-3.5 w-3.5" />} label="Membership" value={`${p.scheme} · ${p.membership}`} />
        </dl>
      </Card>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}
