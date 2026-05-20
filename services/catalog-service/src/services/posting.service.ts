import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { notificationsClient } from '../clients/notifications.client';
import { artistsClient } from '../clients/artists.client';

const prisma = new PrismaClient();

export class PostingService {
  // ==================== POSTINGS ====================

  async createPosting(artistId: string, data: {
    title: string;
    description: string;
    role: string;
    category?: string;
    eventDate?: string;
    cityId?: string;
    budgetMin?: number;
    budgetMax?: number;
    currency?: string;
  }) {
    const posting = await prisma.artistPosting.create({
      data: {
        artistId,
        title: data.title,
        description: data.description,
        role: data.role,
        category: data.category ?? null,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        cityId: data.cityId ?? null,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        currency: data.currency ?? 'GTQ',
        status: 'OPEN',
      },
    });
    logger.info(`Posting created: ${posting.id} by artist ${artistId}`, 'POSTING');
    return posting;
  }

  async getPostings(params: {
    status?: string;
    role?: string;
    category?: string;
    cityId?: string;
    artistId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status = 'OPEN', role, category, cityId, artistId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (role) where.role = { contains: role, mode: 'insensitive' };
    if (category) where.category = { contains: category, mode: 'insensitive' };
    if (cityId) where.cityId = cityId;
    if (artistId) where.artistId = artistId;

    const [postings, total] = await Promise.all([
      prisma.artistPosting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { applications: { select: { id: true, status: true } } },
      }),
      prisma.artistPosting.count({ where }),
    ]);

