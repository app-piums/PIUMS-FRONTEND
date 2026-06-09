import { Router, RequestHandler } from "express";
import {
  createProfile,
  getMyProfile,
  getProfileBySlug,
  updateMyProfile,
  uploadCoverPhoto,
  deleteCoverPhoto,
  checkSlugAvailability,
  uploadPortfolioImage,
} from "../controller/profile.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { updateLimiter } from "../middleware/rateLimiter";
import { upload, handleMulterError, verifyMagicBytes } from "../middleware/upload.middleware";

const router: Router = Router();

// Verificar disponibilidad de slug (puede ser sin auth para UI pre-registro)
router.get("/check-slug/:slug", checkSlugAvailability);

// Perfil público por slug
router.get("/:slug", getProfileBySlug);

// Perfil propio
router.post("/", authenticateToken, createProfile);
router.get("/", authenticateToken, getMyProfile);
router.put("/", authenticateToken, updateLimiter as any, updateMyProfile);

// Foto de portada
// Cast necesario: @types/multer usa @types/express v4 y este servicio v5.
// Incompatibilidad solo de definiciones de tipos; compatible en runtime.
router.post(
  "/cover",
  authenticateToken,
  upload.single("cover") as unknown as RequestHandler,
  handleMulterError,
  verifyMagicBytes,
  uploadCoverPhoto
);
router.delete("/cover", authenticateToken, deleteCoverPhoto);

// Portfolio image upload (returns Cloudinary URL, does not write to DB)
router.post(
  "/portfolio-upload",
  authenticateToken,
  upload.single("image") as unknown as RequestHandler,
  handleMulterError,
  verifyMagicBytes,
  uploadPortfolioImage
);

export default router;
