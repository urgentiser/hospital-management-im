import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Wand2, ArrowRightCircle, FileDown, Upload } from "lucide-react";
import { Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { WorkflowModule } from "@/components/workflow-module";
import { useWorkflow } from "@/lib/workflow-store";

export const Route = createFileRoute("/_app/triangle")({
  head: () => ({
    meta: [
      { title: "Triangle Reconciliation — Impilo" },
      { name: "description", content: "Three-way reconciliation across tariff, claim and remittance for every funder." },
    ],
  }),
  component: TrianglePage,
});

function TrianglePage() {
  return (
    <WorkflowModule
      config={{
        moduleKey: "triangle",
        eyebrow: "Financial · Reconciliation",
        title: "Triangle",
        description: "Three-way match between contracted tariff, submitted claim and scheme remittance.",
        workflow: ["open", "matching", "review", "reconciled"],
        outcomes: ["written-off"],
        columns: [
          { key: "title", label: "Reconciliation" },
          { key: "Scheme", label: "Scheme" },
          { key: "Claims", label: "Claims" },
          { key: "Variance", label: "Variance" },
          { key: "Period", label: "Period" },
        ],
        fields: [
          { key: "scheme", label: "Scheme", required: true, type: "select",
            options: ["Discovery Health", "Bonitas", "GEMS", "Momentum Health", "Polmed", "Medshield", "Other"] },
          { key: "period", label: "Period", required: true, placeholder: "e.g. Week 27 / June" },
          { key: "claims", label: "Claims", type: "number", placeholder: "e.g. 128" },
          { key: "variance", label: "Variance amount", placeholder: "R 0.00" },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
        titleFrom: (f) => `${f["Scheme"]} — ${f["Period"]}`,
        subtitleFrom: (f) => `${f["Claims"]} claims · variance ${f["Variance"] || "R 0"}`,
        kpis: (items) => {
          const totalClaims = items.reduce((n, i) => n + Number(i.fields["Claims"] ?? 0), 0);
          const openVariance = items
            .filter((i) => i.status !== "reconciled" && i.status !== "written-off")
            .reduce((sum, i) => sum + parseCurrency(String(i.fields["Variance"] ?? "0")), 0);
          return [
            { label: "Total claims", value: totalClaims },
            { label: "Open recs", value: items.filter((i) => ["open", "matching", "review"].includes(i.status)).length },
            { label: "Reconciled", value: items.filter((i) => i.status === "reconciled").length },
            { label: "Open variance", value: fmtR(openVariance) },
          ];
        },
        extras: <TriangleExtras />,
      }}
    />
  );
}

function TriangleExtras() {
  const items = useWorkflow((s) => s.items.triangle);
  const advance = useWorkflow((s) => s.advance);
  const create = useWorkflow((s) => s.create);

  const [busy, setBusy] = useState(false);

  const bySchemeVariance = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((i) => {
      const s = String(i.fields["Scheme"] ?? "Unknown");
      map.set(s, (map.get(s) ?? 0) + parseCurrency(String(i.fields["Variance"] ?? "0")));
    });
    return [...map.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  }, [items]);
  const maxVar = Math.max(1, ...bySchemeVariance.map(([, v]) => Math.abs(v)));

  const autoMatch = () => {
    setBusy(true);
    let matched = 0;
    items.forEach((i) => {
      const v = parseCurrency(String(i.fields["Variance"] ?? "0"));
      if (i.status === "open" && Math.abs(v) < 50) {
        advance("triangle", i.id, "reconciled", "Auto-matched · variance below R50 tolerance");
        matched++;
      } else if (i.status === "open") {
        advance("triangle", i.id, "matching", "Queued for detailed match");
      }
    });
    setBusy(false);
    toast.success(`Auto-match complete`, { description: `${matched} reconciled · ${items.length - matched} queued for review` });
  };

  const importRemittance = () => {
    const rec = create("triangle", {
      title: `Imported remittance — ${new Date().toLocaleDateString()}`,
      subtitle: "Imported ERA · 42 claims",
      status: "matching",
      fields: {
        Scheme: "Discovery Health",
        Claims: 42,
        Variance: `R ${(Math.random() * 5000).toFixed(0)}`,
        Period: new Date().toLocaleDateString(),
      },
    });
    toast.success("Remittance imported", { description: rec.id });
  };

  const exportCsv = () => {
    const rows = [
      ["Reference", "Scheme", "Period", "Claims", "Variance", "Status"],
      ...items.map((i) => [i.id, i.fields["Scheme"], i.fields["Period"], i.fields["Claims"], i.fields["Variance"], i.status]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("triangle-reconciliations.csv", "text/csv", csv);
    toast.success("Export downloaded");
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Reconciliation actions</div>
          <div className="mt-1 text-sm text-muted-foreground">Auto-match low-variance items, import ERA remittances or export the current view.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={importRemittance}><Upload className="h-4 w-4" /> Import remittance</Button>
          <Button size="sm" variant="outline" onClick={exportCsv}><FileDown className="h-4 w-4" /> Export CSV</Button>
          <Button size="sm" onClick={autoMatch} disabled={busy} className="bg-gradient-primary hover:opacity-90">
            <Wand2 className="h-4 w-4" /> Auto-match now
          </Button>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Variance by scheme</div>
        {bySchemeVariance.length === 0 && <div className="text-sm text-muted-foreground">No reconciliations yet.</div>}
        {bySchemeVariance.map(([scheme, v]) => (
          <div key={scheme} className="text-xs">
            <div className="flex justify-between">
              <span>{scheme}</span>
              <span className="font-mono text-muted-foreground">{fmtR(v)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={"h-full " + (v < 0 ? "bg-destructive" : "bg-gradient-primary")}
                style={{ width: `${(Math.abs(v) / maxVar) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <ArrowRightCircle className="h-3.5 w-3.5" /> Auto-match tolerance: R 50.00 · items under threshold are closed instantly.
      </div>
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
function downloadFile(name: string, mime: string, body: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
