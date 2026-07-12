import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Shield, Database, ArrowUpRightSquare } from "lucide-react";
import { PageHeader, Card } from "@/components/app-shell";
import { InfoNote } from "@/components/states";

export const Route = createFileRoute("/_app/pcms")({
  head: () => ({
    meta: [
      { title: "PCMS External Access — Impilo" },
      { name: "description", content: "Secure launcher into the PCMS product master data system. PCMS is a separate system." },
    ],
  }),
  component: PCMSLauncher,
});

function PCMSLauncher() {
  return (
    <>
      <PageHeader eyebrow="Platform · External System" title="PCMS External Access" description="Launch into PCMS. Impilo does not rebuild PCMS — it links out to it." />

      <InfoNote>
        <strong>PCMS is a separate system.</strong> This page is a launcher. Product master data,
        catalog rules and reference data continue to live in PCMS. Impilo integrates with PCMS
        over Azure Service Bus (see Integration Monitor for message flow).
      </InfoNote>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "PCMS Console", desc: "Search, view and maintain product master data in PCMS.", icon: Database, href: "https://pcms.example.co.za/" },
          { title: "Reference Data", desc: "Maintain code lists shared between Impilo and PCMS.", icon: Shield, href: "https://pcms.example.co.za/reference" },
          { title: "PCMS Reports", desc: "Product-side reports and reconciliations.", icon: ArrowUpRightSquare, href: "https://pcms.example.co.za/reports" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <a key={c.title} href={c.href} target="_blank" rel="noreferrer" className="group block">
              <Card className="p-5 transition-shadow hover:shadow-glow">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </div>
                <div className="mt-4 font-medium">{c.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.desc}</div>
              </Card>
            </a>
          );
        })}
      </div>

      <Card className="mt-6 p-4 text-xs text-muted-foreground">
        Access to PCMS is authenticated via your organisation account. If a page in PCMS fails to load, check
        the <a className="text-primary underline" href="/system-health">System Health</a> page for the PCMS Bridge status.
      </Card>
    </>
  );
}
