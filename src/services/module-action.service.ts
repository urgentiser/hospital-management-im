import type { CommandResult } from "@/contracts/common/command-result";
import type { ModuleKey, WorkflowItem } from "@/lib/workflow-store";
import type { AppPrincipal, Permission } from "@/security/types";
import { getModuleService } from "@/services/modules/registry";
import { validateModuleInput } from "@/validation/engine";

export type ModuleActionField = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
};

export type ExecuteModuleActionInput = {
  moduleKey: ModuleKey;
  actionKey: string;
  kind: string;
  startStatus: string;
  fields: ModuleActionField[];
  values: Record<string, string>;
  title: string;
  subtitle?: string;
  principal: AppPrincipal | null;
  facility?: string;
  permission?: Permission;
};

export async function executeModuleAction(
  input: ExecuteModuleActionInput,
): Promise<CommandResult<WorkflowItem>> {
  const validation = await validateModuleInput({
    moduleKey: input.moduleKey,
    action: input.actionKey,
    fields: input.fields.map((field) => ({ name: field.name, label: field.label, type: field.type, required: field.required })),
    values: input.values,
    user: input.principal,
    facility: input.facility,
    permission: input.permission,
    reason: input.values.reason || input.values.notes || input.values.note,
  });

  if (!validation.allowed) {
    throw new Error(validation.errors[0]?.message ?? "The action did not pass business validation.");
  }

  const fields: Record<string, string | number> = { Kind: input.kind };
  input.fields.forEach((field) => {
    const raw = input.values[field.name] ?? "";
    if (!raw) return;
    fields[field.label] = field.type === "number" ? Number(raw) : raw;
  });

  return getModuleService(input.moduleKey).createRecord({
    title: input.title,
    subtitle: input.subtitle,
    status: input.startStatus,
    fields,
  });
}
