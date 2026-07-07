import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RotateCcw, Send } from "lucide-react";
import { Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { WorkflowModule } from "@/components/workflow-module";
import { useWorkflow } from "@/lib/workflow-store";

export const Route = createFileRoute("/_app/adhoc")({
  head: () => ({
    meta: [
      { title: "Adhoc Charges — Impilo" },
      { name: "description", content: "Capture and approve adhoc charges, adjustments and discounts outside the standard billing flow." },
    ],
  }),
  component: AdhocPage,
});

function AdhocPage() {
  return (
    <WorkflowModule
      config={{
        moduleKey: "adhoc",
        eyebrow: "Financial · Adhoc",
        title: "Adhoc",
        description: "Post one-off charges, credits and manual adjustments with reason and approval trail.",
        workflow: ["captured", "approved", "posted"],
        outcomes: ["rejected", "reversed"],
        columns: [
          { key: "title", label: "Item" },
          { key: "Patient", label: "Patient" },
          { key: "Amount", label: "Amount" },
          { key: "Reason", label: "Reason" },
        ],
        fields: [
          { key: "patient", label: "Patient", required: true },
          { key: "type", label: "Type", type: "select",
            options: ["Charge", "Credit / discount", "Refund", "Write-off", "Manual journal"] },
          { key: "amount", label: "Amount", required: true, placeholder: "R 0.00 (use minus for credits)" },
          { key: "reason", label: "Reason", required: true },
          { key: "reference", label: "Reference", placeholder: "Related visit / invoice" },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
        titleFrom: (f) => `${f["Type"] || "Adhoc"} — ${f["Reason"]}`,
        subtitleFrom: (f) => `${f["Patient"]} · ${f["Amount"]}`,
        kpis: (items) => {
          const total = items.reduce((sum, i) => sum + parseCurrency(String(i.fields["Amount"] ?? "0")), 0);
          return [
            { label: "Captured", value: items.filter((i) => i.status === "captured").length },
            { label: "Approved", value: items.filter((i) => i.status === "approved").length },
            { label: "Posted", value: items.filter((i) => i.status === "posted").length },
            { label: "Net value", value: fmtR(total) },
          ];
        },
        extras: <AdhocExtras />,
      }}
    />
  );
}

function AdhocExtras() {
  const items = useWorkflow((s) => s.items.adhoc);
  const advance = useWorkflow((s) => s.advance);

  const pending = useMemo(() => items.filter((i) => i.status === "captured"), [items]);
  const approved = useMemo(() => items.filter((i) => i.status === "approved"), [items]);

  const approveAll = () => {
    pending.forEach((i) => advance("adhoc", i.id, "approved", "Bulk approval"));
    toast.success(`${pending.length} adhoc item(s) approved`);
  };
  const postApproved = () => {
    approved.forEach((i) => advance("adhoc", i.id, "posted", "Posted to General Ledger"));
    toast.success(`${approved.length} item(s) posted to GL`);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Approval queue</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {pending.length} awaiting approval · {approved.length} approved and ready to post
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={!pending.length} onClick={approveAll}>
            <CheckCircle2 className="h-4 w-4" /> Approve all captured
          </Button>
          <Button size="sm" onClick={postApproved} disabled={!approved.length} className="bg-gradient-primary hover:opacity-90">
            <Send className="h-4 w-4" /> Post approved to GL
          </Button>
        </div>
      </div>

      {pending.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {pending.slice(0, 5).map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-4 py-2 text-sm">
              <div className="flex-1">
                <div className="font-medium">{i.title}</div>
                <div className="text-xs text-muted-foreground">{String(i.fields["Patient"] ?? "—")} · {String(i.fields["Amount"] ?? "—")}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => advance("adhoc", i.id, "approved", "Approved")}>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => advance("adhoc", i.id, "rejected", "Rejected")}>
                <XCircle className="h-4 w-4 text-destructive" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => advance("adhoc", i.id, "reversed", "Reversed")}>
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function parseCurrency(s: string) {
  const n = parseFloat(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function fmtR(n: number) {
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
