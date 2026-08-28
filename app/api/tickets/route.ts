import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTicket } from "@/lib/tickets";

export const runtime = "nodejs";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim() ?? "";

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(status === "unclaimed" || status === "claimed" ? { status } : {}),
      ...(q
        ? {
            OR: [
              { driverName: { contains: q, mode: "insensitive" } },
              { plateNumber: { contains: q, mode: "insensitive" } },
              ...(Number.isFinite(Number(q)) ? [{ number: Number(q) }] : []),
            ],
          }
        : {}),
    },
    orderBy: { number: "desc" },
  });

  const [total, claimedCount] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "claimed" } }),
  ]);

  return NextResponse.json({
    tickets: tickets.map(serializeTicket),
    counts: {
      total,
      claimed: claimedCount,
      unclaimed: total - claimedCount,
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

  if (!date || !driverName || !plateNumber || !type || !origin || !destination || !amountRaw) {
    return NextResponse.json({ error: "Fill every field before generating a ticket." }, { status: 400 });
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a number greater than zero." }, { status: 400 });
  }

  const ticket = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(917431)`;
    const last = await tx.ticket.aggregate({ _max: { number: true } });
    const next = (last._max.number ?? 0) + 1;

    return tx.ticket.create({
      data: {
        number: next,
        date,
        driverName,
        plateNumber,
        type,
        origin,
        destination,
        amountBirr: new Prisma.Decimal(amount.toFixed(2)),
      },
    });
  });

  return NextResponse.json(serializeTicket(ticket), { status: 201 });
}
