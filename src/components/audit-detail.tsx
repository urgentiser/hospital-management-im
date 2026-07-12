import { useMemo, useState } from "react";
import { ScrollText, Search as SearchIcon, Lock } from "lucide-react";
import { Card, StatusChip } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import type { WorkflowItem } from "@/lib/workflow-store";

function pretty(v: unknown): string {
  if (typeof v !== "string" || !v) return "—";
  try { return JSON.stringify(JSON.parse(v), null, 2); } catch { return v; }
}

export function AuditDetailTable({ items }: { items: WorkflowItem[] }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return items
      .filter((i) => String(i.fields["Kind"] ?? "") === "Audit" || !!i.fields["Event"])
      .filter((i) => {
        if (!q) return true;
        const hay = [
          i.title, i.subtitle ?? "", i.id,
          String(i.fields["Actor"] ?? ""), String(i.fields["Module"] ?? ""),
          String(i.fields["Entity ID"] ?? ""), String(i.fields["Correlation"] ?? ""),
          String(i.fields["Event"] ?? ""),
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
  }, [items, query]);

  const active = rows.find((r) => r.id === openId) ?? rows[0] ?? null;

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-primary" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Immutable log</div>
            <div className="font-display text-base font-semibold">Audit entry detail</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5">
          <SearchIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Actor · module · entity · correlation…"
            className="h-7 w-64 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Reference · At</th>
                  <th className="px-3 py-2 text-left font-medium">Event</th>
                  <th className="px-3 py-2 text-left font-medium">Actor · Role</th>
                  <th className="px-3 py-2 text-left font-medium">Facility</th>
                  <th className="px-3 py-2 text-left font-medium">Module · Entity</th>
                  <th className="px-3 py-2 text-left font-medium">Correlation</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No entries match your search.
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const isActive = active?.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setOpenId(r.id)}
                      className={
                        "cursor-pointer transition-colors " +
                        (isActive ? "bg-primary/5" : "hover:bg-muted/30")
                      }
                    >
                      <td className="px-3 py-2 font-mono text-[11px]">
                        <div>{r.id}</div>
                        <div className="text-[10px] text-muted-foreground">{String(r.fields["At"] ?? "")}</div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px]">{String(r.fields["Event"] ?? r.title)}</td>
                      <td className="px-3 py-2">
                        <div>{String(r.fields["Actor"] ?? "—")}</div>
                        <div className="text-[10px] text-muted-foreground">{String(r.fields["Actor role"] ?? "")}</div>
                      </td>
                      <td className="px-3 py-2">{String(r.fields["Facility"] ?? "—")}</td>
                      <td className="px-3 py-2">
                        <div>{String(r.fields["Module"] ?? "—")}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{String(r.fields["Entity type"] ?? "")} · {String(r.fields["Entity ID"] ?? "")}</div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{String(r.fields["Correlation"] ?? "")}</td>
                      <td className="px-3 py-2"><StatusChip status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <Card className="border-primary/20 bg-background/60 p-4">
          {!active ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Select an entry to inspect.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-mono text-[11px] text-muted-foreground">{active.id}</div>
                  <div className="mt-0.5 truncate font-display text-sm font-semibold">{String(active.fields["Event"] ?? active.title)}</div>
                </div>
                <StatusChip status={active.status} />
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                <DlRow label="Actor" value={`${String(active.fields["Actor"] ?? "—")}`} />
                <DlRow label="Role" value={String(active.fields["Actor role"] ?? "—")} />
                <DlRow label="Facility" value={String(active.fields["Facility"] ?? "—")} />
                <DlRow label="Source app" value={String(active.fields["Source app"] ?? "—")} />
                <DlRow label="Module" value={String(active.fields["Module"] ?? "—")} />
                <DlRow label="Entity" value={`${String(active.fields["Entity type"] ?? "—")} · ${String(active.fields["Entity ID"] ?? "")}`} />
                <DlRow label="At" value={String(active.fields["At"] ?? "—")} mono />
                <DlRow label="IP" value={String(active.fields["IP address"] ?? "—")} mono />
                <DlRow label="Correlation" value={String(active.fields["Correlation"] ?? "—")} mono />
                <DlRow label="Request ID" value={String(active.fields["Request ID"] ?? "—")} mono />
              </dl>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Before</div>
                  <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[10.5px] leading-snug text-foreground">
{pretty(active.fields["Before"])}
                  </pre>
                </div>
                <div className="rounded-lg border border-primary/25 bg-primary/5 p-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">After</div>
                  <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[10.5px] leading-snug text-foreground">
{pretty(active.fields["After"])}
                  </pre>
                </div>
              </div>

              {active.status === "sealed" && (
                <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300">
                  <Lock className="h-3.5 w-3.5" />
                  Entry belongs to a sealed period. Content is cryptographically chained and cannot be modified.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </Card>
  );
}

function DlRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={"truncate text-right text-foreground " + (mono ? "font-mono" : "")}>{value}</dd>
    </>
  );
}
