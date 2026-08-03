import { Router } from "express";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import {
  createServiceCategory,
  deleteServiceCategory,
  getServiceCategory,
  listCategoryServices,
  listServiceCategories,
  updateServiceCategory,
} from "./service-category.controller";
/** @openapi
 * /service-categories: { get: { summary: List service categories, tags: [Service Categories] }, post: { summary: Create category, tags: [Service Categories] } }
 */
export const serviceCategoryRouter = Router();
serviceCategoryRouter.get("/", listServiceCategories);
serviceCategoryRouter.get("/:id", getServiceCategory);
serviceCategoryRouter.get("/:id/services", listCategoryServices);
serviceCategoryRouter.post("/", requireSalonAdmin, createServiceCategory);
serviceCategoryRouter.patch("/:id", requireSalonAdmin, updateServiceCategory);
serviceCategoryRouter.delete("/:id", requireSalonAdmin, deleteServiceCategory);
