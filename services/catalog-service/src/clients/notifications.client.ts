import jwt from 'jsonwebtoken';

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:4006';
const JWT_SECRET = process.env.JWT_SECRET || (() => { if (process.env.NODE_ENV === 'production') { throw new Error('JWT_SECRET es obligatorio en produccion'); } return 'dev-only-secret-not-for-production'; })();

// El notif-service valida un JWT firmado (jwt.verify). Antes se enviaba el
// secreto crudo como Bearer, que NO es un JWT válido → 401 silencioso.
function getServiceToken(): string {
  return jwt.sign(
    { id: 'catalog-service', email: 'catalog@internal', role: 'service' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

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
}

export class NotificationsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = NOTIFICATIONS_SERVICE_URL;
  }

  async sendNotification(payload: SendNotificationPayload): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getServiceToken()}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async sendBoth(inApp: SendNotificationPayload, emailPayload?: Omit<SendNotificationPayload, 'channel'> & { emailTo: string }): Promise<void> {
    const tasks: Promise<any>[] = [this.sendNotification(inApp)];
    if (emailPayload) {
      tasks.push(this.sendNotification({ ...emailPayload, channel: 'EMAIL' }));
    }
    await Promise.allSettled(tasks);
  }

  // Send IN_APP + PUSH to a list of userIds in batches of 20
  async batchNotify(userIds: string[], payload: Omit<SendNotificationPayload, 'userId' | 'channel'>): Promise<void> {
    if (userIds.length === 0) return;
    const CHUNK = 20;
    for (let i = 0; i < userIds.length; i += CHUNK) {
      const chunk = userIds.slice(i, i + CHUNK);
      await Promise.allSettled(
        chunk.flatMap(userId => [
          this.sendNotification({ ...payload, userId, channel: 'IN_APP' }),
          this.sendNotification({ ...payload, userId, channel: 'PUSH' }),
        ])
      );
    }
  }
}

export const notificationsClient = new NotificationsClient();
