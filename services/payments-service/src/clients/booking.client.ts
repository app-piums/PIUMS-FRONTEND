import { logger } from '../utils/logger';

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || "http://booking-service:4008";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

const internalHeaders = {
  "Content-Type": "application/json",
  "x-internal-secret": INTERNAL_SECRET,
};

export class BookingClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BOOKING_SERVICE_URL;
  }

  async getBooking(bookingId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/bookings/internal/${bookingId}`,
        { headers: internalHeaders, signal: AbortSignal.timeout(10_000) }
      );
      if (!response.ok) {
        logger.error('Error obteniendo booking', 'BOOKING_CLIENT', { error: await response.text() });
        return null;
      }
      return await response.json();
    } catch (error) {
      logger.error('Error de conexion con booking-service', 'BOOKING_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  async markPayment(
    bookingId: string,
    amount: number,
    paymentMethod?: string,
    paymentIntentId?: string,
    paymentType?: "DEPOSIT" | "FULL_PAYMENT" | "REMAINING"
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/bookings/internal/${bookingId}/mark-payment`,
        {
          signal: AbortSignal.timeout(10_000),
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ amount, paymentMethod, paymentIntentId, paymentType }),
        }
      );
      if (!response.ok) {
        logger.error('Error marcando pago', 'BOOKING_CLIENT', { error: await response.text() });
        return null;
      }
      return await response.json();
    } catch (error) {
      logger.error('Error de conexion con booking-service', 'BOOKING_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  async markCardAuthorized(bookingId: string, paymentIntentId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/bookings/internal/${bookingId}/mark-card-authorized`,
        {
          signal: AbortSignal.timeout(10_000),
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ paymentIntentId }),
        }
      );
      if (!response.ok) {
        logger.error('Error marcando CARD_AUTHORIZED', 'BOOKING_CLIENT', { error: await response.text() });
        return null;
      }
      return await response.json();
    } catch (error) {
      logger.error('Error de conexion con booking-service (markCardAuthorized)', 'BOOKING_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  async markTicketPayment(
    purchaseId: string,
    amount: number,
    paymentMethod?: string,
    paymentIntentId?: string,
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/ticket-purchases/internal/${purchaseId}/mark-payment`,
        {
          signal: AbortSignal.timeout(10_000),
          method: "POST",
          headers: internalHeaders,
          body: JSON.stringify({ amount, paymentMethod, paymentIntentId }),
        }
      );
      if (!response.ok) {
        logger.error('Error marcando pago de boleto', 'BOOKING_CLIENT', { error: await response.text() });
        return null;
      }
      return await response.json();
    } catch (error) {
      logger.error('Error de conexion al marcar pago de boleto', 'BOOKING_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }
}

export const bookingClient = new BookingClient();
