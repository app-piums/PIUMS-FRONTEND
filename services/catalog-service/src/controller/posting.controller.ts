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
      const { status, role, category, cityId, artistId, page, limit } = req.query as any;
      const result = await postingService.getPostings({
        status,
        role,
        category,
        cityId,
        artistId,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      res.json(result);
    } catch (error) { next(error); }
  }

  async getPostingById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const posting = await postingService.getPostingById(req.params.id, req.user?.id);
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
      const posting = await postingService.updatePosting(req.params.id, req.user!.id, req.body);
      res.json({ posting });
    } catch (error) { next(error); }
  }

  async deletePosting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await postingService.deletePosting(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (error) { next(error); }
  }

  // ==================== APPLICATIONS ====================

  async applyToPosting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const application = await postingService.applyToPosting(req.params.id, req.user!.id, req.body);
      res.status(201).json({ application });
    } catch (error) { next(error); }
  }

  async getApplicationsForPosting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const applications = await postingService.getApplicationsForPosting(req.params.id, req.user!.id);
      res.json({ applications });
    } catch (error) { next(error); }
  }

  async respondToApplication(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { accept } = req.body;
      const application = await postingService.respondToApplication(req.params.appId, req.user!.id, !!accept);
      res.json({ application });
    } catch (error) { next(error); }
  }

  async withdrawApplication(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const application = await postingService.withdrawApplication(req.params.appId, req.user!.id);
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
