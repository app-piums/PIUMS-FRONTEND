import { logger } from '../utils/logger';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';

export class ArtistsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ARTISTS_SERVICE_URL;
  }

  async getArtist(artistId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/artists/${artistId}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data?.artist ?? data ?? null;
    } catch (error: any) {
      logger.error('Error calling artists-service', 'ARTISTS_CLIENT', { error: error.message, artistId });
      return null;
    }
  }
}

export const artistsClient = new ArtistsClient();
