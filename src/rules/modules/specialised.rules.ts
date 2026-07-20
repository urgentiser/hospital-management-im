import type { RuleDefinition } from "@/rules/types";

export const specialisedRules: RuleDefinition[] = [
  {
    id: "coid.employer-required",
    description: "Employer information is mandatory for a COID claim.",
    evaluate(context) {
      const employer = String(context.values.employer ?? context.values.Employer ?? "").trim();
      return employer
        ? { ruleId: "coid.employer-required", allowed: true, severity: "info", message: "Employer information is captured." }
        : { ruleId: "coid.employer-required", allowed: false, severity: "error", message: "Capture the employer before submitting the COID claim.", field: "employer" };
    },
  },
  {
    id: "document.scan-complete",
    description: "A document must pass malware scanning before it can be published.",
    evaluate(context) {
      const status = String(context.values.scanStatus ?? "").toLowerCase();
      return status === "clean" || status === "passed"
        ? { ruleId: "document.scan-complete", allowed: true, severity: "info", message: "Document security scan passed." }
        : { ruleId: "document.scan-complete", allowed: false, severity: "error", message: "The document cannot be published until the security scan passes.", field: "scanStatus" };
    },
  },
];
