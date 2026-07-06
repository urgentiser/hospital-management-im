import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { authorisations } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/authorisations")({
  head: () => ({
    meta: [
      { title: "Authorisations — Impilo" },
      { name: "description", content: "Scheme authorisations queue and review workflow." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <>
      <PageHeader
        eyebrow="Clinical · Funding & Authorisation"
        title="Authorisations"
        description="Track scheme authorisations across their lifecycle — from submission through approval, review, and appeal."
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Ref</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Scheme</th>
                <th className="px-5 py-3 font-medium">Procedure</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {authorisations.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-mono text-xs">{a.id}</td>
                  <td className="px-5 py-3">{a.patient}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.scheme}</td>
                  <td className="px-5 py-3">{a.procedure}</td>
                  <td className="px-5 py-3 text-right font-mono">R {a.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{a.submittedAt}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
