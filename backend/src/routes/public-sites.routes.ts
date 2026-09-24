import { Router } from "express";
import { resolveSite } from "../controllers/public-site.controller";

export const publicSitesRouter = Router();
publicSitesRouter.get("/resolve", resolveSite);
