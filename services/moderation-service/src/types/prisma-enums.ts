// NOTE: Estos enums no son exportados por el stub local de @prisma/client
// (cliente sin generar) y `prisma generate` no está disponible offline.
// Replican EXACTAMENTE (mismos nombres y valores) los enums definidos en
// prisma/schema.prisma, por lo que el comportamiento en runtime es idéntico
// al del cliente generado. Si el schema cambia, actualizar este archivo.

export const Severity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const ModerationAction = {
  ALLOW: 'ALLOW',
  CENSOR: 'CENSOR',
  REJECT: 'REJECT',
  STRIKE: 'STRIKE',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  SHADOW_BAN: 'SHADOW_BAN',
} as const;
export type ModerationAction = (typeof ModerationAction)[keyof typeof ModerationAction];

export const ContentType = {
  MESSAGE: 'MESSAGE',
  REVIEW: 'REVIEW',
  REVIEW_RESPONSE: 'REVIEW_RESPONSE',
  USER_BIO: 'USER_BIO',
  ARTIST_BIO: 'ARTIST_BIO',
  EVENT_DESCRIPTION: 'EVENT_DESCRIPTION',
  BOOKING_NOTE: 'BOOKING_NOTE',
  USERNAME: 'USERNAME',
} as const;
export type ContentType = (typeof ContentType)[keyof typeof ContentType];
