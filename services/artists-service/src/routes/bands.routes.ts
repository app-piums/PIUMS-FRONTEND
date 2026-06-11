import { Router, RequestHandler } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createBand, getMyBand, getMyBands, getBand, searchBands, updateBand, deleteBand,
  inviteMember, respondToInvite, listMembers, removeMember, requestToJoin,
  createOpening, listOpenings, closeOpening,
  applyToOpening, listApplications, respondToApplication,
  getAllOpenings, getMyInvitations, uploadBandAvatar,
} from "../controller/bands.controller";
import { upload, handleMulterError } from "../middleware/upload.middleware";

const router: Router = Router();

// Búsqueda pública
router.get("/search", searchBands);

// Feed de audiciones abiertas (público)
router.get("/openings/all", getAllOpenings);

// Mis invitaciones pendientes
router.get("/invitations/my", authenticateToken, getMyInvitations);

// Mis bandas
router.get("/my/all", authenticateToken, getMyBands);
router.get("/my", authenticateToken, getMyBand);

// CRUD de banda
router.post("/", authenticateToken, createBand);
router.get("/:id", getBand);
router.put("/:id", authenticateToken, updateBand);
router.delete("/:id", authenticateToken, deleteBand);
// Cast necesario: @types/multer se resuelve contra @types/express v4 mientras
// este servicio usa @types/express v5. Solo difieren las definiciones de tipos;
// el handler de multer es compatible en runtime.
router.post("/:id/avatar", authenticateToken, upload.single("avatar") as unknown as RequestHandler, handleMulterError, uploadBandAvatar);

// Miembros
router.get("/:id/members", authenticateToken, listMembers);
router.post("/:id/members/invite", authenticateToken, inviteMember);
router.post("/:id/members/respond", authenticateToken, respondToInvite);
router.post("/:id/members/join", authenticateToken, requestToJoin);
router.delete("/:id/members/:artistId", authenticateToken, removeMember);

// Postulaciones
router.get("/:id/openings", listOpenings);
router.post("/:id/openings", authenticateToken, createOpening);
router.put("/:id/openings/:oid/close", authenticateToken, closeOpening);
router.post("/openings/:oid/apply", authenticateToken, applyToOpening);
router.get("/:id/openings/:oid/applications", authenticateToken, listApplications);
router.post("/applications/:aid/respond", authenticateToken, respondToApplication);

export default router;
