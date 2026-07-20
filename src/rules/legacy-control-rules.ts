import type { RuleDefinition, RuleResult, RuleValues } from "@/rules/types";

function pass(ruleId: string, message: string): RuleResult { return { ruleId, allowed: true, severity: "info", message }; }
function value(values: RuleValues, ...names: string[]): string {
  for (const name of names) { const candidate = values[name]; if (candidate !== undefined && candidate !== null && String(candidate).trim()) return String(candidate); }
  return "";
}
function numberValues(values: RuleValues): Array<[string, number]> {
  return Object.entries(values).filter(([key, raw]) => /(amount|price|cost|total|balance|quantity)/i.test(key) && raw !== "" && raw !== null && raw !== undefined)
    .map(([key, raw]) => [key, Number(raw)] as [string, number]).filter(([, raw]) => Number.isFinite(raw));
}

export const legacyControlRules: RuleDefinition[] = [
  { id: "legacy.temporal-order", description: "End and completion dates cannot precede their related start dates.", evaluate(context) {
    const pairs = [["startDate","endDate"],["fromDate","toDate"],["admissionDate","dischargeDate"],["admittedAt","dischargedAt"],["scheduledAt","completedAt"],["effectiveFrom","effectiveTo"]];
    for (const [startKey,endKey] of pairs) { const start=value(context.values,startKey); const end=value(context.values,endKey); if (start && end && new Date(end).getTime() < new Date(start).getTime()) return { ruleId:"legacy.temporal-order",allowed:false,severity:"error",message:`${endKey} cannot be before ${startKey}.`,field:endKey }; }
    return pass("legacy.temporal-order","Date sequence is valid.");
  }},
  { id: "legacy.non-negative-values", description: "Operational amounts and quantities cannot be negative outside controlled credit or reversal flows.", evaluate(context) {
    if (/(credit|refund|reverse|reversal|adjust)/i.test(context.action)) return pass("legacy.non-negative-values","Controlled adjustment action permits signed values.");
    const invalid=numberValues(context.values).find(([,raw])=>raw<0);
    return invalid ? { ruleId:"legacy.non-negative-values",allowed:false,severity:"error",message:`${invalid[0]} cannot be negative.`,field:invalid[0] } : pass("legacy.non-negative-values","Numeric values are valid.");
  }},
  { id: "legacy.controlled-action-reason", description: "Cancellation, rejection, reversal, replay, ignore and override actions require a reason.", evaluate(context) {
    if (!/(cancel|reject|reverse|refund|replay|ignore|discontinue|undischarge|override|unfinal|archive)/i.test(`${context.action} ${context.targetState ?? ""}`)) return pass("legacy.controlled-action-reason","A controlled-action reason is not required.");
    return context.reason?.trim() ? pass("legacy.controlled-action-reason","Controlled-action reason supplied.") : { ruleId:"legacy.controlled-action-reason",allowed:false,severity:"error",message:"Provide a reason for this controlled action.",field:"reason" };
  }},
  { id: "legacy.facility-ward-consistency", description: "A ward or unit must belong to the selected facility.", evaluate(context) {
    const facility=value(context.values,"facility","Facility"); const wardFacility=value(context.values,"wardFacility","Ward Facility");
    return facility && wardFacility && facility !== wardFacility ? { ruleId:"legacy.facility-ward-consistency",allowed:false,severity:"error",message:"The selected ward/unit does not belong to the selected facility.",field:"ward" } : pass("legacy.facility-ward-consistency","Facility and ward context are consistent.");
  }},
  { id: "legacy.document-metadata", description: "Documents require a type and linked business entity.", evaluate(context) {
    if (!/(document|upload|print)/i.test(`${context.moduleKey} ${context.action}`)) return pass("legacy.document-metadata","Document metadata validation is not applicable.");
    const documentType=value(context.values,"documentType","Document Type","type"); const linked=value(context.values,"entityId","patientId","admissionId","caseId","visitId");
    if (!documentType) return { ruleId:"legacy.document-metadata",allowed:false,severity:"error",message:"Select a document type.",field:"documentType" };
    if (!linked) return { ruleId:"legacy.document-metadata",allowed:false,severity:"error",message:"Link the document to a patient, visit, admission, case or transaction.",field:"entityId" };
    return pass("legacy.document-metadata","Document metadata is complete.");
  }},
  { id: "legacy.integration-retry-policy", description: "Integration replay and retry operations must respect the configured delivery limit.", evaluate(context) {
    if (!/(retry|replay)/i.test(`${context.action} ${context.targetState ?? ""}`)) return pass("legacy.integration-retry-policy","Retry policy is not applicable.");
    const attempts=Number(value(context.values,"retryCount","Attempts","attempts")||0); const limit=Number(value(context.values,"maxRetries","Max Retries")||5);
    return attempts>=limit && !String(context.values.overrideApproved ?? "").match(/^(true|yes)$/i) ? { ruleId:"legacy.integration-retry-policy",allowed:false,severity:"error",message:`Retry limit of ${limit} has been reached. Escalate or obtain an authorised override.` } : pass("legacy.integration-retry-policy","Retry policy permits the action.");
  }},
  { id: "legacy.patient-identity", description: "Patient-care records require a patient identity or medical record number.", evaluate(context) {
    if (!/(patient|triage|assessment|preadmission|admission|medical|pharmacy|theatre|ward|case|billing|coid)/i.test(context.moduleKey)) return pass("legacy.patient-identity","Patient identity is not required for this module.");
    const identified=Boolean(value(context.values,"patientId","patient","Patient","mrn","MRN","name"));
    return identified ? pass("legacy.patient-identity","Patient identity is available.") : { ruleId:"legacy.patient-identity",allowed:false,severity:"error",message:"Select or identify the patient before continuing.",field:"patient" };
  }},
];
