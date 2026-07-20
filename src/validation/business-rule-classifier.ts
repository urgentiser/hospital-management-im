import type { CurrentStateModuleSpecification, CurrentStateRecord } from "@/current-state/types";
import type {
  FrontendValidationProfile,
  FrontendValidationRule,
  ValidationFieldDescriptor,
} from "@/validation/types";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "be", "before", "cannot", "for", "from", "has", "have", "in", "is", "must",
  "not", "of", "on", "or", "provided", "required", "selected", "supplied", "the", "to", "with", "without",
]);

const SERVER_ONLY_PATTERNS = [
  /already exists/i,
  /does not exist/i,
  /not found/i,
  /availability|available bed|bed available/i,
  /stock|inventory/i,
  /locked|concurren/i,
  /authorisation (?:is )?(?:approved|valid)|authorization (?:is )?(?:approved|valid)/i,
  /member validation|membership validation|funder validation/i,
  /provider unavailable|service unavailable|integration unavailable/i,
  /duplicate (?:patient|record|transaction)/i,
  /benefit|tariff|contracted|claim status|account balance/i,
  /database|cache|server|gateway/i,
  /permission|privilege|role access/i,
];

const CONTROLLED_ACTION = /(cancel|reject|reverse|refund|replay|ignore|discontinue|undischarge|override|unfinal|archive|delete|void)/i;

function value(record: CurrentStateRecord, key: string): string {
  const candidate = record[key];
  return candidate === null || candidate === undefined ? "" : String(candidate);
}

function normalise(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_/.-]+/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(input: string): Set<string> {
  return new Set(normalise(input).split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token)));
}

function fieldScore(ruleText: string, field: ValidationFieldDescriptor): number {
  const ruleTokens = tokens(ruleText);
  const fieldTokens = tokens(`${field.name} ${field.label}`);
  let score = 0;
  for (const token of fieldTokens) {
    if (ruleTokens.has(token)) score += token.length >= 6 ? 4 : 2;
  }
  const rule = normalise(ruleText);
  const name = normalise(field.name);
  const label = normalise(field.label);
  if (name && rule.includes(name)) score += 8;
  if (label && rule.includes(label)) score += 8;

  const aliases: Array<[RegExp, RegExp]> = [
    [/medical aid|scheme/, /scheme|medical aid|funder/],
    [/membership number|member number/, /membership|member.*number/],
    [/dependant|dependent/, /dependant|dependent/],
    [/hospital unit|hospital/, /facility|hospital/],
    [/mobile|telephone|contact number/, /mobile|phone|telephone|contact/],
    [/date of birth|birth date/, /dob|date.*birth|birth.*date/],
    [/identity number|id number/, /identity|national.*id|id.*number/],
    [/principal member/, /principal.*member/],
    [/ward unit/, /ward|unit/],
  ];
  for (const [rulePattern, fieldPattern] of aliases) {
    if (rulePattern.test(rule) && fieldPattern.test(`${name} ${label}`)) score += 8;
  }
  return score;
}

function findField(ruleText: string, fields: ValidationFieldDescriptor[]): ValidationFieldDescriptor | undefined {
  return fields
    .map((field) => ({ field, score: fieldScore(ruleText, field) }))
    .sort((left, right) => right.score - left.score)
    .find((candidate) => candidate.score >= 4)?.field;
}

function addRule(target: FrontendValidationRule[], rule: FrontendValidationRule): void {
  const key = `${rule.kind}:${rule.field ?? ""}:${rule.relatedField ?? ""}:${rule.message}`;
  if (!target.some((candidate) => `${candidate.kind}:${candidate.field ?? ""}:${candidate.relatedField ?? ""}:${candidate.message}` === key)) {
    target.push(rule);
  }
}

function ruleText(record: CurrentStateRecord): string {
  return [value(record, "rule_name"), value(record, "rule_code"), value(record, "description")].filter(Boolean).join(" ");
}

