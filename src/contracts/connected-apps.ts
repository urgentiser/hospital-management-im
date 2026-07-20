export type ConnectedApplicationOpenMode = "same-tab" | "new-tab";

export type ConnectedApplication = {
  key: string;
  name: string;
  description: string;
  url: string;
  requiredPermission: string;
  facilityScoped: boolean;
  openMode: ConnectedApplicationOpenMode;
  healthUrl?: string;
  category: "catalogue" | "multitouch" | "support";
};
