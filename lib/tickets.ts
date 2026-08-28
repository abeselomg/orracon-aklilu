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

export function formatTicketNumber(number: number): string {
  return String(number).padStart(4, "0");
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

export function todayInAddis(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date());
}