function addFieldRules(fields: ValidationFieldDescriptor[], target: FrontendValidationRule[]): void {
  for (const field of fields) {
    const lower = `${field.name} ${field.label}`.toLowerCase();
    if (field.required) {
      addRule(target, {
        id: `field.required.${field.name}`,
        kind: "required",
        field: field.name,
        stepIndex: field.stepIndex,
        message: `${field.label} is required.`,
      });
    }
    if (/email/.test(lower)) {
      addRule(target, { id: `field.email.${field.name}`, kind: "email", field: field.name, stepIndex: field.stepIndex, message: `Enter a valid ${field.label.toLowerCase()}.` });
    }
    if (/(mobile|phone|telephone|contact number)/.test(lower)) {
      addRule(target, { id: `field.phone.${field.name}`, kind: "phone", field: field.name, stepIndex: field.stepIndex, message: `Enter a valid ${field.label.toLowerCase()}.` });
    }
    if (field.type === "number") {
      addRule(target, { id: `field.number.${field.name}`, kind: "number", field: field.name, stepIndex: field.stepIndex, message: `${field.label} must be a valid number.` });
    }
    if (field.type === "date" || field.type === "datetime-local") {
      addRule(target, { id: `field.date.${field.name}`, kind: "date", field: field.name, stepIndex: field.stepIndex, message: `${field.label} must contain a valid date.` });
    }
    if (field.type === "json") {
      addRule(target, { id: `field.json.${field.name}`, kind: "json", field: field.name, stepIndex: field.stepIndex, message: `${field.label} contains invalid structured information.` });
    }
  }
}

function dateCandidates(fields: ValidationFieldDescriptor[]): Array<[ValidationFieldDescriptor, ValidationFieldDescriptor]> {
  const dateFields = fields.filter((field) => field.type === "date" || field.type === "datetime-local" || /date|time/i.test(`${field.name} ${field.label}`));
  const pairs: Array<[RegExp, RegExp]> = [
    [/(start|from|admission|admitted|effective from|scheduled)/i, /(end|to|discharge|discharged|effective to|completed|expiry|expiration)/i],
  ];
  const result: Array<[ValidationFieldDescriptor, ValidationFieldDescriptor]> = [];
  for (const [startPattern, endPattern] of pairs) {
    const start = dateFields.find((field) => startPattern.test(`${field.name} ${field.label}`));
    const end = dateFields.find((field) => endPattern.test(`${field.name} ${field.label}`));
    if (start && end && start.name !== end.name) result.push([start, end]);
  }
  return result;
}

