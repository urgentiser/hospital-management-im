export type CommandResult<T> = {
  data: T;
  correlationId: string;
  version?: string;
  emittedEvents?: string[];
  warnings?: string[];
};

export type VersionedCommand<TPayload> = {
  payload: TPayload;
  expectedVersion?: string;
  reason?: string;
};
