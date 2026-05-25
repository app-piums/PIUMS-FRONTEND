/**
 * Cliente HTTP para comunicarse con notifications-service
 */

import jwt from "jsonwebtoken";
import { logger } from '../utils/logger';

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:4006';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-not-for-production';

const generateServiceToken = (userId: string): string => {
  return jwt.sign({ userId, email: 'service@internal', isService: true }, JWT_SECRET, { expiresIn: '5m' });
};

interface SendNotificationPayload {
  userId: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export class NotificationsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = NOTIFICATIONS_SERVICE_URL;
  }

  /**
   * Enviar una notificación
   */
  async sendNotification(payload: SendNotificationPayload): Promise<any | null> {
    try {
      const serviceToken = generateServiceToken(payload.userId);
      
      const response = await fetch(`${this.baseUrl}/api/notifications/send`, {
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceToken}`,
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
}

export const notificationsClient = new NotificationsClient();
