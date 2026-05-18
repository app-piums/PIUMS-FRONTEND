-- Add delivery confirmation fields to bookings table
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deliveryConfirmedAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deliveryConfirmedBy" TEXT;
