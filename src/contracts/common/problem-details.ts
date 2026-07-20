export type ApiProblemDetails = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
  errors?: Record<string, string[]>;
};

export class ApiProblemError extends Error {
  constructor(public readonly problem: ApiProblemDetails) {
    super(problem.detail || problem.title);
    this.name = "ApiProblemError";
  }
}
