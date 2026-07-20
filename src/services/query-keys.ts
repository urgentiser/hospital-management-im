export const queryKeys = {
  patients: (filters?: unknown) => ["patients", filters] as const,
  patient: (patientId: string) => ["patients", patientId] as const,
  admissions: (filters?: unknown) => ["admissions", filters] as const,
  admission: (admissionId: string) => ["admissions", admissionId] as const,
  integrationMessages: (filters?: unknown) => ["integration-messages", filters] as const,
  integrationMessage: (messageId: string) => ["integration-messages", messageId] as const,
  audit: (filters?: unknown) => ["audit", filters] as const,
  connectedApplications: ["connected-applications"] as const,
};
