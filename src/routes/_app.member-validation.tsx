import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/_app/member-validation")({
  head: () => ({
    meta: [
      { title: "Member Validation — Impilo" },
      { name: "description", content: "Verify medical scheme membership, principal member, dependant and consent information." },
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
        description="Verify medical scheme membership, principal member, dependant and consent information."
      />
      <ModuleStub
        title="Membership and eligibility"
        eyebrow="Patient Care"
        description="Capture scheme details, run eligibility checks and confirm consent before funding activities."
      />
    </div>
  );
}
