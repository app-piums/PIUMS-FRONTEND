import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { logger } from '../utils/logger';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryProvider {
  /**
   * Subir avatar a Cloudinary
   */
  async uploadAvatar(buffer: Buffer, userId: string): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'piums/avatars',
            public_id: `avatar_${userId}_${Date.now()}`,
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              logger.error('Error uploading to Cloudinary', 'CLOUDINARY_PROVIDER', error);
              reject(error);
            } else {
              logger.info('Avatar uploaded successfully', 'CLOUDINARY_PROVIDER', {
                userId,
                url: result?.secure_url,
              });
              resolve(result!.secure_url);
            }
          }
        );

        Readable.from(buffer).pipe(uploadStream);
      });
    } catch (error: any) {
      logger.error('Failed to upload avatar', 'CLOUDINARY_PROVIDER', error);
      throw new Error(`Error al subir avatar: ${error.message}`);
    }
  }

  /**
   * Eliminar avatar de Cloudinary
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      // Extraer public_id de la URL
      const urlParts = avatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const publicId = `piums/avatars/${fileName.split('.')[0]}`;

      await cloudinary.uploader.destroy(publicId);

      logger.info('Avatar deleted successfully', 'CLOUDINARY_PROVIDER', {
        publicId,
      });
    } catch (error: any) {
      logger.error('Failed to delete avatar', 'CLOUDINARY_PROVIDER', error);
      // No lanzar error, permitir que continúe aunque falle la eliminación
    }
  }

  /**
   * Subir avatar durante registro (sin userId aún) a piums/avatars/temp/
   */
  async uploadAvatarTemp(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'piums/avatars',
          public_id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            logger.error('Error uploading temp avatar to Cloudinary', 'CLOUDINARY_PROVIDER', error);
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  /**
   * Subir documento de identidad a Cloudinary (tipo 'authenticated' — acceso privado)
   */
  async uploadDocument(buffer: Buffer, folder: string): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `piums/documents/${folder}`,
            public_id: `doc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: 'authenticated',
            transformation: [
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              logger.error('Error uploading document to Cloudinary', 'CLOUDINARY_PROVIDER', error);
              reject(error);
            } else {
              resolve(result!.secure_url);
            }
          }
        );
        Readable.from(buffer).pipe(uploadStream);
      });
    } catch (error: any) {
      logger.error('Failed to upload document', 'CLOUDINARY_PROVIDER', error);
      throw new Error(`Error al subir documento: ${error.message}`);
    }
  }

  /**
   * Generar URL firmada con expiración de 1 hora para un documento privado (tipo authenticated)
   */
  getSignedDocumentUrl(storedUrl: string, expiresInSeconds = 3600): string {
    try {
      // Extract public_id from URL (works for both upload and authenticated types)
      const match = storedUrl.match(/piums\/documents\/[^?#]+/);
      if (!match) {
        logger.warn('Could not extract public_id for signing', 'CLOUDINARY_PROVIDER', { storedUrl });
        return storedUrl;
      }
      const publicId = match[0];
      const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
      return cloudinary.url(publicId, {
        type: 'authenticated',
        sign_url: true,
        expires_at: expiresAt,
        secure: true,
      });
    } catch (error: any) {
      logger.warn('Failed to generate signed URL, returning raw', 'CLOUDINARY_PROVIDER', { error: error.message });
      return storedUrl;
    }
  }

  /**
   * Eliminar documento de identidad de Cloudinary
   */
  async deleteDocument(url: string): Promise<void> {
    try {
      const match = url.match(/piums\/documents\/([^/]+)\/([^/.]+)/);
      if (!match) {
        logger.warn('Could not extract public_id from document URL', 'CLOUDINARY_PROVIDER', { url });
        return;
      }
      const [, folder, filename] = match;
      const publicId = `piums/documents/${folder}/${filename}`;
      await cloudinary.uploader.destroy(publicId);
      logger.info('Document deleted', 'CLOUDINARY_PROVIDER', { publicId });
    } catch (error: any) {
      logger.error('Failed to delete document', 'CLOUDINARY_PROVIDER', error);
    }
  }

  /**
   * Subir imagen de portafolio a Cloudinary
   * Usa piums/portfolio en vez de piums/avatars y sin crop de cara
   */
  async uploadPortfolio(buffer: Buffer, publicId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'piums/portfolio',
          public_id: publicId,
          transformation: [
            { width: 1200, height: 900, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            logger.error('Error uploading portfolio image to Cloudinary', 'CLOUDINARY_PROVIDER', error);
            reject(error);
          } else {
            logger.info('Portfolio image uploaded', 'CLOUDINARY_PROVIDER', { publicId, url: result?.secure_url });
            resolve(result!.secure_url);
          }
        }
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  /**
   * Verificar conexión con Cloudinary
   */
  async checkConnection(): Promise<boolean> {
    try {
      await cloudinary.api.ping();
      return true;
    } catch (error) {
      logger.error('Cloudinary connection failed', 'CLOUDINARY_PROVIDER', error);
      return false;
    }
  }
}

export const cloudinaryProvider = new CloudinaryProvider();
