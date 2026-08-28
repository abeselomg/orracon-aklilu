-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('unclaimed', 'claimed');

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "amountBirr" DECIMAL(12,2) NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'unclaimed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_number_key" ON "Ticket"("number");
