import { buildFrontendValidationProfile } from "@/validation/business-rule-classifier";
import type { CurrentStateModuleSpecification, CurrentStateRecord } from "@/current-state/types";
import contractMapData from "@/compatibility/operation-contract-map.json";
import type {
  CompatibilityField,
  CompatibilityFieldType,
  CompatibilityModule,
  CompatibilityOperation,
  CompatibilityParameter,
  ContractConfidence,
} from "@/compatibility/types";


type ContractMapEntry = {
  serviceInterface: string | null;
  method: string | null;
  parameters: string;
  confidence: ContractConfidence;
  sourceCallCount?: number;
  sourceReferences?: string[];
};

const contractMap = contractMapData as Record<string, ContractMapEntry>;

const primitiveTypes = new Set([
  "string", "char", "bool", "boolean", "byte", "sbyte", "short", "ushort", "int", "uint", "long", "ulong",
  "float", "double", "decimal", "guid", "datetime", "datetimeoffset", "timespan",
]);

const stopWords = new Set([
  "a", "an", "and", "by", "for", "from", "in", "of", "on", "patient", "the", "to", "view", "manage", "maintain", "capture",
]);

const actionSynonyms: Record<string, string[]> = {
  admit: ["admission", "save", "create", "convert"],
  admission: ["admit", "save", "load", "find"],
  cancel: ["cancel", "discontinue", "reverse"],
  confirm: ["confirm", "approve", "complete"],
  discharge: ["discharge", "departure", "complete"],
  dispense: ["dispense", "issue", "fulfil"],
  edit: ["update", "save", "maintain"],
  enquire: ["search", "find", "get", "load"],
  enquiry: ["search", "find", "get", "load"],
  move: ["transfer", "move", "location"],
  print: ["print", "document", "label"],
  register: ["register", "create", "save"],
  search: ["search", "find", "get", "load"],
  submit: ["submit", "send", "publish"],
  update: ["update", "save", "maintain"],
  validate: ["validate", "verify", "check"],
};

function value(row: CurrentStateRecord, key: string): string {
  const raw = row[key];
  return raw === null || raw === undefined ? "" : String(raw).trim();
}

function slug(valueToSlug: string): string {
  return valueToSlug
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function tokens(input: string): string[] {
  const expanded = input.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const result = new Set<string>();
  for (const token of expanded.split(/\s+/).filter(Boolean)) {
    if (!stopWords.has(token)) result.add(token);
    for (const synonym of actionSynonyms[token] ?? []) result.add(synonym);
  }
  return [...result];
}

function scoreMethod(action: string, method: string): number {
  const actionTokens = tokens(action);
  const methodTokens = tokens(method);
  let score = 0;
  for (const token of actionTokens) {
    if (methodTokens.includes(token)) score += token.length >= 7 ? 5 : 3;
    else if (method.toLowerCase().includes(token)) score += 2;
  }
  if (/^(get|find|load|search)/i.test(method) && /view|search|enquir|list|dashboard|history/i.test(action)) score += 4;
  if (/^(save|create|add|register)/i.test(method) && /new|register|capture|admit|create/i.test(action)) score += 4;
  if (/update|maintain|edit/i.test(method) && /update|maintain|edit/i.test(action)) score += 4;
  if (/cancel|reverse|discontinue/i.test(method) && /cancel|reverse|discontinue|undischarge/i.test(action)) score += 5;
  return score;
}

function parseParameters(rawParameters: string): CompatibilityParameter[] {
  if (!rawParameters.trim()) return [];
  return rawParameters
    .split(/,(?![^<]*>)/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => {
      const cleaned = part.replace(/\b(ref|out|in|params)\b/g, "").trim();
      const segments = cleaned.split(/\s+/);
      const name = segments.length > 1 ? segments.at(-1)! : `value${index + 1}`;
      const contractType = segments.length > 1 ? segments.slice(0, -1).join(" ") : segments[0];
      const normalType = contractType.replace(/\?$/, "").replace(/\[\]$/, "").replace(/^I(?:List|Enumerable|Collection)<(.+)>$/, "$1");
      return {
        name,
        contractType,
        collection: /\[\]|I(?:List|Enumerable|Collection)</.test(contractType),
        primitive: primitiveTypes.has(normalType.toLowerCase()),
      };
    });
}

function cleanType(rawType: string): string {
  return rawType
    .replace(/^System\./, "")
    .replace(/\?$/, "")
    .replace(/\[\]$/, "")
    .replace(/^I(?:List|Enumerable|Collection)<(.+)>$/, "$1")
    .trim();
}

function fieldInputType(contractType: string): CompatibilityFieldType {
  const lower = cleanType(contractType).toLowerCase();
  if (["int", "uint", "long", "ulong", "short", "ushort", "byte", "sbyte", "float", "double", "decimal"].includes(lower)) return "number";
  if (["bool", "boolean"].includes(lower)) return "checkbox";
  if (lower === "datetime" || lower === "datetimeoffset") return "datetime-local";
  if (lower === "dateonly") return "date";
  if (!primitiveTypes.has(lower) && lower !== "guid") return "json";
  return "text";
}

function friendlyLabel(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\bId\b/g, "ID")
    .replace(/\bMrn\b/gi, "MRN")
    .replace(/^./, (character) => character.toUpperCase());
}

