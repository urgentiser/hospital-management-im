import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, FileDown, BookOpen } from "lucide-react";
import { Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { WorkflowModule } from "@/components/workflow-module";
import { useWorkflow } from "@/lib/workflow-store";

export const Route = createFileRoute("/_app/accounting")({
  head: () => ({
    meta: [
      { title: "Accounting — Impilo" },
      { name: "description", content: "General ledger journals, revenue postings and month-end close for Impilo." },
    ],
  }),
  component: AccountingPage,
});

function AccountingPage() {
  return (
    <WorkflowModule
      config={{
        moduleKey: "accounting",
        eyebrow: "Financial · Accounting",
        title: "Accounting",
        description: "Prepare, review and post GL journals; monitor revenue, provisions and month-end close.",
        workflow: ["draft", "pending", "posted", "closed"],
        outcomes: ["reversed"],
        columns: [
          { key: "title", label: "Journal" },
          { key: "Account", label: "GL account" },
          { key: "Amount", label: "Amount" },
          { key: "Period", label: "Period" },
          { key: "Journal", label: "Ref" },
        ],
        fields: [
          { key: "description", label: "Description", required: true, placeholder: "e.g. June revenue posting" },
          { key: "account", label: "GL account", required: true, placeholder: "e.g. 4000 Revenue" },
          { key: "amount", label: "Amount", required: true, placeholder: "R 0.00" },
          { key: "period", label: "Period", required: true, placeholder: "e.g. June 2026" },
          { key: "journal", label: "Journal ref", placeholder: "JV-0000" },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
        titleFrom: (f) => String(f["Description"] || "New journal"),
        subtitleFrom: (f) => `${f["Account"]} · ${f["Amount"]}`,
        kpis: (items) => {
          const posted = items.filter((i) => i.status === "posted" || i.status === "closed");
          const revenue = posted.reduce((s, i) => s + parseCurrency(String(i.fields["Amount"] ?? "0")), 0);
          return [
            { label: "Draft", value: items.filter((i) => i.status === "draft").length },
            { label: "Pending review", value: items.filter((i) => i.status === "pending").length },
            { label: "Posted", value: items.filter((i) => i.status === "posted").length },
            { label: "Net posted", value: fmtR(revenue) },
          ];
        },
        extras: <AccountingExtras />,
      }}
    />
  );
}

function AccountingExtras() {
  const items = useWorkflow((s) => s.items.accounting);
  const advance = useWorkflow((s) => s.advance);

  const [closeOpen, setCloseOpen] = useState(false);
  const [period, setPeriod] = useState("");

  const periods = useMemo(() => {
    return Array.from(new Set(items.map((i) => String(i.fields["Period"] ?? "")))).filter(Boolean);
  }, [items]);

  const trialBalance = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((i) => {
      if (i.status === "draft") return;
      const acc = String(i.fields["Account"] ?? "Unclassified");
      map.set(acc, (map.get(acc) ?? 0) + parseCurrency(String(i.fields["Amount"] ?? "0")));
    });
    return [...map.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  }, [items]);
  const total = trialBalance.reduce((s, [, v]) => s + v, 0);

  const postAllPending = () => {
    const pending = items.filter((i) => i.status === "pending");
    pending.forEach((i) => advance("accounting", i.id, "posted", "Batch posted to GL"));
    toast.success(`${pending.length} journal(s) posted`);
  };

  const closePeriod = () => {
    if (!period) return;
    const affected = items.filter((i) => String(i.fields["Period"] ?? "") === period && i.status === "posted");
    affected.forEach((i) => advance("accounting", i.id, "closed", `Period ${period} closed`));
    toast.success(`Period ${period} closed`, { description: `${affected.length} journal(s) locked` });
    setCloseOpen(false); setPeriod("");
  };

  const exportTrialBalance = () => {
    const rows = [["Account", "Amount"], ...trialBalance.map(([a, v]) => [a, v.toFixed(2)])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "trial-balance.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Trial balance exported");
  };

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Ledger actions</div>
            <div className="mt-1 text-sm text-muted-foreground">Post pending journals in bulk, export a trial balance and lock a period for month-end close.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={exportTrialBalance}><FileDown className="h-4 w-4" /> Trial balance</Button>
            <Button size="sm" variant="outline" onClick={() => setCloseOpen(true)}><Lock className="h-4 w-4" /> Close period</Button>
            <Button size="sm" onClick={postAllPending} className="bg-gradient-primary hover:opacity-90">
              <BookOpen className="h-4 w-4" /> Post pending
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Trial balance (posted &amp; closed)</div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Account</th>
                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trialBalance.length === 0 && (
                  <tr><td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">No posted journals yet.</td></tr>
                )}
                {trialBalance.map(([acc, v]) => (
                  <tr key={acc}>
                    <td className="px-4 py-2">{acc}</td>
                    <td className={"px-4 py-2 text-right font-mono " + (v < 0 ? "text-destructive" : "")}>{fmtR(v)}</td>
                  </tr>
                ))}
                {trialBalance.length > 0 && (
                  <tr className="bg-muted/30 font-semibold">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2 text-right font-mono">{fmtR(total)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close accounting period</DialogTitle>
            <DialogDescription>Locks all posted journals for the selected period. This action is auditable.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label>Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger><SelectValue placeholder="Select a period…" /></SelectTrigger>
              <SelectContent>
                {periods.length === 0 && <SelectItem value="__none" disabled>No periods available</SelectItem>}
                {periods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancel</Button>
            <Button disabled={!period} onClick={closePeriod} className="bg-gradient-primary hover:opacity-90">Close period</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function parseCurrency(s: string) {
  const n = parseFloat(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function fmtR(n: number) {
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
