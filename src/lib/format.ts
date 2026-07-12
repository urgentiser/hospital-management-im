// South African formatting helpers used across the platform.
// Currency: ZAR. Dates: dd/MM/yyyy. Date-times: dd/MM/yyyy HH:mm.

const zarFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 2,
});

const zarCompact = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const numberFormatter = new Intl.NumberFormat("en-ZA");

export function formatZAR(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return zarFormatter.format(value);
}

export function formatZARCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return zarCompact.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return numberFormatter.format(value);
}

function toDate(input: Date | string | number | null | undefined): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateZA(input: Date | string | number | null | undefined): string {
  const d = toDate(input);
  return d ? dateFormatter.format(d) : "—";
}

export function formatDateTimeZA(input: Date | string | number | null | undefined): string {
  const d = toDate(input);
  return d ? dateTimeFormatter.format(d) : "—";
}

export function initialsOf(name: string, max = 2): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .slice(0, max)
    .join("");
}
