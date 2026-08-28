import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isIsoDate, parseTicketNumber, startOfWeekToDate, todayInAddis, serializeTicket } from "@/lib/tickets";

export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function dateRangeWhere(preset: string | null, fromRaw: string, toRaw: string): Prisma.TicketWhereInput {
  if (preset === "daily") {
    const today = todayInAddis();
    return { date: today };
  }

  if (preset === "weekly") {
    const { from, to } = startOfWeekToDate();
    return { date: { gte: from, lte: to } };
  }

  if (preset === "custom" && isIsoDate(fromRaw) && isIsoDate(toRaw)) {
    const from = fromRaw <= toRaw ? fromRaw : toRaw;
    const to = fromRaw <= toRaw ? toRaw : fromRaw;
    return { date: { gte: from, lte: to } };
  }

  return {};
}

function ticketWhere(
  status: string | null,
  q: string,
  dateFilter: Prisma.TicketWhereInput,
): Prisma.TicketWhereInput {
  return {
    ...dateFilter,
    ...(status === "unclaimed" || status === "claimed" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { plateNumber: { contains: q, mode: "insensitive" } },
            ...(Number.isFinite(Number(q)) ? [{ number: Number(q) }] : []),
          ],
        }
      : {}),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim() ?? "";
  const datePreset = searchParams.get("date");
  const from = searchParams.get("from")?.trim() ?? "";
  const to = searchParams.get("to")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE),
  );
  const where = ticketWhere(status, q, dateRangeWhere(datePreset, from, to));

  const [tickets, matched, claimedCount, claimedSum, unclaimedSum, nextNumberRow] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { number: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.count({ where: { ...where, status: "claimed" } }),
    prisma.ticket.aggregate({
      where: { ...where, status: "claimed" },
      _sum: { amountBirr: true },
    }),
    prisma.ticket.aggregate({
      where: { ...where, status: "unclaimed" },
      _sum: { amountBirr: true },
    }),
    prisma.ticket.aggregate({ _max: { number: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(matched / pageSize));

  return NextResponse.json({
    tickets: tickets.map(serializeTicket),
    nextNumber: (nextNumberRow._max.number ?? 0) + 1,
    counts: {
      total: matched,
      claimed: claimedCount,
      unclaimed: matched - claimedCount,
      claimedAmount: (claimedSum._sum.amountBirr ?? new Prisma.Decimal(0)).toFixed(2),
      unclaimedAmount: (unclaimedSum._sum.amountBirr ?? new Prisma.Decimal(0)).toFixed(2),
    },
    pagination: {
      page,
      pageSize,
      matched,
      pageCount,
    },
  });
}

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "Fill every field before generating a ticket." }, { status: 400 });
  }

  const ticketNumber = parseTicketNumber(numberRaw);
  if (ticketNumber === undefined) {
    return NextResponse.json({ error: "Ticket number must be a whole number of 1 or more." }, { status: 400 });
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a number greater than zero." }, { status: 400 });
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        number: ticketNumber,
        date,
        driverName,
        plateNumber,
        type,
        origin,
        destination,
        amountBirr: new Prisma.Decimal(amount.toFixed(2)),
      },
    });
    const next = await prisma.ticket.aggregate({ _max: { number: true } });
    return NextResponse.json(
      { ...serializeTicket(ticket), nextNumber: (next._max.number ?? ticketNumber) + 1 },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That ticket number is already used." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Could not generate ticket.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
