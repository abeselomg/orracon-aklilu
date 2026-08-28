import type { Ticket } from "@prisma/client";

export type TicketStatus = "unclaimed" | "claimed";

export type TicketDTO = {
  id: string;
  number: number;
  numberLabel: string;
  date: string;
  driverName: string;
  plateNumber: string;
  type: string;
  origin: string;
  destination: string;
  amountBirr: string;
  status: TicketStatus;
  createdAt: string;
  claimedAt: string | null;
};

export function formatAmount(value: string | number): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatTicketNumber(number: number): string {
  return String(number).padStart(5, "0");
}

export function parseTicketNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const number = Number(trimmed);
  if (!Number.isInteger(number) || number < 1) return undefined;
  return number;
}

export function serializeTicket(ticket: Ticket): TicketDTO {
  return {
    id: ticket.id,
    number: ticket.number,
    numberLabel: formatTicketNumber(ticket.number),
    date: ticket.date,
    driverName: ticket.driverName,
    plateNumber: ticket.plateNumber,
    type: ticket.type,
    origin: ticket.origin,
    destination: ticket.destination,
    amountBirr: ticket.amountBirr.toFixed(2),
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    claimedAt: ticket.claimedAt?.toISOString() ?? null,
  };
}

export function formatPaidAt(iso: string | null): string {
  if (!iso) return "—";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export function todayInAddis(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date());
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

export function parseIsoDate(value: string): Date | undefined {
  if (!isIsoDate(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfWeekToDate(today = todayInAddis()): { from: string; to: string } {
  const [year, month, day] = today.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const weekday = new Date(utc).getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const fromUtc = utc - daysFromMonday * 24 * 60 * 60 * 1000;
  return { from: new Date(fromUtc).toISOString().slice(0, 10), to: today };
}
