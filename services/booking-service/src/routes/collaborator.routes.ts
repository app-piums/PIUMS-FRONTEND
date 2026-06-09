import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { collaboratorService } from '../services/collaborator.service';

const router: Router = Router();
router.use(authenticateToken);

// Lead artist invites a collaborator
router.post('/bookings/:id/collaborators', async (req: any, res, next) => {
  try {
    const leadArtistId = req.user?.id;
    if (!leadArtistId) return res.status(401).json({ message: 'No autenticado' });
    const { artistId, role, notes } = req.body;
    if (!artistId) return res.status(400).json({ message: 'artistId es requerido' });
    const collaborator = await collaboratorService.inviteCollaborator(req.params.id, leadArtistId, artistId, role, notes);
    res.status(201).json({ collaborator });
  } catch (error) {
    next(error);
  }
});

// Get collaborators for a booking
router.get('/bookings/:id/collaborators', async (req: any, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    const collaborators = await collaboratorService.getBookingCollaborators(req.params.id, userId);
    res.json({ collaborators });
  } catch (error) {
    next(error);
  }
});

// Collaborator accepts or rejects invitation
router.post('/collaborators/:collaboratorId/respond', async (req: any, res, next) => {
  try {
    const artistId = req.user?.id;
    if (!artistId) return res.status(401).json({ message: 'No autenticado' });
    const { accept } = req.body;
    if (typeof accept !== 'boolean') return res.status(400).json({ message: 'accept (boolean) es requerido' });
    const collaborator = await collaboratorService.respondToInvitation(req.params.collaboratorId, artistId, accept);
    res.json({ collaborator });
  } catch (error) {
    next(error);
  }
});

// Lead artist cancels a collaborator
router.delete('/bookings/:id/collaborators/:artistId', async (req: any, res, next) => {
  try {
    const leadArtistId = req.user?.id;
    if (!leadArtistId) return res.status(401).json({ message: 'No autenticado' });
    const collaborator = await collaboratorService.cancelCollaborator(req.params.id, leadArtistId, req.params.artistId);
    res.json({ collaborator });
  } catch (error) {
    next(error);
  }
});

// Artist gets all bookings where they are a collaborator
router.get('/artists/me/collaborations', async (req: any, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    const collaborations = await collaboratorService.getMyCollaborations(userId);
    res.json({ collaborations });
  } catch (error) {
    next(error);
  }
});

export default router;
