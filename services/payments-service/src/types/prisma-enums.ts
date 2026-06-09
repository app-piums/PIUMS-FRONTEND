// NOTE: Estos enums no son exportados por el stub local de @prisma/client
// (cliente sin generar) y `prisma generate` no está disponible offline.
// Replican EXACTAMENTE (mismos nombres y valores) los enums definidos en
// prisma/schema.prisma, por lo que el comportamiento en runtime es idéntico
// al del cliente generado. Si el schema cambia, actualizar este archivo.

export const PaymentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  FULLY_REFUNDED: 'FULLY_REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentType = {
  DEPOSIT: 'DEPOSIT',
  FULL_PAYMENT: 'FULL_PAYMENT',
  REMAINING: 'REMAINING',
  REFUND: 'REFUND',
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const PaymentIntentStatus = {
  CREATED: 'CREATED',
  REQUIRES_ACTION: 'REQUIRES_ACTION',
  REQUIRES_CAPTURE: 'REQUIRES_CAPTURE',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;
export type PaymentIntentStatus = (typeof PaymentIntentStatus)[keyof typeof PaymentIntentStatus];

export const RefundStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus];

export const PayoutStatus = {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  PROCESSING: 'PROCESSING',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REVERSED: 'REVERSED',
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export const PayoutType = {
  BOOKING_PAYMENT: 'BOOKING_PAYMENT',
  MANUAL: 'MANUAL',
  ADJUSTMENT: 'ADJUSTMENT',
  BONUS: 'BONUS',
  REFUND_REVERSAL: 'REFUND_REVERSAL',
} as const;
export type PayoutType = (typeof PayoutType)[keyof typeof PayoutType];

export const CreditStatus = {
  ACTIVE: 'ACTIVE',
  USED: 'USED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type CreditStatus = (typeof CreditStatus)[keyof typeof CreditStatus];