function isRequiredProperty(propertyName: string, propertyType: string): boolean {
  const lower = propertyType.toLowerCase();
  if (propertyType.endsWith("?")) return false;
  if (/^(is|has|can)[A-Z]/.test(propertyName)) return false;
  // Older contracts do not encode nullable reference types consistently. Required
  // strings and identifiers are therefore derived from the process rule catalogue
  // rather than guessed from a property name. Non-null value types remain required.
  return ["int", "long", "short", "byte", "decimal", "double", "float", "datetime", "datetimeoffset", "dateonly", "guid"].includes(cleanType(lower));
}

function parseModelFields(
  specification: CurrentStateModuleSpecification,
  parameter: CompatibilityParameter,
  stepCount: number,
): CompatibilityField[] {
  if (parameter.primitive) {
    return [{
      path: parameter.name,
      name: parameter.name,
      label: friendlyLabel(parameter.name),
      contractType: parameter.contractType,
      inputType: fieldInputType(parameter.contractType),
      required: !parameter.contractType.endsWith("?"),
      placeholder: parameter.contractType,
      stepIndex: Math.min(1, Math.max(0, stepCount - 1)),
    }];
  }

  const targetType = cleanType(parameter.contractType);
  const model = specification.models.find((candidate) => value(candidate, "type_name") === targetType);
  if (!model) {
    return [{
      path: parameter.name,
      name: parameter.name,
      label: friendlyLabel(parameter.name),
      contractType: parameter.contractType,
      inputType: "json",
      required: true,
      placeholder: `{ /* ${targetType} */ }`,
      stepIndex: Math.min(1, Math.max(0, stepCount - 1)),
    }];
  }

  const propertyRows = specification.properties.filter((candidate) => value(candidate, "type_name") === targetType);
  const sourceProperties = propertyRows.length
    ? propertyRows.map((candidate) => ({ name: value(candidate, "property_name"), type: value(candidate, "property_type") }))
    : value(model, "properties").split("|").map((part) => {
        const [name, ...rest] = part.trim().split(":");
        return { name: name?.trim() ?? "", type: rest.join(":").trim() };
      });

  return sourceProperties
    .filter((property) => property.name && property.type)
    .map((property, index) => ({
      path: parameter.name ? `${parameter.name}.${property.name}` : property.name,
      name: `${parameter.name}_${property.name}`,
      label: friendlyLabel(property.name),
      contractType: property.type,
      inputType: fieldInputType(property.type),
      required: isRequiredProperty(property.name, property.type),
      placeholder: property.type,
      stepIndex: Math.min(Math.max(1, index % Math.max(1, stepCount - 2)), Math.max(0, stepCount - 2)),
    }));
}

function findWorkflow(specification: CurrentStateModuleSpecification, action: string) {
  const normalAction = action.trim().toLowerCase();
  return specification.operatingFlows.find((flow) => (flow.action ?? "").trim().toLowerCase() === normalAction)
    ?? specification.operatingFlows.find((flow) => normalAction.includes((flow.action ?? "").trim().toLowerCase()))
    ?? null;
}

function findService(specification: CurrentStateModuleSpecification, action: string) {
  const scored = specification.services
    .map((service) => ({
      service,
      score: scoreMethod(action, value(service, "method")),
    }))
    .sort((left, right) => right.score - left.score);
  const best = scored[0];
  if (!best || best.score <= 0) return { service: null, confidence: "unmapped" as ContractConfidence };
  return {
    service: best.service,
    confidence: best.score >= 8 ? "confirmed" as ContractConfidence : "probable" as ContractConfidence,
  };
}


function friendlyPlaceholder(field: CompatibilityField): string | undefined {
  if (field.inputType === "number") return "0";
  if (field.inputType === "date" || field.inputType === "datetime-local" || field.inputType === "checkbox") return undefined;
  if (field.inputType === "json") return `Capture ${field.label.toLowerCase()} details`;
  return `Enter ${field.label.toLowerCase()}`;
}

