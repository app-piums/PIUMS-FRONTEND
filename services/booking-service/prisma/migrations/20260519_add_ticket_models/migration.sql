-- CreateEnum: TicketEventStatus
CREATE TYPE "TicketEventStatus" AS ENUM ('BORRADOR', 'PUBLICADO', 'AGOTADO', 'CANCELADO', 'FINALIZADO');

-- CreateEnum: TicketPurchaseStatus
CREATE TYPE "TicketPurchaseStatus" AS ENUM ('PENDIENTE', 'PAGADO', 'USADO', 'REEMBOLSADO', 'EXPIRADO');

-- CreateTable: ticket_events
CREATE TABLE "ticket_events" (
    "id"          TEXT NOT NULL,
    "code"        TEXT NOT NULL,
    "artistId"    TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "venue"       TEXT NOT NULL,
    "address"     TEXT NOT NULL,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "eventDate"   TIMESTAMP(3) NOT NULL,
    "doorsOpen"   TIMESTAMP(3),
    "imageUrl"    TEXT,
    "maxCapacity" INTEGER NOT NULL,
    "status"      "TicketEventStatus" NOT NULL DEFAULT 'BORRADOR',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ticket_events_code_key" ON "ticket_events"("code");
CREATE INDEX "ticket_events_artistId_idx" ON "ticket_events"("artistId");
CREATE INDEX "ticket_events_status_idx" ON "ticket_events"("status");
CREATE INDEX "ticket_events_eventDate_idx" ON "ticket_events"("eventDate");

-- CreateTable: ticket_tiers
CREATE TABLE "ticket_tiers" (
    "id"            TEXT NOT NULL,
    "ticketEventId" TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "description"   TEXT,
    "priceCents"    INTEGER NOT NULL,
    "currency"      TEXT NOT NULL DEFAULT 'USD',
    "totalQty"      INTEGER NOT NULL,
    "soldQty"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_tiers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ticket_tiers_ticketEventId_fkey"
        FOREIGN KEY ("ticketEventId") REFERENCES "ticket_events"("id") ON DELETE CASCADE
);
CREATE INDEX "ticket_tiers_ticketEventId_idx" ON "ticket_tiers"("ticketEventId");

-- CreateTable: ticket_purchases
CREATE TABLE "ticket_purchases" (
    "id"            TEXT NOT NULL,
    "code"          TEXT NOT NULL,
    "ticketEventId" TEXT NOT NULL,
    "tierId"        TEXT NOT NULL,
    "buyerId"       TEXT NOT NULL,
    "buyerEmail"    TEXT NOT NULL,
    "buyerName"     TEXT NOT NULL,
    "quantity"      INTEGER NOT NULL DEFAULT 1,
    "subtotalCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents"    INTEGER NOT NULL,
    "currency"      TEXT NOT NULL DEFAULT 'USD',
    "couponCode"    TEXT,
    "couponId"      TEXT,
    "status"        "TicketPurchaseStatus" NOT NULL DEFAULT 'PENDIENTE',
    "orderNumber"   TEXT,
    "providerRef"   TEXT,
    "paidAt"        TIMESTAMP(3),
    "checkedInAt"   TIMESTAMP(3),
    "checkedInBy"   TEXT,
    "deletedAt"     TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_purchases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ticket_purchases_ticketEventId_fkey"
        FOREIGN KEY ("ticketEventId") REFERENCES "ticket_events"("id"),
    CONSTRAINT "ticket_purchases_tierId_fkey"
        FOREIGN KEY ("tierId") REFERENCES "ticket_tiers"("id")
);
CREATE UNIQUE INDEX "ticket_purchases_code_key" ON "ticket_purchases"("code");
CREATE UNIQUE INDEX "ticket_purchases_orderNumber_key" ON "ticket_purchases"("orderNumber");
CREATE INDEX "ticket_purchases_ticketEventId_idx" ON "ticket_purchases"("ticketEventId");
CREATE INDEX "ticket_purchases_tierId_idx" ON "ticket_purchases"("tierId");
CREATE INDEX "ticket_purchases_buyerId_idx" ON "ticket_purchases"("buyerId");
CREATE INDEX "ticket_purchases_status_idx" ON "ticket_purchases"("status");
