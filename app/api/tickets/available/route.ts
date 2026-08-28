import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTicketNumber } from "@/lib/tickets";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketNumber = parseTicketNumber(searchParams.get("number") ?? "");
  if (ticketNumber === undefined) {
    return NextResponse.json({ error: "Ticket number is not valid." }, { status: 400 });
  }

  const existing = await prisma.ticket.findUnique({
    where: { number: ticketNumber },
    select: { number: true },
  });

  return NextResponse.json({ taken: Boolean(existing) });
}