function addModuleRules(
  moduleKey: string,
  action: string,
  fields: ValidationFieldDescriptor[],
  target: FrontendValidationRule[],
): void {
  const field = (pattern: RegExp) => fields.find((candidate) => pattern.test(`${candidate.name} ${candidate.label}`));
  const actionText = normalise(action);

  if (CONTROLLED_ACTION.test(actionText)) {
    const reason = field(/reason|note|comment/i);
    if (reason) addRule(target, { id: `${moduleKey}.controlled-reason`, kind: "reason-required", field: reason.name, stepIndex: reason.stepIndex, message: "Provide a reason before continuing." });
  }

  if (moduleKey === "admissions") {
    const gender = field(/gender|sex/i);
    const visitType = field(/visit type|admission type|maternity/i);
    if (gender) addRule(target, { id: "admissions.maternity-gender", kind: "maternity-gender", field: gender.name, relatedField: visitType?.name, stepIndex: gender.stepIndex, message: "A maternity patient cannot be recorded as male." });
  }

  if (moduleKey === "member-validation") {
    for (const pattern of [/membership.*number|member.*number/i, /scheme/i, /plan|option/i, /dependant|dependent.*code/i]) {
      const candidate = field(pattern);
      if (candidate) addRule(target, { id: `member-validation.required.${candidate.name}`, kind: "required", field: candidate.name, stepIndex: candidate.stepIndex, message: `${candidate.label} is required for member validation.` });
    }
    const principalDob = field(/principal.*date.*birth|principal.*dob/i);
    if (principalDob) addRule(target, { id: "member-validation.principal-adult", kind: "adult", field: principalDob.name, stepIndex: principalDob.stepIndex, message: "The principal member must be at least 18 years old." });
  }

  if (moduleKey === "coid") {
    const employer = field(/employer/i);
    if (employer) addRule(target, { id: "coid.employer-required", kind: "required", field: employer.name, stepIndex: employer.stepIndex, message: "Employer information is required for a COID claim." });
  }

  if (moduleKey === "documents-and-printing" || /document|upload/i.test(actionText)) {
    const type = field(/document.*type|category/i);
    if (type) addRule(target, { id: "documents.type-required", kind: "required", field: type.name, stepIndex: type.stepIndex, message: "Select a document type." });
  }

  if (["billing", "accounting", "reimbursements", "funding", "adhoc-and-supplier-invoices"].includes(moduleKey) && !/(refund|credit|reverse|reversal|adjust)/i.test(actionText)) {
    for (const candidate of fields.filter((item) => /(amount|price|cost|total|quantity)/i.test(`${item.name} ${item.label}`))) {
      addRule(target, { id: `${moduleKey}.non-negative.${candidate.name}`, kind: "non-negative", field: candidate.name, stepIndex: candidate.stepIndex, message: `${candidate.label} cannot be negative.` });
    }
  }

  const identityNumber = field(/(sa )?(identity|id).*number|national.*id/i);
  const dateOfBirth = field(/date.*birth|birth.*date|dob/i);
  if (identityNumber && dateOfBirth) {
    addRule(target, {
      id: `${moduleKey}.identity-dob-match`,
      kind: "south-african-id-dob",
      field: identityNumber.name,
      relatedField: dateOfBirth.name,
      stepIndex: Math.max(identityNumber.stepIndex ?? 0, dateOfBirth.stepIndex ?? 0),
      message: "The date of birth does not match the South African identity number.",
    });
  }

  const patientIdentifier = field(/patient.*(identifier|identity number)|medical record|mrn/i);
  const unavailableReason = field(/identifier.*unavailable.*reason|reason.*identifier.*unavailable|no identifier.*reason/i);
  if (patientIdentifier && unavailableReason) {
    addRule(target, {
      id: `${moduleKey}.identifier-or-reason`,
      kind: "one-of-required",
      field: patientIdentifier.name,
      relatedField: unavailableReason.name,
      stepIndex: Math.max(patientIdentifier.stepIndex ?? 0, unavailableReason.stepIndex ?? 0),
      message: "Capture a patient identifier or provide the reason why it is unavailable.",
    });
  }

  for (const candidate of fields.filter((item) => /(guarantor|principal.*member).*(date.*birth|dob)|(date.*birth|dob).*(guarantor|principal.*member)/i.test(`${item.name} ${item.label}`))) {
    addRule(target, { id: `${moduleKey}.adult.${candidate.name}`, kind: "adult", field: candidate.name, stepIndex: candidate.stepIndex, message: `${candidate.label} must represent a person who is at least 18 years old.` });
  }

  if (moduleKey === "pharmacy" && /(credit|return)/i.test(actionText)) {
    const credited = field(/credit.*quantity|quantity.*credit/i);
    const dispensed = field(/dispensed.*quantity|quantity.*dispensed/i);
    if (credited && dispensed) addRule(target, { id: "pharmacy.credit-limit", kind: "less-than-or-equal-field", field: credited.name, relatedField: dispensed.name, stepIndex: credited.stepIndex, message: "The credited quantity cannot exceed the dispensed quantity." });
  }

  if (moduleKey === "theatre-management") {
    const gases = field(/gas.*(quantity|duration|time)|(quantity|duration|time).*gas/i);
    const theatreTime = field(/theatre.*(duration|time)|(duration|time).*theatre/i);
    if (gases && theatreTime) addRule(target, { id: "theatre.gas-time-limit", kind: "less-than-or-equal-field", field: gases.name, relatedField: theatreTime.name, stepIndex: gases.stepIndex, message: "Medical gas usage cannot exceed the recorded theatre time." });
  }

  if (moduleKey === "ward-management") {
    const serviceDate = field(/service.*date|treatment.*date/i);
    const admissionDate = field(/admission.*date|admitted.*date/i);
    const departureDate = field(/departure.*date|discharge.*date/i);
    if (serviceDate && admissionDate) addRule(target, { id: "ward.service-after-admission", kind: "date-order", field: serviceDate.name, relatedField: admissionDate.name, stepIndex: serviceDate.stepIndex, message: "The ward service date cannot be before the admission date." });
    if (serviceDate && departureDate) addRule(target, { id: "ward.service-before-departure", kind: "date-order", field: departureDate.name, relatedField: serviceDate.name, stepIndex: serviceDate.stepIndex, message: "The ward service date cannot be after the departure date." });
    if (serviceDate) addRule(target, { id: "ward.service-not-future", kind: "not-future", field: serviceDate.name, stepIndex: serviceDate.stepIndex, message: "The ward service date cannot be in the future." });
  }

  if (["admissions", "preadmission"].includes(moduleKey)) {
    const prepayment = field(/prepayment/i);
    const amountToTake = field(/amount.*take|amount.*due|outstanding.*amount/i);
    if (prepayment && amountToTake) addRule(target, { id: `${moduleKey}.prepayment-limit`, kind: "less-than-or-equal-field", field: prepayment.name, relatedField: amountToTake.name, stepIndex: prepayment.stepIndex, message: "The prepayment cannot exceed the amount due." });
  }

  if (moduleKey === "accounting" && /refund/i.test(actionText)) {
    const refund = field(/refund.*amount/i);
    const available = field(/available.*refund|original.*payment|payment.*amount/i);
    if (refund && available) addRule(target, { id: "accounting.refund-limit", kind: "less-than-or-equal-field", field: refund.name, relatedField: available.name, stepIndex: refund.stepIndex, message: "The refund cannot exceed the available original payment." });
  }
}

