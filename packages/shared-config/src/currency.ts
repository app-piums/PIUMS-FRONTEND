// ============================================================================
// @piums/shared-config — Currency & locale configuration
// ============================================================================

export const CURRENCY = {
  CODE: 'USD',
  SYMBOL: '$',
  LOCALE: 'en-US',
  TIMEZONE: 'America/Guatemala',
  DECIMAL_SEPARATOR: '.',
  THOUSANDS_SEPARATOR: ',',
  // NOTE: Actual platform fee is set via PLATFORM_FEE_PERCENTAGE env var in payments-service (production: 18%)
  PLATFORM_FEE_PERCENT: 18,
  MIN_BOOKING_AMOUNT: 1000, // $10.00 in cents
} as const;

export const LOCALE = {
  LANGUAGE: 'es',
  REGION: 'GT',
  FULL: 'es-GT',
  TIMEZONE: 'America/Guatemala',
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
} as const;
