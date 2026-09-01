import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "./config/prisma";
import { errorHandler, notFound } from "./middleware/error.middleware";
import {
  requireTrustedOrigin,
  securityHeaders,
} from "./middleware/security.middleware";
import { salonRouter } from "./routes/salon.routes";
import { platformRouter } from "./routes/platform.routes";
import { publicRouter } from "./routes/public.routes";
import { publicSlugRouter } from "./routes/public-slug.routes";
import { startScheduler } from "./services/scheduler.service";
import { handleRazorpayWebhook } from "./controllers/billing.controller";
import path from "node:path";

const app = express();
const port = Number(process.env.PORT_NO ?? 5000);
const isDevelopment = process.env.NODE_ENV !== "production";
const limits = {
  login: isDevelopment ? 100 : 10,
  password: isDevelopment ? 200 : 20,
  publicApi: isDevelopment ? 1_000 : 100,
  publicSlug: isDevelopment ? 500 : 40,
};
const origins = (
  process.env.FRONTEND_ORIGINS ??
  "http://localhost:3000,http://localhost:3001,http://localhost:3002"
)
  .split(",")
  .map((origin) => origin.trim());

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(
  cors({
    origin: origins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.post(
  "/api/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook,
);

app.use(express.json({ limit: "6mb" }));
app.use("/uploads", express.static(path.resolve(process.env.UPLOAD_DIR ?? "uploads"), { maxAge: "7d", immutable: true }));
app.use(requireTrustedOrigin);
app.use(
  "/api/erp/auth/login",
  rateLimit({
    windowMs: 15 * 60_000,
    limit: limits.login,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use(
  "/api/erp/auth/password",
  rateLimit({
    windowMs: 15 * 60_000,
    limit: limits.password,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use(
  "/api/v1/public",
  rateLimit({
    windowMs: 15 * 60_000,
    limit: limits.publicApi,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.get("/api/health", async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.json({ status: "ok", service: "dropxcutz-salon-api" });
});

app.use("/api/erp", salonRouter);
app.use("/api/platform", platformRouter);
app.use("/api/v1/public", publicRouter);
app.use(
  "/api/public/v1/salons",
  rateLimit({
    windowMs: 15 * 60_000,
    limit: limits.publicSlug,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  publicSlugRouter,
);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () =>
  console.info(`Salon API listening on http://localhost:${port}`),
);
const stopScheduler = startScheduler();

async function shutdown() {
  stopScheduler();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
