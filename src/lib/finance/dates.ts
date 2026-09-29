/**
 * Datas de calendário ficam ancoradas em UTC (meio-dia).
 * Assim 01/10/2026 continua 01/10 tanto no navegador (Brasília, UTC−3)
 * quanto no servidor, sem cair no dia anterior.
 * "Hoje" e o mês corrente seguem o fuso de Brasília.
 */

export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

export function businessCalendarParts(date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: read("year"), month: read("month"), day: read("day") };
}

export function todayDateInputValue(date = new Date()): string {
  const { year, month, day } = businessCalendarParts(date);
  return `${formatYearMonth(year, month)}-${String(day).padStart(2, "0")}`;
}

export function parseYearMonth(value: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    const today = businessCalendarParts();
    return { year: today.year, month: today.month };
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getMonthRange(year: number, month: number): {
  start: Date;
  end: Date;
} {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

export function startOfCalendarDay(value: string): Date {
  const [year, month, day] = calendarNumbers(value);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function endOfCalendarDay(value: string): Date {
  const [year, month, day] = calendarNumbers(value);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}

export function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + months + 1, 0)).getUTCDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(Date.UTC(year, month + months, safeDay, 12, 0, 0, 0));
}

export function clampDayOfMonth(year: number, month: number, day: number): Date {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const safeDay = Math.min(Math.max(day, 1), lastDay);
  return new Date(Date.UTC(year, month - 1, safeDay, 12, 0, 0, 0));
}

/** Dia de vencimento no mês seguinte à data do lançamento, no calendário de Brasília. */
export function nextMonthDueDate(from: Date, dueDay: number): Date {
  const current = businessCalendarParts(from);
  const next = shiftYearMonth(current.year, current.month, 1);
  return clampDayOfMonth(next.year, next.month, dueDay);
}

export function toDateOnlyString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toUtcTimestampString(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${toDateOnlyString(date)} ${hours}:${minutes}:${seconds}`;
}

/** Lê o dia civil devolvido pelo banco, seja string ou Date. */
export function calendarDateFromDriver(value: unknown): Date {
  if (value instanceof Date) {
    return parseDateOnly(toDateOnlyString(value));
  }

  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value).trim());
  if (!match) return new Date(NaN);
  return parseDateOnly(match[1]);
}

/** Intervalo do mês atual em YYYY-MM-DD (útil como filtro padrão). */
export function getCurrentMonthDateFilters(): { from: string; to: string } {
  const today = businessCalendarParts();
  const { start, end } = getMonthRange(today.year, today.month);
  return {
    from: toDateOnlyString(start),
    to: toDateOnlyString(end),
  };
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = calendarNumbers(value);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function shiftYearMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1, 12));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function formatMonthLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1, 12));
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatCalendarDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
): string {
  return new Intl.DateTimeFormat("pt-BR", {
    ...options,
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTimeInBrazil(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUSINESS_TIME_ZONE,
  }).format(date);
}

export function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function calendarNumbers(value: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return [NaN, NaN, NaN];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}
