import { Router, RequestHandler } from "express";
import { ModerationController } from "../controller/moderation.controller";
import { authenticateToken, requireAdmin, requireAdminOrService } from "../middleware/auth.middleware";
import { checkLimiter, adminLimiter } from "../middleware/rateLimiter";

const router: Router = Router();
const ctrl = new ModerationController();

// Cast necesario: los handlers usan AuthRequest (user requerido tras
// authenticateToken), que no coincide con la firma genérica RequestHandler
// (user opcional). Solo afecta a las definiciones de tipos, no al runtime.
const h = (fn: (...args: any[]) => any): RequestHandler => fn as RequestHandler;

// ── Endpoints internos (servicio a servicio) ──────────────────────────────────

// POST /api/moderation/check — Verificar contenido (llamado por otros microservicios)
router.post(
  "/check",
  checkLimiter,
  authenticateToken,
  requireAdminOrService,
  h(ctrl.check.bind(ctrl))
);

// POST /api/moderation/test — Probar texto sin guardar log (solo admin)
router.post(
  "/test",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  h(ctrl.testCheck.bind(ctrl))
);

// ── Gestión del blacklist (admin) ─────────────────────────────────────────────

// GET  /api/moderation/blacklist
router.get(
  "/blacklist",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  h(ctrl.listWords.bind(ctrl))
);

// POST /api/moderation/blacklist
router.post(
  "/blacklist",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  h(ctrl.createWord.bind(ctrl))
);

// PUT  /api/moderation/blacklist/:id
router.put(
  "/blacklist/:id",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  h(ctrl.updateWord.bind(ctrl))
);

// DELETE /api/moderation/blacklist/:id (desactiva, no borra físicamente)
router.delete(
  "/blacklist/:id",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  h(ctrl.deactivateWord.bind(ctrl))
);

// ── Logs de auditoría (admin) ─────────────────────────────────────────────────

// GET /api/moderation/logs
router.get(
  "/logs",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  h(ctrl.getLogs.bind(ctrl))
);

// ── Cola de revisión manual (admin) ──────────────────────────────────────────

// GET  /api/moderation/queue
router.get(
  "/queue",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  h(ctrl.getQueue.bind(ctrl))
);

// POST /api/moderation/queue/:logId/resolve
router.post(
  "/queue/:logId/resolve",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  h(ctrl.resolveQueue.bind(ctrl))
);

// ── Strikes (admin) ───────────────────────────────────────────────────────────

// GET    /api/moderation/strikes/:userId
router.get(
  "/strikes/:userId",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  h(ctrl.getStrikes.bind(ctrl))
);

// POST   /api/moderation/strikes/:strikeId/resolve
router.post(
  "/strikes/:strikeId/resolve",
  adminLimiter,
  authenticateToken,
  requireAdmin,
  h(ctrl.resolveStrikeHandler.bind(ctrl))
);

export default router;
