import { Router } from "express";
import { createPublicBooking, publicAvailability, publicEmployees, publicSalon, publicServices } from "../controllers/public-booking.controller";
import { createPublicPaymentOrder, verifyPublicPayment } from "../controllers/public-payment.controller";
import { requirePublicSlug } from "../middleware/publicSlug.middleware";

export const publicSlugRouter = Router();
publicSlugRouter.use("/:slug", requirePublicSlug);
publicSlugRouter.get("/:slug", publicSalon);
publicSlugRouter.get("/:slug/services", publicServices);
publicSlugRouter.get("/:slug/employees", publicEmployees);
publicSlugRouter.get("/:slug/availability", publicAvailability);
publicSlugRouter.post("/:slug/appointments", createPublicBooking);
publicSlugRouter.post("/:slug/appointments/:id/payment-order", createPublicPaymentOrder);
publicSlugRouter.post("/:slug/appointments/:id/payment-verify", verifyPublicPayment);
