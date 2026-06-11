// NOTE: Estos enums no son exportados por el stub local de @prisma/client
// (cliente sin generar) y `prisma generate` no está disponible offline.
// Replican EXACTAMENTE (mismos nombres y valores) los enums definidos en
// prisma/schema.prisma, por lo que el comportamiento en runtime es idéntico
// al del cliente generado. Si el schema cambia, actualizar este archivo.

export const PricingType = {
  FIXED: 'FIXED',
  HOURLY: 'HOURLY',
  PER_SESSION: 'PER_SESSION',
  CUSTOM: 'CUSTOM',
} as const;
export type PricingType = (typeof PricingType)[keyof typeof PricingType];

export const PricingModel = {
  FIXED: 'FIXED',
  BASE_PLUS_HOURLY: 'BASE_PLUS_HOURLY',
  PACKAGE: 'PACKAGE',
} as const;
export type PricingModel = (typeof PricingModel)[keyof typeof PricingModel];

export const ServiceStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

export const MediaType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  DOCUMENT: 'DOCUMENT',
  OTHER: 'OTHER',
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const MediaEntityType = {
  ARTIST: 'ARTIST',
  SERVICE: 'SERVICE',
  BOOKING: 'BOOKING',
  REVIEW: 'REVIEW',
  DISPUTE: 'DISPUTE',
  PROFILE: 'PROFILE',
  CATEGORY: 'CATEGORY',
  CERTIFICATION: 'CERTIFICATION',
  OTHER: 'OTHER',
} as const;
export type MediaEntityType = (typeof MediaEntityType)[keyof typeof MediaEntityType];

export const MediaStatus = {
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  FAILED: 'FAILED',
  DELETED: 'DELETED',
} as const;
export type MediaStatus = (typeof MediaStatus)[keyof typeof MediaStatus];