export function buildFrontendValidationProfile(
  specification: CurrentStateModuleSpecification,
  action: string,
  fields: ValidationFieldDescriptor[],
): FrontendValidationProfile {
  const rules: FrontendValidationRule[] = [];
  const usedSourceRules = new Set<string>();
  addFieldRules(fields, rules);
  addModuleRules(specification.key, action, fields, rules);

  for (const [start, end] of dateCandidates(fields)) {
    addRule(rules, {
      id: `${specification.key}.date-order.${start.name}.${end.name}`,
      kind: "date-order",
      field: end.name,
      relatedField: start.name,
      stepIndex: Math.max(start.stepIndex ?? 0, end.stepIndex ?? 0),
      message: `${end.label} cannot be before ${start.label}.`,
    });
  }

  for (const record of specification.rules) {
    const text = ruleText(record);
    if (!text) continue;
    const sourceRuleCode = value(record, "rule_code") || value(record, "rule_name") || `rule-${usedSourceRules.size + 1}`;
    const candidate = findField(text, fields);
    const lower = normalise(text);
    let added = false;

    const required = /(not supplied|not provided|is required|are required|must be (captured|selected|specified|provided|supplied|entered|assigned)|cannot be (empty|blank|null)|missing)/i.test(text);
    if (required && candidate) {
      addRule(rules, { id: `business.${sourceRuleCode}`, kind: "required", field: candidate.name, stepIndex: candidate.stepIndex, sourceRuleCode, message: value(record, "description") || `${candidate.label} is required.` });
      added = true;
    } else if (/(must be greater than zero|must be positive|cannot be zero)/i.test(text) && candidate) {
      addRule(rules, { id: `business.${sourceRuleCode}`, kind: "positive", field: candidate.name, stepIndex: candidate.stepIndex, sourceRuleCode, message: value(record, "description") || `${candidate.label} must be greater than zero.` });
      added = true;
    } else if (/(cannot be negative|must not be negative)/i.test(text) && candidate) {
      addRule(rules, { id: `business.${sourceRuleCode}`, kind: "non-negative", field: candidate.name, stepIndex: candidate.stepIndex, sourceRuleCode, message: value(record, "description") || `${candidate.label} cannot be negative.` });
      added = true;
    } else if (/(cannot be in the future|must not be in the future)/i.test(text) && candidate) {
      addRule(rules, { id: `business.${sourceRuleCode}`, kind: "not-future", field: candidate.name, stepIndex: candidate.stepIndex, sourceRuleCode, message: value(record, "description") || `${candidate.label} cannot be in the future.` });
      added = true;
    } else if (/maternity patient cannot be male/i.test(lower)) {
      const gender = fields.find((field) => /gender|sex/i.test(`${field.name} ${field.label}`));
      const visitType = fields.find((field) => /visit type|admission type|maternity/i.test(`${field.name} ${field.label}`));
      if (gender) {
        addRule(rules, { id: `business.${sourceRuleCode}`, kind: "maternity-gender", field: gender.name, relatedField: visitType?.name, stepIndex: gender.stepIndex, sourceRuleCode, message: value(record, "description") || "A maternity patient cannot be male." });
        added = true;
      }
    } else if (/(under age|must be at least 18|must be an adult)/i.test(text) && candidate) {
      addRule(rules, { id: `business.${sourceRuleCode}`, kind: "adult", field: candidate.name, stepIndex: candidate.stepIndex, sourceRuleCode, message: value(record, "description") || `${candidate.label} must represent an adult.` });
      added = true;
    }

    if (added) usedSourceRules.add(sourceRuleCode);
  }

  // A rule that requires database, integration, stock, availability, concurrency or
  // authoritative status checks is intentionally left to the API. The frontend still
  // submits the exact module payload and renders API validation errors against fields.
  // Every source rule is assigned an owner. Rules translated above are enforced
  // immediately in the form. Every unresolved rule remains authoritative at API
  // submission, including live data, cross-service and external-provider checks.
  const serverRuleCount = specification.rules.filter((record) => {
    const code = value(record, "rule_code") || value(record, "rule_name");
    return !usedSourceRules.has(code);
  }).length;

  return { rules, serverRuleCount, sourceRuleCount: specification.rules.length };
}
