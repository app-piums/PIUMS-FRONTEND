// NOTE: Estos enums no son exportados por el stub local de @prisma/client
// (cliente sin generar) y `prisma generate` no está disponible offline.
// Replican EXACTAMENTE (mismos nombres y valores) los enums definidos en
// prisma/schema.prisma, por lo que el comportamiento en runtime es idéntico
// al del cliente generado. Si el schema cambia, actualizar este archivo.

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  IN_PROGRESS: 'IN_PROGRESS',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  RESCHEDULED: 'RESCHEDULED',
  RESCHEDULE_PENDING_ARTIST: 'RESCHEDULE_PENDING_ARTIST',
  RESCHEDULE_PENDING_CLIENT: 'RESCHEDULE_PENDING_CLIENT',
  CANCELLED_CLIENT: 'CANCELLED_CLIENT',
  CANCELLED_ARTIST: 'CANCELLED_ARTIST',
  REJECTED: 'REJECTED',
  NO_SHOW: 'NO_SHOW',
  DISPUTE_OPEN: 'DISPUTE_OPEN',
  DISPUTE_RESOLVED: 'DISPUTE_RESOLVED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const RescheduleStatus = {
  PENDING_ARTIST: 'PENDING_ARTIST',
  PENDING_CLIENT: 'PENDING_CLIENT',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type RescheduleStatus = (typeof RescheduleStatus)[keyof typeof RescheduleStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  CARD_AUTHORIZED: 'CARD_AUTHORIZED',
  ANTICIPO_PAID: 'ANTICIPO_PAID',
  DEPOSIT_PAID: 'DEPOSIT_PAID',
  FULLY_PAID: 'FULLY_PAID',
  CHARGING_REMAINING: 'CHARGING_REMAINING',
  FROZEN: 'FROZEN',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const EventStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const DisputeType = {
  CANCELLATION: 'CANCELLATION',
  QUALITY: 'QUALITY',
  REFUND: 'REFUND',
  NO_SHOW: 'NO_SHOW',
  ARTIST_NO_SHOW: 'ARTIST_NO_SHOW',
  PRICING: 'PRICING',
  BEHAVIOR: 'BEHAVIOR',
  OTHER: 'OTHER',
} as const;
export type DisputeType = (typeof DisputeType)[keyof typeof DisputeType];

export const DisputeStatus = {
  OPEN: 'OPEN',
  IN_REVIEW: 'IN_REVIEW',
  AWAITING_INFO: 'AWAITING_INFO',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  ESCALATED: 'ESCALATED',
} as const;
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const DisputeResolution = {
  FULL_REFUND: 'FULL_REFUND',
  PARTIAL_REFUND: 'PARTIAL_REFUND',
  NO_REFUND: 'NO_REFUND',
  CREDIT: 'CREDIT',
  WARNING: 'WARNING',
  SUSPENSION: 'SUSPENSION',
  BAN: 'BAN',
  NO_ACTION: 'NO_ACTION',
} as const;
export type DisputeResolution = (typeof DisputeResolution)[keyof typeof DisputeResolution];
