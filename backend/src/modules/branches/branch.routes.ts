import { Router } from "express";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import {
  activateBranch,
  createBranch,
  deactivateBranch,
  deleteBranch,
  getBranch,
  listBranches,
  updateBranch,
} from "./branch.controller";
/** @openapi
 * /branches:
 *   get: { summary: List salon branches, tags: [Branches] }
 *   post: { summary: Create a salon branch, tags: [Branches] }
 * /branches/{id}:
 *   get: { summary: Get a branch and statistics, tags: [Branches] }
 *   patch: { summary: Update a branch, tags: [Branches] }
 *   delete: { summary: Delete a branch, tags: [Branches] }
 */
export const branchRouter = Router();
branchRouter.get("/", listBranches);
branchRouter.get("/:id", getBranch);
branchRouter.post("/", requireSalonAdmin, createBranch);
branchRouter.patch("/:id", requireSalonAdmin, updateBranch);
branchRouter.patch("/:id/activate", requireSalonAdmin, activateBranch);
branchRouter.patch("/:id/deactivate", requireSalonAdmin, deactivateBranch);
branchRouter.delete("/:id", requireSalonAdmin, deleteBranch);