function ensureActionFields(action: string, fields: CompatibilityField[], stepCount: number): CompatibilityField[] {
  const result = fields.map((field) => ({ ...field, placeholder: friendlyPlaceholder(field) }));
  const controlled = /(cancel|reject|reverse|refund|replay|ignore|discontinue|undischarge|override|unfinal|archive|delete|void)/i.test(action);
  const hasReason = result.some((field) => /reason|note|comment/i.test(`${field.name} ${field.label}`));
  if (controlled && !hasReason) {
    result.push({
      path: "reason",
      name: "reason",
      label: "Reason",
      contractType: "string",
      inputType: "textarea",
      required: true,
      placeholder: "Provide the reason for this action",
      stepIndex: Math.max(0, stepCount - 1),
    });
  }
  return result;
}

function buildOperation(
  specification: CurrentStateModuleSpecification,
  menu: CurrentStateRecord,
): CompatibilityOperation {
  const action = value(menu, "action") || "Open process";
  const operationId = `${specification.key}:${slug(action)}`;
  const workflow = findWorkflow(specification, action);
  const steps = workflow?.steps?.length
    ? workflow.steps
    : ["Identify Context", "Capture Details", "Validate", "Confirm"];
  const mappedContract = contractMap[operationId];
  const match = mappedContract ? null : findService(specification, action);
  const serviceInterface = mappedContract?.serviceInterface ?? (match?.service ? value(match.service, "service_interface") : null);
  const method = mappedContract?.method ?? (match?.service ? value(match.service, "method") : null);
  const rawParameters = mappedContract?.parameters ?? (match?.service ? value(match.service, "parameters") : "");
  const parameters = parseParameters(rawParameters);
  const fields = ensureActionFields(action, parameters.flatMap((parameter) => parseModelFields(specification, parameter, steps.length)), steps.length);
  const validationProfile = buildFrontendValidationProfile(specification, action, fields);
  return {
    id: operationId,
    moduleKey: specification.key,
    moduleName: specification.name,
    action,
    privilege: value(menu, "privilege") || null,
    contextType: value(menu, "context_type") || null,
    navigationType: value(menu, "navigation_type") || null,
    workflowType: value(menu, "workflow_type") || null,
    sourcePath: workflow?.sourcePath ?? (value(menu, "source_path") || null),
    steps,
    serviceInterface,
    method,
    parameters,
    fields,
    frontendValidationRules: validationProfile.rules,
    serverValidationRuleCount: validationProfile.serverRuleCount,
  };
}

function buildEmbeddedOperations(specification: CurrentStateModuleSpecification): CompatibilityOperation[] {
  return specification.services.slice(0, 30).map((service) => {
    const serviceInterface = value(service, "service_interface");
    const method = value(service, "method");
    const parameters = parseParameters(value(service, "parameters"));
    const action = friendlyLabel(method);
    const steps = ["Identify Context", "Capture Details", "Validate", "Submit", "Review Result"];
    const fields = ensureActionFields(action, parameters.flatMap((parameter) => parseModelFields(specification, parameter, steps.length)), steps.length);
    const validationProfile = buildFrontendValidationProfile(specification, action, fields);
    return {
      id: `${specification.key}:${slug(method)}`,
      moduleKey: specification.key,
      moduleName: specification.name,
      action,
      privilege: null,
      contextType: "Embedded capability",
      navigationType: "Invoked by another workflow",
      workflowType: null,
      sourcePath: value(service, "source_path") || null,
      steps,
      serviceInterface,
      method,
      parameters,
      fields,
      frontendValidationRules: validationProfile.rules,
      serverValidationRuleCount: validationProfile.serverRuleCount,
    };
  });
}

export function buildCompatibilityModule(specification: CurrentStateModuleSpecification): CompatibilityModule {
  const operations = specification.menus.length
    ? specification.menus.map((menu) => buildOperation(specification, menu))
    : buildEmbeddedOperations(specification);
  return { specification, operations };
}

function setNested(target: Record<string, unknown>, path: string, valueToSet: unknown): void {
  const parts = path.split(".").filter(Boolean);
  let cursor = target;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (index === parts.length - 1) {
      cursor[part] = valueToSet;
    } else {
      const next = cursor[part];
      if (!next || typeof next !== "object" || Array.isArray(next)) cursor[part] = {};
      cursor = cursor[part] as Record<string, unknown>;
    }
  }
}

function convertValue(field: CompatibilityField, raw: string | boolean): unknown {
  if (field.inputType === "checkbox") return Boolean(raw);
  if (field.inputType === "number") return raw === "" ? null : Number(raw);
  if (field.inputType === "json") {
    if (!raw || typeof raw !== "string") return {};
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

export function createCompatibilityPayload(
  operation: CompatibilityOperation,
  values: Record<string, string | boolean>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of operation.fields) {
    const raw = values[field.name];
    if (raw === undefined || raw === "") continue;
    setNested(payload, field.path, convertValue(field, raw));
  }

  if (operation.parameters.length === 1 && !operation.parameters[0].primitive) {
    const parameterName = operation.parameters[0].name;
    const nested = payload[parameterName];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) return nested as Record<string, unknown>;
  }
  return payload;
}
