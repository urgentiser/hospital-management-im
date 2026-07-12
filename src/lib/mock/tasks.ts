export interface TaskItem {
  id: string;
  title: string;
  patient?: string;
  module: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  dueAt: string;
  assignedTo: string;
  status: "open" | "in-progress" | "done";
}

const TASKS = [
  "Review authorisation follow-up", "Confirm pre-admission checklist", "Verify scheme membership",
  "Complete discharge summary", "Reconcile theatre stock", "Sign off theatre register",
  "Follow up rejected claim", "Chase pathology result", "Update patient contact details",
  "Approve refund request", "Reconcile bank statement", "Retry failed integration message",
  "Reply to patient enquiry", "Complete audit finding", "Escalate case to case manager",
  "Verify COID form completeness", "Print discharge documents", "Prepare ward hand-over",
  "Update bed board", "Configure new medical scheme rule", "Approve document upload",
  "Investigate dead-letter message",
];

export const MOCK_TASKS: TaskItem[] = TASKS.map((t, i) => ({
  id: `TASK-${5100 + i}`,
  title: t,
  patient: i % 3 === 0 ? undefined : `P-${10240 + (i % 20)}`,
  module: ["Admissions", "Billing", "Documents", "Integrations", "Case Management", "Pharmacy"][i % 6],
  priority: (["Low", "Medium", "High", "Urgent"] as const)[i % 4],
  dueAt: new Date(Date.now() + (i - 5) * 3600_000 * 4).toISOString(),
  assignedTo: "Dr. K. Naidoo",
  status: (["open", "in-progress", "done"] as const)[i % 3],
}));
