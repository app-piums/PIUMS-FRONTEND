import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { postingService } from '../services/posting.service';

export class PostingController {
  // ==================== POSTINGS ====================

  async createPosting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const posting = await postingService.createPosting(req.user!.id, req.body);
      res.status(201).json({ posting });
    } catch (error) { next(error); }
  }

  async getPostings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, role, category, cityId, artistId, forArtistId, page, limit } = req.query as any;
      // forArtistId can come from query or auto-set from authenticated user
      const resolvedForArtistId = forArtistId ?? (req.user?.id ?? undefined);
      const result = await postingService.getPostings({
        status,
        role,
        category,
        cityId,
        artistId,
        forArtistId: resolvedForArtistId,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      res.json(result);
    } catch (error) { next(error); }
  }

  async getPostingById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const posting = await postingService.getPostingById(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, req.user?.id);
      res.json({ posting });
    } catch (error) { next(error); }
  }

  async getMyPostings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const postings = await postingService.getMyPostings(req.user!.id);
      res.json({ postings });
    } catch (error) { next(error); }
  }

  async updatePosting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const posting = await postingService.updatePosting(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, req.user!.id, req.body);
      res.json({ posting });
    } catch (error) { next(error); }
  }

  async deletePosting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await postingService.deletePosting(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (error) { next(error); }
  }

  // ==================== APPLICATIONS ====================

  async applyToPosting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const application = await postingService.applyToPosting(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, req.user!.id, req.body);
      res.status(201).json({ application });
    } catch (error) { next(error); }
  }

  async getApplicationsForPosting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const applications = await postingService.getApplicationsForPosting(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, req.user!.id);
      res.json({ applications });
    } catch (error) { next(error); }
  }

  async respondToApplication(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { accept } = req.body;
      const application = await postingService.respondToApplication(Array.isArray(req.params.appId) ? req.params.appId[0] : req.params.appId, req.user!.id, !!accept);
      res.json({ application });
    } catch (error) { next(error); }
  }

  async markApplicationReviewed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const application = await postingService.markApplicationReviewed(Array.isArray(req.params.appId) ? req.params.appId[0] : req.params.appId, req.user!.id);
      res.json({ application });
    } catch (error) { next(error); }
  }

  async withdrawApplication(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const application = await postingService.withdrawApplication(Array.isArray(req.params.appId) ? req.params.appId[0] : req.params.appId, req.user!.id);
      res.json({ application });
    } catch (error) { next(error); }
  }

  async getMyApplications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const applications = await postingService.getMyApplications(req.user!.id);
      res.json({ applications });
    } catch (error) { next(error); }
  }
}

export const postingController = new PostingController();
