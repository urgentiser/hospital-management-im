import { registerRules } from "@/rules/registry";
import { commonRules } from "@/rules/common-rules";
import { patientRules } from "@/rules/modules/patient.rules";
import { admissionRules } from "@/rules/modules/admission.rules";
import { integrationRules } from "@/rules/modules/integration.rules";
import { revenueRules } from "@/rules/modules/revenue.rules";
import { clinicalOperationsRules } from "@/rules/modules/clinical-operations.rules";
import { specialisedRules } from "@/rules/modules/specialised.rules";
import { legacyControlRules } from "@/rules/legacy-control-rules";

let registered = false;
if (!registered) {
  registerRules([
    ...commonRules,
    ...patientRules,
    ...admissionRules,
    ...integrationRules,
    ...revenueRules,
    ...clinicalOperationsRules,
    ...specialisedRules,
    ...legacyControlRules,
  ]);
  registered = true;
}
