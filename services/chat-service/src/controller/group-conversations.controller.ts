import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GroupChatService } from '../services/group-chat.service';

const groupChatService = new GroupChatService();

export const getGroupConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    const groups = await groupChatService.getGroupConversations(userId);
    res.json({ groups });
  } catch (error) {
    next(error);
  }
};

export const getGroupConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    const group = await groupChatService.getGroupConversation(req.params.id, userId);
    res.json({ group });
  } catch (error) {
    next(error);
  }
};

export const sendGroupMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    const { content, type } = req.body;
    if (!content) return res.status(400).json({ message: 'content es requerido' });
    const message = await groupChatService.sendGroupMessage(req.params.id, userId, content, type);
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

export const addParticipant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ message: 'participantId es requerido' });
    await groupChatService.addParticipant(req.params.id, participantId, userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

export const removeParticipant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    await groupChatService.removeParticipant(req.params.id, req.params.participantId, userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

export const markGroupAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    await groupChatService.markGroupAsRead(req.params.id, userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};
