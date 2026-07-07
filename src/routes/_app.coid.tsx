import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Printer, Send, Paperclip, AlertTriangle } from "lucide-react";
import { Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkflowModule } from "@/components/workflow-module";
import { useWorkflow } from "@/lib/workflow-store";

export const Route = createFileRoute("/_app/coid")({
  head: () => ({
    meta: [
      { title: "COID Claims — Impilo" },
      { name: "description", content: "Compensation for Occupational Injuries and Diseases (COID) claim intake and lifecycle." },
    ],
  }),
  component: CoidPage,
});

function CoidPage() {
  return (
    <WorkflowModule
      config={{
        moduleKey: "coid",
        eyebrow: "Statutory · COID",
        title: "COID",
        description: "Register injury-on-duty and occupational disease cases, submit to the Compensation Commissioner and track through payment.",
        workflow: ["intake", "submitted", "assessment", "approved", "paid"],
        outcomes: ["rejected"],
        columns: [
          { key: "title", label: "Case" },
          { key: "Employer", label: "Employer" },
          { key: "COID Ref", label: "COID Ref" },
          { key: "Injury", label: "Injury" },
        ],
        fields: [
          { key: "patient", label: "Patient", required: true, placeholder: "Full name" },
          { key: "employer", label: "Employer", required: true },
          { key: "coidRef", label: "COID reference", placeholder: "W.CL-000000" },
          { key: "injury", label: "Injury / condition", required: true },
          { key: "incidentDate", label: "Incident date", placeholder: "YYYY-MM-DD" },
          { key: "bodyPart", label: "Body part" },
          { key: "notes", label: "Description", type: "textarea" },
        ],
        titleFrom: (f) => `Injury on duty — ${f["Patient"]}`,
        subtitleFrom: (f) => `Employer: ${f["Employer"]}`,
        kpis: (items) => [
          { label: "Open", value: items.filter((i) => ["intake", "submitted", "assessment"].includes(i.status)).length },
          { label: "Approved", value: items.filter((i) => i.status === "approved").length },
          { label: "Paid", value: items.filter((i) => i.status === "paid").length },
          { label: "Rejected", value: items.filter((i) => i.status === "rejected").length },
        ],
        extras: <CoidExtras />,
      }}
    />
  );
}

function CoidExtras() {
  const items = useWorkflow((s) => s.items.coid);
  const advance = useWorkflow((s) => s.advance);
  const addNote = useWorkflow((s) => s.addNote);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  const submittable = items.filter((i) => i.status === "intake");
  const overdue = items.filter((i) => i.status === "submitted"); // stub: assume >7d

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">COID actions</div>
            <div className="mt-1 text-sm text-muted-foreground">Submit cases to the Compensation Commissioner, attach medical reports and print the W.Cl.4 first-medical form.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setAttachOpen(true)}>
              <Paperclip className="h-4 w-4" /> Attach medical report
            </Button>
            <Button size="sm" variant="outline" onClick={() => printWCl4(items[0])} disabled={!items[0]}>
              <Printer className="h-4 w-4" /> Print W.Cl.4
            </Button>
            <Button size="sm" onClick={() => setSubmitOpen(true)} className="bg-gradient-primary hover:opacity-90">
              <Send className="h-4 w-4" /> Submit to Commissioner
            </Button>
          </div>
        </div>
        {overdue.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-medium">{overdue.length} submitted case(s) awaiting assessment</div>
              <div className="text-xs opacity-80">Follow up with the Commissioner if no assessment within 7 working days.</div>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit COID case</DialogTitle>
            <DialogDescription>Send an intake case to the Compensation Commissioner. Requires a case in <b>intake</b> status.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label>Case</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue placeholder={submittable.length ? "Select a case…" : "No intake cases available"} /></SelectTrigger>
              <SelectContent>
                {submittable.map((c) => <SelectItem key={c.id} value={c.id}>{c.title} — {c.id}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedId}
              onClick={() => {
                advance("coid", selectedId, "submitted", "Submitted to Compensation Commissioner");
                toast.success("Case submitted", { description: selectedId });
                setSubmitOpen(false); setSelectedId("");
              }}
              className="bg-gradient-primary hover:opacity-90"
            >Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachReportDialog
        open={attachOpen}
        onOpenChange={setAttachOpen}
        cases={items}
        onAttach={(id, name) => {
          addNote("coid", id, `Attached medical report: ${name}`);
          toast.success("Report attached", { description: name });
          setAttachOpen(false);
        }}
      />
    </>
  );
}

function AttachReportDialog({
  open, onOpenChange, cases, onAttach,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  cases: { id: string; title: string }[];
  onAttach: (id: string, filename: string) => void;
}) {
  const [id, setId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach medical report</DialogTitle>
          <DialogDescription>Upload a PDF or scanned document to a COID case. Files stay local in this demo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Case</Label>
            <Select value={id} onValueChange={setId}>
              <SelectTrigger><SelectValue placeholder="Select a case…" /></SelectTrigger>
              <SelectContent>
                {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title} — {c.id}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>File</Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!id || !file} onClick={() => file && onAttach(id, file.name)}>Attach</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function printWCl4(c?: { id: string; title: string; fields: Record<string, string | number> }) {
  if (!c) { toast.info("No case to print"); return; }
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>W.Cl.4 — ${c.id}</title>
    <meta charset="utf-8"/>
    <style>body{font-family:system-ui,sans-serif;color:#111;padding:32px;max-width:820px;margin:0 auto;}
    h1{font-size:20px;margin:0;} header{border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:16px;}
    dl{display:grid;grid-template-columns:220px 1fr;gap:6px 12px;font-size:13px;} dt{color:#555;} .box{border:1px solid #999;padding:12px;margin-top:16px;border-radius:6px;}</style>
    </head><body>
      <header>
        <h1>W.Cl.4 · First Medical Report</h1>
        <div style="font-size:12px;color:#555;">Compensation for Occupational Injuries and Diseases Act · Generated ${new Date().toLocaleString()}</div>
      </header>
      <dl>
        <dt>Case reference</dt><dd>${c.id}</dd>
        <dt>Case title</dt><dd>${c.title}</dd>
        <dt>Employer</dt><dd>${c.fields["Employer"] ?? "—"}</dd>
        <dt>COID reference</dt><dd>${c.fields["COID Ref"] ?? "—"}</dd>
        <dt>Injury / condition</dt><dd>${c.fields["Injury"] ?? "—"}</dd>
        <dt>Body part</dt><dd>${c.fields["Body part"] ?? "—"}</dd>
        <dt>Incident date</dt><dd>${c.fields["Incident date"] ?? "—"}</dd>
      </dl>
      <div class="box"><b>Attending practitioner's findings</b><br/><br/><br/><br/><br/><br/></div>
      <div class="box"><b>Signature &amp; HPCSA number</b><br/><br/><br/></div>
      <script>window.onload=()=>setTimeout(()=>window.print(),300);</script>
    </body></html>`);
  w.document.close();
}
