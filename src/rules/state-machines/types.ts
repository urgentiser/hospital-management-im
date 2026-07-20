import type { Permission } from "@/security/types";

export type StateTransition = {
  from: string;
  to: string;
  permission?: Permission;
  ruleIds?: string[];
  requiresReason?: boolean;
  confirmation?: string;
};

export type StateMachineDefinition = {
  initialState: string;
  terminalStates: string[];
  transitions: StateTransition[];
};

export function getAvailableTransitions(machine: StateMachineDefinition, currentState: string): StateTransition[] {
  return machine.transitions.filter((transition) => transition.from === currentState);
}

export function isTerminalState(machine: StateMachineDefinition, state: string): boolean {
  return machine.terminalStates.includes(state);
}

export function deriveSequentialStateMachine(
  stages: string[],
  outcomes: string[] = [],
  permissionFor?: (target: string) => Permission | undefined,
): StateMachineDefinition {
  if (!stages.length) throw new Error("A workflow must define at least one stage.");
  const transitions: StateTransition[] = [];
  stages.forEach((from, index) => {
    const next = stages[index + 1];
    if (next) transitions.push({ from, to: next, permission: permissionFor?.(next) });
    outcomes.forEach((to) => {
      transitions.push({
        from,
        to,
        permission: permissionFor?.(to),
        requiresReason: true,
        confirmation: `Confirm that you want to move this record to ${to}.`,
      });
    });
  });
  return {
    initialState: stages[0],
    terminalStates: [...new Set([stages.at(-1)!, ...outcomes])],
    transitions,
  };
}
