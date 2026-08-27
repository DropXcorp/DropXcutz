import { Router } from "express";
import { createPublicBooking, publicAvailability, publicEmployees, publicSalon, publicServices } from "../controllers/public-booking.controller";
import { requirePublicIntegration, publicCors, publicPreflight } from "../middleware/publicIntegration.middleware";

export const publicRouter = Router();
publicRouter.options("/{*path}", publicPreflight);
publicRouter.use(requirePublicIntegration, publicCors);
publicRouter.get("/salon", publicSalon);
publicRouter.get("/services", publicServices);
publicRouter.get("/employees", publicEmployees);
publicRouter.get("/availability", publicAvailability);
publicRouter.post("/appointments", createPublicBooking);
