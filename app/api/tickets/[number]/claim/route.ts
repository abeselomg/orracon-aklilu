import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTicket } from "@/lib/tickets";

export const runtime = "nodejs";

type ClaimContext = {
  params: Promise<{ number: string }>;
};

export async function POST(_request: Request, { params }: ClaimContext) {
  const raw = (await params).number;
  const number = Number(raw);

  if (!Number.isInteger(number) || number < 1) {
    return NextResponse.json({ error: "Ticket number is not valid." }, { status: 400 });
  }

  const result = await prisma.ticket.updateMany({
    where: { number, status: "unclaimed" },
    data: { status: "claimed", claimedAt: new Date() },
  });

  if (result.count === 0) {
    const existing = await prisma.ticket.findUnique({ where: { number } });
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "This ticket is already paid." }, { status: 409 });
  }

  const claimed = await prisma.ticket.findUnique({ where: { number } });
  if (!claimed) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  return NextResponse.json(serializeTicket(claimed));
}
