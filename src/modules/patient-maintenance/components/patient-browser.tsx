/**
 * Patient directory — searchable, filterable directory of patients.
 * Exposed as an embeddable `PatientBrowser` component and a
 * `PatientBrowserModal` wrapper for helper process cards.
 */
import { useMemo, useState } from "react";
import { Building2, Eye, Filter, PhoneCall, Printer, Search as SearchIcon, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDateZA } from "@/lib/format";
import { patientMaintenanceService } from "@/services/modules/patient-maintenance.service";
import { PM_FACILITIES, PM_SCHEMES } from "@/modules/patient-maintenance/mock/patient-maintenance-mock-data";
import type { FundingMethod, PatientStatus } from "@/modules/patient-maintenance/contracts";
import { useAuth } from "@/security/auth-provider";
import { hasPermission, Permissions } from "@/security/permissions";

export function maskIdentifier(value?: string | null): string {
  if (!value) return "—";
  const trimmed = String(value).trim();
  if (trimmed.length <= 4) return "•".repeat(Math.max(4, trimmed.length));
  return "•".repeat(Math.max(4, trimmed.length - 4)) + trimmed.slice(-4);
}

type EmbedProps = {
  onOpenPatient?: (id: string) => void;
  onUpdateContact?: (id: string) => void;
  onPrintDocuments?: (id: string) => void;
  compact?: boolean;
};

export function PatientBrowser({ onOpenPatient, onUpdateContact, onPrintDocuments, compact }: EmbedProps) {
  const { principal } = useAuth();
  const canView = hasPermission(principal, Permissions.PatientView);
  const canUpdate = hasPermission(principal, Permissions.PatientUpdate);
  const canPrint = hasPermission(principal, Permissions.DocumentView);

  const [q, setQ] = useState("");
  const [facility, setFacility] = useState<string>("All");
  const [status, setStatus] = useState<PatientStatus | "All">("All");
  const [funding, setFunding] = useState<FundingMethod | "All">("All");

  const results = useMemo(() => {
    if (!canView) return [];
    return patientMaintenanceService.listPatients({
      q,
      facility: facility === "All" ? undefined : facility,
      status: status === "All" ? undefined : status,
      fundingMethod: funding === "All" ? undefined : funding,
    });
  }, [q, facility, status, funding, canView]);

  const reset = () => { setQ(""); setFacility("All"); setStatus("All"); setFunding("All"); };

  if (!canView) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">
        You do not have access to the patient directory.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", compact && "text-xs")}>
      <div className="rounded-xl border bg-muted/20 p-3">
        <div className="grid gap-3 sm:grid-cols-5">
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Search Patient</Label>
            <Input placeholder="Name / MRN / phone / email…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <FilterSelect label="Facility" value={facility} onChange={setFacility} options={["All", ...PM_FACILITIES]} />
          <FilterSelect label="Status" value={status} onChange={(v) => setStatus(v as PatientStatus | "All")} options={["All","Active","Inactive","Merged","Deceased"]} />
          <FilterSelect label="Funding" value={funding} onChange={(v) => setFunding(v as FundingMethod | "All")} options={["All","Medical Scheme","Private / Cash","Government","Insurance","COID"]} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1"><Filter className="h-3 w-3" />{results.length} result(s)</Badge>
          {q && <ChipReset label={`Search: ${q}`} onClear={() => setQ("")} />}
          {facility !== "All" && <ChipReset label={`Facility: ${facility}`} onClear={() => setFacility("All")} />}
          {status !== "All" && <ChipReset label={`Status: ${status}`} onClear={() => setStatus("All")} />}
          {funding !== "All" && <ChipReset label={`Funding: ${funding}`} onClear={() => setFunding("All")} />}
          {(q || facility !== "All" || status !== "All" || funding !== "All") && (
            <Button size="sm" variant="ghost" onClick={reset} className="h-6 text-[11px]">Clear all</Button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">
          No patients match the current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
              <tr>
                <Th>Name</Th><Th>MRN</Th><Th>Identifier</Th><Th>DOB</Th>
                <Th>Facility</Th><Th>Funding</Th><Th>Status</Th><Th>Updated</Th>
                <Th className="w-[220px] text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {results.map((p) => (
                <tr key={p.id} className="hover:bg-accent/40">
                  <Td>
                    <div className="font-medium">{p.firstName} {p.surname}</div>
                    <div className="text-[10px] text-muted-foreground">{p.identifierType}</div>
                  </Td>
                  <Td className="font-mono text-[11px]">{p.mrn}</Td>
                  <Td className="font-mono text-[11px]">{maskIdentifier(p.identifierValue)}</Td>
                  <Td>{formatDateZA(p.dateOfBirth)}</Td>
                  <Td><span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3 text-muted-foreground" />{p.facility}</span></Td>
                  <Td>{p.funding.method}</Td>
                  <Td>
                    <Badge variant="outline" className={cn("text-[10px]",
                      p.status === "Active" && "border-emerald-400/50 text-emerald-700 dark:text-emerald-400",
                      p.status === "Inactive" && "border-muted-foreground/40 text-muted-foreground",
                      p.status === "Merged" && "border-amber-400/50 text-amber-700 dark:text-amber-400",
                      p.status === "Deceased" && "border-rose-400/50 text-rose-700 dark:text-rose-400",
                    )}>{p.status}</Badge>
                  </Td>
                  <Td className="text-[11px] text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString("en-ZA")}</Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => onOpenPatient?.(p.id)} disabled={!onOpenPatient} title="Open Profile">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onUpdateContact?.(p.id)} disabled={!canUpdate || !onUpdateContact} title="Update Contact Details">
                        <PhoneCall className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onPrintDocuments?.(p.id)} disabled={!canPrint || !onPrintDocuments} title="Print Past Documents">
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type ModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenPatient: (id: string) => void;
  onUpdateContact?: (id: string) => void;
  onPrintDocuments?: (id: string) => void;
};

export function PatientBrowserModal({ open, onOpenChange, onOpenPatient, onUpdateContact, onPrintDocuments }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1100px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-4rem)]">
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 shadow-sm ring-1 ring-border">
              <SearchIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg">Patient directory</DialogTitle>
              <DialogDescription className="text-xs">Search across the patient index and open any profile.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <PatientBrowser onOpenPatient={onOpenPatient} onUpdateContact={onUpdateContact} onPrintDocuments={onPrintDocuments} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

void PM_SCHEMES;

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
function ChipReset({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] hover:bg-accent">
      {label} <X className="h-3 w-3" />
    </button>
  );
}
function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2 text-left font-medium", className)}>{children}</th>;
}
function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2 align-middle", className)}>{children}</td>;
}
