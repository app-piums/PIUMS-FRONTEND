import { Request, Response, NextFunction } from "express";
import { catalogService } from "../services/catalog.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/errorHandler";
import { artistsClient } from "../clients/artists.client";
import {
  createCategorySchema,
  updateCategorySchema,
  createServiceSchema,
  updateServiceSchema,
  addonSchema,
  packageSchema,
  searchServicesSchema,
} from "../schemas/catalog.schema";

export class CatalogController {
  private async resolveArtistId(authId: string): Promise<string> {
    const artistId = await artistsClient.getArtistIdByAuthId(authId);
    if (!artistId) {
      throw new AppError(404, 'Perfil de artista no encontrado para este usuario');
    }
    return artistId;
  }

  // ==================== CATEGORÍAS ====================

  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const categories = await catalogService.getAllCategories(includeInactive);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const category = await catalogService.getCategoryById(id);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await catalogService.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const validatedData = updateCategorySchema.parse(req.body);
      const category = await catalogService.updateCategory(id, validatedData);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await catalogService.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ==================== SERVICIOS ====================

  async getMyServices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const artistId = await this.resolveArtistId(req.user!.id);
      const result = await catalogService.getMyServices(artistId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async searchServices(req: Request, res: Response, next: NextFunction) {
    try {
      const query = {
        artistId: req.query.artistId as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        pricingType: req.query.pricingType as any,
        minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
        status: req.query.status as any,
        isFeatured: req.query.isFeatured === "true" ? true : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      const result = await catalogService.searchServices(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const incrementView = req.query.view === "true";
      const service = await catalogService.getServiceById(id, incrementView);
      res.json(service);
    } catch (error) {
      next(error);
    }
  }

  async createService(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createServiceSchema.parse(req.body);
      const service = await catalogService.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      next(error);
    }
  }

  async updateService(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const artistId = await this.resolveArtistId(req.user!.id);

      const validatedData = updateServiceSchema.parse(req.body);
      const service = await catalogService.updateService(id, artistId, validatedData);
      res.json(service);
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const artistId = await this.resolveArtistId(req.user!.id);

      await catalogService.deleteService(id, artistId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async toggleServiceStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const artistId = await this.resolveArtistId(req.user!.id);

      const service = await catalogService.toggleServiceStatus(id, artistId);
      res.json(service);
    } catch (error) {
      next(error);
    }
  }

  async toggleServiceSale(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const artistId = await this.resolveArtistId(req.user!.id);

      const service = await catalogService.toggleServiceSale(id, artistId);
      res.json(service);
    } catch (error) {
      next(error);
    }
  }

  async setMainService(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const artistId = await this.resolveArtistId(req.user!.id);

      const service = await catalogService.setMainService(id, artistId);
      res.json(service);
    } catch (error) {
      next(error);
    }
  }

  // ==================== ADD-ONS ====================

  async createAddon(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const serviceId = req.params.serviceId as string;
      const artistId = await this.resolveArtistId(req.user!.id);

      const validatedData = addonSchema.parse(req.body);
      const addon = await catalogService.createAddon(serviceId, artistId, validatedData);
      res.status(201).json(addon);
    } catch (error) {
      next(error);
    }
  }

  async updateAddon(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const addonId = req.params.addonId as string;
      const artistId = await this.resolveArtistId(req.user!.id);
      const data = addonSchema.parse(req.body);

      const addon = await catalogService.updateAddon(addonId, artistId, data);
      res.json(addon);
    } catch (error) {
      next(error);
    }
  }

  async deleteAddon(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const addonId = req.params.addonId as string;
      const artistId = await this.resolveArtistId(req.user!.id);

      await catalogService.deleteAddon(addonId, artistId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ==================== PAQUETES ====================

  async createPackage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = packageSchema.parse(req.body);
      
      // Convertir strings a Date si existen
      const data: any = { ...validatedData };
      if (data.validFrom) data.validFrom = new Date(data.validFrom);
      if (data.validUntil) data.validUntil = new Date(data.validUntil);

      const pkg = await catalogService.createPackage(data);
      res.status(201).json(pkg);
    } catch (error) {
      next(error);
    }
  }

  async getPackagesByArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.artistId as string;
      const packages = await catalogService.getPackagesByArtist(artistId);
      res.json(packages);
    } catch (error) {
      next(error);
    }
  }

  async updatePackage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const artistId = await this.resolveArtistId(req.user!.id);
      const data = req.body;

      const pkg = await catalogService.updatePackage(id, artistId, data);
      res.json(pkg);
    } catch (error) {
      next(error);
    }
  }

  async deletePackage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const artistId = await this.resolveArtistId(req.user!.id);

      await catalogService.deletePackage(id, artistId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const catalogController = new CatalogController();