    return { postings, total, page, limit };
  }

  async getPostingById(id: string, requesterId?: string) {
    const posting = await prisma.artistPosting.findUnique({
      where: { id },
      include: {
        applications: requesterId
          ? { where: { artistId: requesterId }, select: { id: true, status: true } }
          : false,
      },
    });
    if (!posting) throw new AppError(404, 'Postulación no encontrada');
    return posting;
  }

  async getMyPostings(artistId: string) {
    return prisma.artistPosting.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' },
      include: {
        applications: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, artistId: true, status: true, message: true, createdAt: true },
        },
      },
    });
  }

  async updatePosting(id: string, artistId: string, data: {
    title?: string;
    description?: string;
    role?: string;
    category?: string;
    eventDate?: string;
    cityId?: string;
    budgetMin?: number;
    budgetMax?: number;
    currency?: string;
    status?: string;
  }) {
    const posting = await prisma.artistPosting.findUnique({ where: { id } });
    if (!posting) throw new AppError(404, 'Postulación no encontrada');
    if (posting.artistId !== artistId) throw new AppError(403, 'Sin permiso para editar esta postulación');

    const updated = await prisma.artistPosting.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.role && { role: data.role }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.eventDate !== undefined && { eventDate: data.eventDate ? new Date(data.eventDate) : null }),
        ...(data.cityId !== undefined && { cityId: data.cityId }),
        ...(data.budgetMin !== undefined && { budgetMin: data.budgetMin }),
        ...(data.budgetMax !== undefined && { budgetMax: data.budgetMax }),
        ...(data.currency && { currency: data.currency }),
        ...(data.status && { status: data.status as any }),
        ...(data.status === 'CLOSED' || data.status === 'FILLED' || data.status === 'CANCELLED'
          ? { closedAt: new Date() }
          : {}),
      },
    });
    return updated;
  }

  async deletePosting(id: string, artistId: string) {
    const posting = await prisma.artistPosting.findUnique({ where: { id } });
    if (!posting) throw new AppError(404, 'Postulación no encontrada');
    if (posting.artistId !== artistId) throw new AppError(403, 'Sin permiso para eliminar esta postulación');

    await prisma.artistPosting.delete({ where: { id } });
    return { success: true };
  }

  // ==================== APPLICATIONS ====================

  async applyToPosting(postingId: string, artistId: string, data: {
    message: string;
    portfolioLinks?: string[];
  }) {
    const posting = await prisma.artistPosting.findUnique({ where: { id: postingId } });
    if (!posting) throw new AppError(404, 'Postulación no encontrada');
    if (posting.status !== 'OPEN') throw new AppError(400, 'Esta postulación ya no acepta aplicaciones');
    if (posting.artistId === artistId) throw new AppError(400, 'No puedes aplicar a tu propia postulación');

    const existing = await prisma.postingApplication.findUnique({
      where: { postingId_artistId: { postingId, artistId } },
    });
    if (existing && existing.status !== 'WITHDRAWN') {
      throw new AppError(409, 'Ya has aplicado a esta postulación');
    }

    const application = existing
      ? await prisma.postingApplication.update({
          where: { id: existing.id },
          data: {
            message: data.message,
            portfolioLinks: data.portfolioLinks ?? [],
            status: 'PENDING',
            respondedAt: null,
          },
        })
      : await prisma.postingApplication.create({
          data: {
            postingId,
            artistId,
            message: data.message,
            portfolioLinks: data.portfolioLinks ?? [],
            status: 'PENDING',
          },
        });

    // Increment application count
    await prisma.artistPosting.update({
      where: { id: postingId },
      data: { applicationCount: { increment: 1 } },
    }).catch(() => {});

    // Notify posting artist
    const applicantInfo = await artistsClient.getArtist(artistId).catch(() => null);
    const applicantName = (applicantInfo as any)?.displayName ?? (applicantInfo as any)?.nombre ?? 'Un artista';

    await notificationsClient.sendNotification({
      userId: posting.artistId,
      type: 'APPLICATION_RECEIVED',
      channel: 'IN_APP',
      title: 'Nueva postulación recibida',
      message: `${applicantName} aplicó a tu postulación "${posting.title}".`,
      data: { postingId, applicationId: application.id, applicantId: artistId },
      priority: 'normal',
    }).catch(err => logger.error('Error notificando aplicación', 'POSTING', err));

    logger.info(`Application ${application.id} created for posting ${postingId}`, 'POSTING');
    return application;
  }

  async getApplicationsForPosting(postingId: string, artistId: string) {
    const posting = await prisma.artistPosting.findUnique({ where: { id: postingId } });
    if (!posting) throw new AppError(404, 'Postulación no encontrada');
    if (posting.artistId !== artistId) throw new AppError(403, 'Solo el artista que publicó puede ver las aplicaciones');

    const applications = await prisma.postingApplication.findMany({
      where: { postingId },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with artist info
    const enriched = await Promise.all(
      applications.map(async app => {
        const info = await artistsClient.getArtist(app.artistId).catch(() => null);
        return {
          ...app,
          artistName: (info as any)?.displayName ?? (info as any)?.nombre ?? app.artistId,
          artistAvatar: (info as any)?.profileImageUrl ?? (info as any)?.imagenPerfil ?? null,
          artistCategory: (info as any)?.categoria ?? null,
        };
      })
    );

    return enriched;
  }

  async respondToApplication(applicationId: string, postingArtistId: string, accept: boolean) {
    const application = await prisma.postingApplication.findUnique({
      where: { id: applicationId },
      include: { posting: true },
    });
    if (!application) throw new AppError(404, 'Aplicación no encontrada');
    if (application.posting.artistId !== postingArtistId) throw new AppError(403, 'Sin permiso');
    if (application.status !== 'PENDING' && application.status !== 'REVIEWED') {
      throw new AppError(400, 'Esta aplicación ya fue respondida');
    }

    const newStatus = accept ? 'ACCEPTED' : 'REJECTED';
    const updated = await prisma.postingApplication.update({
      where: { id: applicationId },
      data: { status: newStatus, respondedAt: new Date() },
    });

    // If accepted, close the posting as FILLED
    if (accept) {
      await prisma.artistPosting.update({
        where: { id: application.postingId },
        data: { status: 'FILLED', closedAt: new Date() },
      }).catch(() => {});
    }

    // Notify applicant
    await notificationsClient.sendNotification({
      userId: application.artistId,
      type: accept ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
      channel: 'IN_APP',
      title: accept ? 'Tu postulación fue aceptada' : 'Tu postulación fue rechazada',
      message: accept
        ? `Tu aplicación para "${application.posting.title}" fue aceptada. Pronto te contactarán.`
        : `Tu aplicación para "${application.posting.title}" no fue seleccionada.`,
      data: { postingId: application.postingId, applicationId, accepted: accept },
      priority: 'normal',
    }).catch(err => logger.error('Error notificando respuesta a aplicación', 'POSTING', err));

    return updated;
  }

  async withdrawApplication(applicationId: string, artistId: string) {
    const application = await prisma.postingApplication.findUnique({ where: { id: applicationId } });
    if (!application) throw new AppError(404, 'Aplicación no encontrada');
    if (application.artistId !== artistId) throw new AppError(403, 'Sin permiso');
    if (application.status === 'ACCEPTED') throw new AppError(400, 'No puedes retirar una aplicación aceptada');

    const updated = await prisma.postingApplication.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN', respondedAt: new Date() },
    });

    // Decrement application count
    await prisma.artistPosting.update({
      where: { id: application.postingId },
      data: { applicationCount: { decrement: 1 } },
    }).catch(() => {});

    return updated;
  }

  async getMyApplications(artistId: string) {
    const applications = await prisma.postingApplication.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' },
      include: {
        posting: {
          select: {
            id: true,
            title: true,
            role: true,
            eventDate: true,
            status: true,
            budgetMin: true,
            budgetMax: true,
            currency: true,
          },
        },
      },
    });
    return applications;
  }
}

export const postingService = new PostingService();
