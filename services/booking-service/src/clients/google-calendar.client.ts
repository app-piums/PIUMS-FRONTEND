import { logger } from '../utils/logger';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';

export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
}

class GoogleCalendarClient {
  private readonly secret = process.env.INTERNAL_SERVICE_SECRET || '';

  private headers() {
    return { 'Content-Type': 'application/json', 'x-internal-secret': this.secret };
  }

  async createEvent(userId: string, event: CalendarEventInput): Promise<string | null> {
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/internal/calendar/event`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ userId, event }),
      });
      if (!res.ok) return null;
      const data = await res.json() as any;
      return data.eventId || null;
    } catch {
      return null;
    }
  }

  async updateEvent(userId: string, eventId: string, updates: Partial<CalendarEventInput>): Promise<void> {
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/internal/calendar/event/${eventId}`, {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({ userId, updates }),
      });
      if (!res.ok) {
        logger.warn(`Calendar updateEvent failed: ${res.status}`, 'CALENDAR_CLIENT', { eventId });
      }
    } catch {
      // Calendar sync is best-effort
    }
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/internal/calendar/event/${eventId}`, {
        method: 'DELETE',
        headers: this.headers(),
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        logger.warn(`Calendar deleteEvent failed: ${res.status}`, 'CALENDAR_CLIENT', { eventId });
      }
    } catch {
      // Calendar sync is best-effort
    }
  }
}

export const googleCalendarClient = new GoogleCalendarClient();
