import { Router } from "express";
import { createPublicBooking, publicAvailability, publicEmployees, publicSalon, publicServices } from "../controllers/public-booking.controller";
import { cancelPublicBooking, viewPublicBooking } from "../controllers/public-manage.controller";
import { createPublicPaymentOrder, verifyPublicPayment } from "../controllers/public-payment.controller";
import { publicSite } from "../controllers/public-site.controller";
import { requirePublicSlug } from "../middleware/publicSlug.middleware";

export const publicSlugRouter = Router();
publicSlugRouter.use("/:slug", requirePublicSlug);
publicSlugRouter.get("/:slug", publicSalon);
publicSlugRouter.get("/:slug/site", publicSite);
publicSlugRouter.get("/:slug/services", publicServices);
publicSlugRouter.get("/:slug/employees", publicEmployees);
publicSlugRouter.get("/:slug/availability", publicAvailability);
publicSlugRouter.post("/:slug/appointments", createPublicBooking);
publicSlugRouter.post("/:slug/appointments/:id/payment-order", createPublicPaymentOrder);
publicSlugRouter.post("/:slug/appointments/:id/payment-verify", verifyPublicPayment);
publicSlugRouter.get("/:slug/appointments/:id", viewPublicBooking);
publicSlugRouter.post("/:slug/appointments/:id/cancel", cancelPublicBooking);
