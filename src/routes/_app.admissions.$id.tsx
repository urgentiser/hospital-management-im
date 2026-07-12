import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, BedDouble, ArrowRightLeft, LogOut, XCircle, LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatusChip, Card } from "@/components/app-shell";
import { NotFoundState } from "@/components/states";
import { PermissionGate } from "@/components/permission-gate";
import { MOCK_ADMISSIONS } from "@/lib/mock/admissions";
import { formatSADateTime } from "@/rules/formatting";
import { useState } from "react";

export const Route = createFileRoute("/_app/admissions/$id")({
  head: ({ params }) => ({ meta: [{ title: `Admission ${params.id} — Impilo` }] }),
  component: AdmissionDetail,
});

function AdmissionDetail() {
  const { id } = useParams({ from: "/_app/admissions/$id" });
  const navigate = useNavigate();
  const admission = MOCK_ADMISSIONS.find((a) => a.id === id);
  const [confirm, setConfirm] = useState<null | { title: string; body: string; onConfirm: () => void }>(null);

  if (!admission) {
    return (
      <>
        <PageHeader title="Admission" />
        <NotFoundState title="Admission not found" description={`No record for ${id}.`} />
      </>
    );
  }

  const doAction = (action: string) => {
    toast.success(`${action} completed`, { description: `Admission ${id} — ${action.toLowerCase()}.` });
    setConfirm(null);
  };

  return (
    <>
      <div className="mb-4">
        <Link to="/admissions" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to admissions
        </Link>
      </div>

      <PageHeader
        eyebrow={`Admission · ${admission.state}`}
        title={`${admission.patientName} — ${admission.id}`}
        description={`${admission.diagnosis} · ${admission.facility} · ${admission.ward} · Bed ${admission.bed}`}
        actions={<StatusChip status={admission.state} />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 md:col-span-2">
          <div className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Details</div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Type" value={admission.admissionType} />
            <Info label="Practitioner" value={admission.practitioner} />
            <Info label="Scheme" value={admission.scheme} />
            <Info label="Authorisation" value={admission.authorisation ?? "—"} />
            <Info label="Admitted at" value={formatSADateTime(admission.admittedAt)} />
            <Info label="Length of stay" value={`${admission.los} day${admission.los === 1 ? "" : "s"}`} />
          </dl>
          {admission.notes && (
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-xs">{admission.notes}</div>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</div>
          <div className="flex flex-col gap-2">
            <PermissionGate permission="admissions:allocate-bed">
              <button onClick={() => doAction("Allocate bed")} className="btn"><BedDouble className="h-3.5 w-3.5" /> Allocate bed</button>
            </PermissionGate>
            <PermissionGate permission="admissions:transfer">
              <button onClick={() => setConfirm({ title: "Transfer patient?", body: "Move the patient to a different ward/facility. This is auditable.", onConfirm: () => doAction("Transfer") })} className="btn"><ArrowRightLeft className="h-3.5 w-3.5" /> Transfer</button>
            </PermissionGate>
            <PermissionGate permission="admissions:link-auth">
              <button onClick={() => doAction("Linked authorisation")} className="btn"><LinkIcon className="h-3.5 w-3.5" /> Link authorisation</button>
            </PermissionGate>
            <PermissionGate permission="admissions:discharge">
              <button onClick={() => setConfirm({ title: "Discharge patient?", body: "Discharging will finalise LOS and route the file to billing.", onConfirm: () => { doAction("Discharge"); setTimeout(() => navigate({ to: "/admissions" }), 400); } })} className="btn"><LogOut className="h-3.5 w-3.5" /> Discharge</button>
            </PermissionGate>
            <PermissionGate permission="admissions:cancel">
              <button onClick={() => setConfirm({ title: "Cancel admission?", body: "Cancellation cannot be undone once billing has processed.", onConfirm: () => doAction("Cancel") })} className="btn text-destructive"><XCircle className="h-3.5 w-3.5" /> Cancel admission</button>
            </PermissionGate>
          </div>
          <style>{`.btn{display:inline-flex;align-items:center;gap:0.5rem;justify-content:flex-start;border-radius:0.5rem;border:1px solid hsl(var(--border));background:hsl(var(--background)/0.6);padding:0.5rem 0.75rem;font-size:0.75rem;}
          .btn:hover{background:hsl(var(--muted)/0.5);}`}</style>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Event timeline</div>
        <ol className="relative space-y-4 border-l border-border pl-4 text-sm">
          <Event action={`Admission ${admission.state}`} by="System" at={admission.admittedAt} />
          {admission.authorisation && <Event action={`Authorisation linked (${admission.authorisation})`} by="Reception" at={admission.admittedAt} />}
          <Event action="Bed allocated" by={admission.practitioner} at={admission.admittedAt} />
          <Event action="Admission created" by="Reception" at={admission.admittedAt} />
        </ol>
      </Card>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirm(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg">
            <h3 className="text-lg font-semibold">{confirm.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{confirm.body}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Cancel</button>
              <button onClick={confirm.onConfirm} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function Event({ action, by, at }: { action: string; by: string; at: string }) {
  return (
    <li className="relative">
      <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
      <div className="font-medium">{action}</div>
      <div className="text-xs text-muted-foreground">{by} · {formatSADateTime(at)}</div>
    </li>
  );
}
