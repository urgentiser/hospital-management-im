import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, BedDouble, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Card } from "@/components/app-shell";
import { PermissionGate } from "@/components/permission-gate";
import { admissionSchema } from "@/rules/schemas";
import { MOCK_PATIENTS } from "@/lib/mock/patients";

export const Route = createFileRoute("/_app/admissions/new")({
  head: () => ({ meta: [{ title: "New admission — Impilo" }] }),
  component: NewAdmission,
});

const DRAFT_KEY = "impilo.admissions.draft.v1";

function NewAdmission() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
    return {
      patientId: "", admissionType: "Elective", facility: "Life Fourways",
      ward: "", bed: "", practitioner: "", diagnosis: "", scheme: "",
      authorisation: "", admittedAt: new Date().toISOString().slice(0, 16), notes: "",
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f: typeof form) => ({ ...f, [k]: v }));

  const validate = () => {
    const parsed = admissionSchema.safeParse(form);
    if (parsed.success) { setErrors({}); return true; }
    const errs: Record<string, string> = {};
    for (const iss of parsed.error.issues) errs[iss.path.join(".")] = iss.message;
    setErrors(errs);
    return false;
  };

  const saveDraft = () => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
    toast.success("Draft saved", { description: "You can resume this admission later." });
  };

  const admit = () => {
    if (!validate()) { toast.error("Please fix the highlighted fields"); return; }
    localStorage.removeItem(DRAFT_KEY);
    toast.success("Patient admitted", { description: "Admission created and moved to worklist." });
    navigate({ to: "/admissions" });
  };

  return (
    <>
      <div className="mb-4">
        <Link to="/admissions" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to admissions
        </Link>
      </div>

      <PageHeader
        eyebrow="Clinical · Admissions"
        title="New admission"
        description="Capture the essential admission details. Save as draft or admit to add to the worklist."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={saveDraft} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs">
              <Save className="h-3.5 w-3.5" /> Save draft
            </button>
            <PermissionGate permission="admissions:create">
              <button onClick={admit} className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow">
                <BedDouble className="h-4 w-4" /> Admit patient
              </button>
            </PermissionGate>
          </div>
        }
      />

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Patient" error={errors.patientId}>
            <select value={form.patientId} onChange={(e) => set("patientId", e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Select a patient…</option>
              {MOCK_PATIENTS.map((p) => <option key={p.id} value={p.id}>{p.fullName} — {p.mrn}</option>)}
            </select>
          </Field>
          <Field label="Admission type" error={errors.admissionType}>
            <select value={form.admissionType} onChange={(e) => set("admissionType", e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {["Elective", "Emergency", "Maternity", "Day Case", "Transfer"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Facility" error={errors.facility}>
            <input value={form.facility} onChange={(e) => set("facility", e.target.value)} className="input" />
          </Field>
          <Field label="Ward" error={errors.ward}>
            <input value={form.ward} onChange={(e) => set("ward", e.target.value)} className="input" placeholder="e.g. Ward 3B" />
          </Field>
          <Field label="Bed" error={errors.bed}>
            <input value={form.bed} onChange={(e) => set("bed", e.target.value)} className="input" placeholder="Optional" />
          </Field>
          <Field label="Practitioner" error={errors.practitioner}>
            <input value={form.practitioner} onChange={(e) => set("practitioner", e.target.value)} className="input" placeholder="Dr. …" />
          </Field>
          <Field label="Provisional diagnosis" error={errors.diagnosis}>
            <input value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} className="input" />
          </Field>
          <Field label="Scheme" error={errors.scheme}>
            <input value={form.scheme} onChange={(e) => set("scheme", e.target.value)} className="input" />
          </Field>
          <Field label="Linked authorisation" error={errors.authorisation}>
            <input value={form.authorisation} onChange={(e) => set("authorisation", e.target.value)} className="input" placeholder="AUTH-…" />
          </Field>
          <Field label="Admitted at" error={errors.admittedAt}>
            <input type="datetime-local" value={form.admittedAt} onChange={(e) => set("admittedAt", e.target.value)} className="input" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Clinical notes" error={errors.notes}>
              <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} className="input min-h-[80px]" />
            </Field>
          </div>
        </div>

        <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;}`}</style>
      </Card>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error && (
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      )}
    </label>
  );
}
