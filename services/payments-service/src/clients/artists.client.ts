/**
 * Cliente HTTP para comunicarse con artists-service
 */

import { logger } from '../utils/logger';

const ARTISTS_SERVICE_URL =
  process.env.ARTISTS_SERVICE_URL || "http://artists-service:4003";
const SERVICE_TOKEN = process.env.JWT_SECRET;

export class ArtistsClient {
  private baseUrl: string;
  private serviceToken: string;

  constructor() {
    this.baseUrl = ARTISTS_SERVICE_URL;
    this.serviceToken = SERVICE_TOKEN || "";
  }

  /**
   * Obtener información de un artista
   */
  async getArtist(artistId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/artists/${artistId}`, {
        signal: AbortSignal.timeout(10_000),
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.serviceToken}`,
        },
      });

      if (!response.ok) {
        logger.error('Error obteniendo artista', 'ARTISTS_CLIENT', { error: await response.text() });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error de conexion con artists-service', 'ARTISTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  /**
   * Obtener cuenta de Stripe Connect del artista
   */
  async getStripeConnectAccount(artistId: string): Promise<{
    stripeAccountId: string | null;
    isConnected: boolean;
    canReceivePayouts: boolean;
  } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/artists/${artistId}/stripe-account`,
        {
          signal: AbortSignal.timeout(10_000),
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.serviceToken}`,
          },
        }
      );

      if (!response.ok) {
        logger.error('Error obteniendo cuenta Stripe', 'ARTISTS_CLIENT', { error: await response.text() });
        return null;
      }

      return (await response.json()) as {
        stripeAccountId: string | null;
        isConnected: boolean;
        canReceivePayouts: boolean;
      };
    } catch (error) {
      logger.error('Error de conexion con artists-service', 'ARTISTS_CLIENT', { error: typeof error === 'string' ? error : (error as any)?.message });
      return null;
    }
  }

  /**
   * Validar que el artista existe y está activo
   */
  async validateArtist(artistId: string): Promise<boolean> {
    const artist = await this.getArtist(artistId);
    return artist !== null && artist.active === true;
  }
}

// Exportar instancia singleton
export const artistsClient = new ArtistsClient();
