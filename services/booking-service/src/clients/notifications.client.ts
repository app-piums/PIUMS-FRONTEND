/**
 * Cliente HTTP para comunicarse con notifications-service
 */

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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[NotificationsClient] Error enviando notificación:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[NotificationsClient] Error de conexión con notifications-service:', error);
      return null;
    }
  }

  /**
   * Enviar notificación desde un template
   */
  async sendFromTemplate(payload: SendFromTemplatePayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[NotificationsClient] Error enviando desde template:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[NotificationsClient] Error de conexión con notifications-service:', error);
      return null;
    }
  }

  /**
   * Enviar notificación a múltiples usuarios
   */
  async batchSend(payload: BatchSendPayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[NotificationsClient] Error en batch send:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[NotificationsClient] Error de conexión con notifications-service:', error);
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
        console.error('[NotificationsClient] Error enviando email confirmacion entrega:', error);
      }
    } catch (error) {
      console.error('[NotificationsClient] Error de conexion al enviar email confirmacion entrega:', error);
    }
  }

  private async postInternalEmail(path: string, payload: Record<string, any>): Promise<void> {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET || '';
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error(`[NotificationsClient] Error en ${path}:`, err);
      }
    } catch (error) {
      console.error(`[NotificationsClient] Conexion fallida en ${path}:`, error);
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('[NotificationsClient] Error enviando email artista delivery confirmed:', error);
      }
    } catch (error) {
      console.error('[NotificationsClient] Error de conexion al enviar email artista delivery confirmed:', error);
    }
  }

  /**
   * Verificar si el servicio de notificaciones está disponible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('[NotificationsClient] Notifications service no disponible:', error);
      return false;
    }
  }
}

// Instancia singleton
export const notificationsClient = new NotificationsClient();
