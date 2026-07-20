import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { OperationalProcessConsole } from "@/components/compatibility/operational-process";
import { CurrentStateModuleButton } from "@/components/current-state/module-specification";

export const Route = createFileRoute("/_app/member-validation")({
  head: () => ({
    meta: [
      { title: "Member Validation — Impilo" },
      { name: "description", content: "Verify medical scheme membership, principal member, dependant and consent information using the established Impilo process." },
    ],
  }),
  component: MemberValidationPage,
});

function MemberValidationPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Patient Care · Funding Verification"
        title="Member Validation"
        description="Follow the established verification, consent, submission and result-review sequence while using the modern Impilo design."
        actions={<CurrentStateModuleButton moduleKey="member-validation" compact />}
      />
      <div className="rounded-2xl border border-border bg-card/50 p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><BadgeCheck className="h-5 w-5" /></div>
          <div>
            <div className="font-medium">Membership and eligibility operations</div>
            <div className="text-xs text-muted-foreground">Same process names, privileges, sequence and request contracts used by Impilo operations.</div>
          </div>
        </div>
        <OperationalProcessConsole moduleKey="member-validation" embedded />
      </div>
    </div>
  );
}
