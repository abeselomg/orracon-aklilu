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

  const claimed = await prisma.$transaction(async (tx) => {
    const result = await tx.ticket.updateMany({
      where: { number, status: "unclaimed" },
      data: { status: "claimed", claimedAt: new Date() },
    });

    if (result.count === 0) {
      return null;
    }

    return tx.ticket.findUnique({ where: { number } });
  });

  if (!claimed) {
    const existing = await prisma.ticket.findUnique({ where: { number } });
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "This ticket is already claimed." }, { status: 409 });
  }

  return NextResponse.json(serializeTicket(claimed));
}
