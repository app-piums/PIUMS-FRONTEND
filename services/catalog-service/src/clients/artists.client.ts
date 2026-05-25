import { logger } from '../utils/logger';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';

export class ArtistsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ARTISTS_SERVICE_URL;
  }

  private getInternalSecret(): string {
    return process.env.INTERNAL_SERVICE_SECRET || '';
  }

  async searchArtists(params: {
    category?: string;
    lat?: number;
    lng?: number;
    limit?: number;
  }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params.category) query.set('category', params.category);
      if (params.lat !== undefined) query.set('lat', String(params.lat));
      if (params.lng !== undefined) query.set('lng', String(params.lng));
      query.set('limit', String(params.limit ?? 100));

      const response = await fetch(`${this.baseUrl}/artists/search?${query}`, {
        headers: { 'x-internal-secret': this.getInternalSecret() },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return [];
      const data = await response.json() as any;
      return (data as any).artists ?? [];
    } catch (error: any) {
      logger.error('Error buscando artistas para matching', 'ARTISTS_CLIENT', { error: error.message });
      return [];
    }
  }

  // Returns true if available (fail-open: if endpoint unreachable → include artist)
  async checkAvailabilityDate(artistAuthId: string, isoDate: string): Promise<boolean> {
    try {
      const startAt = `${isoDate}T00:00:00.000Z`;
      const endAt = `${isoDate}T23:59:59.000Z`;
      const query = new URLSearchParams({ startAt, endAt });
      const response = await fetch(
        `${this.baseUrl}/artists/internal/by-auth/${artistAuthId}/availability-check?${query}`,
        {
          headers: { 'x-internal-secret': this.getInternalSecret() },
          signal: AbortSignal.timeout(3000),
        }
      );
      if (!response.ok) return true;
      const data = await response.json() as any;
      return (data as any).available !== false;
    } catch {
      return true; // fail open — no excluir artistas por timeout
    }
  }

  async getArtistIdByAuthId(authId: string): Promise<string | null> {
    const artist = await this.getArtist(authId);
    return artist?.id ?? null;
  }

  // artistId here is always the auth user ID (from booking/posting/application)
  async getArtist(authId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/artists/internal/by-auth/${authId}`, {
        headers: { 'x-internal-secret': this.getInternalSecret() },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return null;
      const data = await response.json();
      // Normalize fields: internal endpoint returns { id, authId, artistName, avatar, nombre?, email?, category? }
      // Provide aliases expected by posting.service.ts
      if (!data || data.error) return null;
      return {
        ...data,
        displayName: data.artistName || data.nombre || null,
        nombre: data.nombre || data.artistName || null,
        profileImageUrl: data.avatar || null,
        imagenPerfil: data.avatar || null,
        categoria: data.category || null,
      };
    } catch (error: any) {
      logger.error('Error calling artists-service', 'ARTISTS_CLIENT', { error: error.message, authId });
      return null;
    }
  }
}

export const artistsClient = new ArtistsClient();
