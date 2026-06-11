import { Router } from 'express';
import { postingController } from '../controller/posting.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';

const router: Router = Router();

// Postings
router.post('/postings', authenticateToken, postingController.createPosting.bind(postingController));
router.get('/postings', optionalAuth, postingController.getPostings.bind(postingController));
router.get('/postings/mine', authenticateToken, postingController.getMyPostings.bind(postingController));
router.get('/postings/:id', optionalAuth, postingController.getPostingById.bind(postingController));
router.patch('/postings/:id', authenticateToken, postingController.updatePosting.bind(postingController));
router.delete('/postings/:id', authenticateToken, postingController.deletePosting.bind(postingController));

// Applications (nested under posting)
router.post('/postings/:id/apply', authenticateToken, postingController.applyToPosting.bind(postingController));
router.get('/postings/:id/applications', authenticateToken, postingController.getApplicationsForPosting.bind(postingController));

// Application actions (by ID)
router.patch('/applications/:appId/review', authenticateToken, postingController.markApplicationReviewed.bind(postingController));
router.patch('/applications/:appId/respond', authenticateToken, postingController.respondToApplication.bind(postingController));
router.delete('/applications/:appId/withdraw', authenticateToken, postingController.withdrawApplication.bind(postingController));
router.get('/applications/mine', authenticateToken, postingController.getMyApplications.bind(postingController));

export default router;
