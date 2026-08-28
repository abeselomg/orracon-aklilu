import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isIsoDate, parseTicketNumber, serializeTicket } from "@/lib/tickets";

export const runtime = "nodejs";

type TicketContext = {
  params: Promise<{ number: string }>;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request, { params }: TicketContext) {
  const currentNumber = Number((await params).number);
  if (!Number.isInteger(currentNumber) || currentNumber < 1) {
    return NextResponse.json({ error: "Ticket number is not valid." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const date = asString(data.date);
  const driverName = asString(data.driverName);
  const plateNumber = asString(data.plateNumber);
  const type = asString(data.type);
  const origin = asString(data.origin);
  const destination = asString(data.destination);
  const amountRaw = asString(data.amountBirr);
  const numberRaw = typeof data.number === "number" ? String(data.number) : asString(data.number);

  if (!date || !driverName || !plateNumber || !type || !origin || !destination || !amountRaw || !numberRaw) {
    return NextResponse.json({ error: "Fill every field before saving." }, { status: 400 });
  }

  if (!isIsoDate(date)) {
    return NextResponse.json({ error: "Date is not valid." }, { status: 400 });
  }

  const nextNumber = parseTicketNumber(numberRaw);
  if (nextNumber === undefined) {
    return NextResponse.json({ error: "Ticket number must be a whole number of 1 or more." }, { status: 400 });
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a number greater than zero." }, { status: 400 });
  }

  const existing = await prisma.ticket.findUnique({ where: { number: currentNumber } });
  if (!existing) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  try {
    const ticket = await prisma.ticket.update({
      where: { number: currentNumber },
      data: {
        number: nextNumber,
        date,
        driverName,
        plateNumber,
        type,
        origin,
        destination,
        amountBirr: new Prisma.Decimal(amount.toFixed(2)),
      },
    });
    return NextResponse.json(serializeTicket(ticket));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That ticket number is already used." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Could not save ticket.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
