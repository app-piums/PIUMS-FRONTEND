import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { resolveArtistId } from '../utils/artist-resolver';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  logger.error('FATAL: JWT_SECRET no definido en produccion', 'AUTH_MIDDLEWARE');
  process.exit(1);
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
  body: any;
  params: any;
  query: any;
  cookies: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Obtener token de cookie (auth_token o token) o header Authorization
    const token = req.cookies?.auth_token || req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || (() => { if (process.env.NODE_ENV === 'production') { throw new Error('JWT_SECRET es obligatorio en produccion'); } return 'dev-only-secret-not-for-production'; })()) as any;
    let userId = decoded.id || decoded.userId;

    if (decoded.role === 'artista' || decoded.role === 'artist' || decoded.role === 'ambos') {
      const profileId = await resolveArtistId(token);
      if (profileId) {
        userId = profileId;
      }
    }

    req.user = {
      id: userId,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    logger.error('Token verification failed', 'AUTH_MIDDLEWARE', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Verificar token de WebSocket
export const verifySocketToken = async (token: string): Promise<{ id: string; role?: string } | null> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || (() => { if (process.env.NODE_ENV === 'production') { throw new Error('JWT_SECRET es obligatorio en produccion'); } return 'dev-only-secret-not-for-production'; })()) as any;
    let userId = decoded.id || decoded.userId;

    if (decoded.role === 'artista' || decoded.role === 'artist' || decoded.role === 'ambos') {
      const profileId = await resolveArtistId(token);
      if (profileId) {
        userId = profileId;
      }
    }

    return {
      id: userId,
      role: decoded.role,
    };
  } catch (error) {
    logger.error('Socket token verification failed', 'SOCKET_AUTH', error);
    return null;
  }
};
