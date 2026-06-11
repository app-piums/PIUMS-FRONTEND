import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getGroupConversations,
  getGroupConversation,
  sendGroupMessage,
  addParticipant,
  removeParticipant,
  markGroupAsRead,
} from '../controller/group-conversations.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getGroupConversations);
router.get('/:id', getGroupConversation);
router.post('/:id/messages', sendGroupMessage);
router.post('/:id/participants', addParticipant);
router.delete('/:id/participants/:participantId', removeParticipant);
router.patch('/:id/read', markGroupAsRead);

export default router;
