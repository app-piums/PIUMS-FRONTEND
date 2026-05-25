/**
 * Cliente HTTP para comunicarse con notifications-service
 */

import { logger } from '../utils/logger';

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:4006';
const SERVICE_TOKEN = process.env.JWT_SECRET; // Usamos el mismo secret para inter-service communication

interface SendNotificationPayload {
  userId: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  emailTo?: string;
  emailSubject?: string;
  emailHtml?: string;
  phoneNumber?: string;
}

interface SendFromTemplatePayload {
  userId: string;
  templateKey: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  variables: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface BatchSendPayload {
  userIds: string[];
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
}

export class NotificationsClient {
  private baseUrl: string;
  private serviceToken: string;

  constructor() {
    this.baseUrl = NOTIFICATIONS_SERVICE_URL;
    this.serviceToken = SERVICE_TOKEN || '';
  }

  /**
   * Enviar una notificación directa
   */
  async sendNotification(payload: SendNotificationPayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/send`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error enviando notificacion', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion con notifications-service', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  /**
   * Enviar notificación desde un template
   */
  async sendFromTemplate(payload: SendFromTemplatePayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/template`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error enviando desde template', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion con notifications-service', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  /**
   * Enviar notificación a múltiples usuarios
   */
  async batchSend(payload: BatchSendPayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/batch`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error en batch send', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion con notifications-service', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  /**
   * Enviar email de confirmacion de entrega al cliente
   */
  async sendDeliveryConfirmationEmail(payload: {
    clientEmail: string;
    clientName: string;
    artistName: string;
    serviceName: string;
    bookingCode: string;
    confirmUrl: string;
    disputeUrl: string;
    autoReleaseTime: string;
    helpUrl: string;
  }): Promise<void> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET || '';
      const response = await fetch(`${this.baseUrl}/api/notifications/send-template-email`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify({
          to: payload.clientEmail,
          template: 'delivery-confirmation',
          variables: {
            ...payload,
            currentYear: new Date().getFullYear(),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error enviando email confirmacion entrega', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      }
    } catch (error) {
      logger.error('Error de conexion al enviar email confirmacion entrega', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
    }
  }

  private async postInternalEmail(path: string, payload: Record<string, any>): Promise<void> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET || '';
      const response = await fetch(`${this.baseUrl}${path}`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error(`Error en ${path}`, 'NOTIFICATIONS_CLIENT', { error: typeof err === 'string' ? err : (err as any)?.message });
      }
    } catch (error) {
      logger.error(`Conexion fallida en ${path}`, 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
    }
  }

  async sendReminder7d(payload: Record<string, any>): Promise<void> {
    await this.postInternalEmail('/api/notifications/booking/reminder-7d', payload);
  }

  async sendReminder3d(payload: Record<string, any>): Promise<void> {
    await this.postInternalEmail('/api/notifications/booking/reminder-3d', payload);
  }

  async sendReminderSameDay(payload: Record<string, any>): Promise<void> {
    await this.postInternalEmail('/api/notifications/booking/reminder-same-day', payload);
  }

  async sendArtistReminder(payload: Record<string, any>, daysLabel: string): Promise<void> {
    await this.postInternalEmail('/api/notifications/booking/artist-reminder', { ...payload, daysLabel });
  }

  /**
   * Enviar email al artista cuando el cliente confirma la entrega
   */
  async sendDeliveryConfirmedArtistEmail(payload: {
    artistEmail: string;
    artistName: string;
    clientName: string;
    serviceName: string;
    bookingCode: string;
    dashboardUrl: string;
  }): Promise<void> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET || '';
      const response = await fetch(`${this.baseUrl}/api/notifications/booking/delivery-confirmed-artist`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        logger.error('Error enviando email artista delivery confirmed', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      }
    } catch (error) {
      logger.error('Error de conexion al enviar email artista delivery confirmed', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
    }
  }

  /**
   * Verificar si el servicio de notificaciones está disponible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(10_000),
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      logger.error('Notifications service no disponible', 'NOTIFICATIONS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return false;
    }
  }
}

// Instancia singleton
export const notificationsClient = new NotificationsClient();
