import { calendar_v3 } from '@googleapis/calendar';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
}

export class GoogleCalendarService {
  async createEvent(userId: string, event: CalendarEventInput): Promise<string | null> {
    const auth = await this.getClient(userId);
    if (!auth) return null;
    try {
      const cal = new calendar_v3.Calendar({ auth });
      const res = await cal.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: { dateTime: event.startDateTime, timeZone: 'America/Guatemala' },
          end: { dateTime: event.endDateTime, timeZone: 'America/Guatemala' },
        },
      });
      logger.info('Calendar event created', 'GOOGLE_CALENDAR', { userId, eventId: res.data.id });
      return res.data.id || null;
    } catch (err: any) {
      logger.error(`Error creating calendar event: ${err.message}`, 'GOOGLE_CALENDAR', { userId });
      return null;
    }
  }

  async updateEvent(userId: string, eventId: string, updates: Partial<CalendarEventInput>): Promise<void> {
    const auth = await this.getClient(userId);
    if (!auth) return;
    try {
      const cal = new calendar_v3.Calendar({ auth });
      const patch: calendar_v3.Schema$Event = {};
      if (updates.summary) patch.summary = updates.summary;
      if (updates.description) patch.description = updates.description;
      if (updates.location) patch.location = updates.location;
      if (updates.startDateTime) patch.start = { dateTime: updates.startDateTime, timeZone: 'America/Guatemala' };
      if (updates.endDateTime) patch.end = { dateTime: updates.endDateTime, timeZone: 'America/Guatemala' };
      await cal.events.patch({ calendarId: 'primary', eventId, requestBody: patch });
    } catch (err: any) {
      logger.error(`Error updating calendar event: ${err.message}`, 'GOOGLE_CALENDAR', { userId, eventId });
    }
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const auth = await this.getClient(userId);
    if (!auth) return;
    try {
      const cal = new calendar_v3.Calendar({ auth });
      await cal.events.delete({ calendarId: 'primary', eventId });
    } catch (err: any) {
      logger.error(`Error deleting calendar event: ${err.message}`, 'GOOGLE_CALENDAR', { userId, eventId });
    }
  }

  private async getClient(userId: string): Promise<OAuth2Client | null> {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleCalendarEnabled: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiresAt: true,
      } as any,
    });

    if (!(user as any)?.googleCalendarEnabled || !(user as any)?.googleRefreshToken) return null;

    const oAuth2 = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_CALLBACK_URL,
    );

    oAuth2.setCredentials({
      access_token: (user as any).googleAccessToken,
      refresh_token: (user as any).googleRefreshToken,
      expiry_date: (user as any).googleTokenExpiresAt
        ? new Date((user as any).googleTokenExpiresAt).getTime()
        : undefined,
    });

    // Persist refreshed access token automatically
    oAuth2.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            googleAccessToken: tokens.access_token,
            googleTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          } as any,
        });
      }
    });

    return oAuth2;
  }
}

export const googleCalendarService = new GoogleCalendarService();
