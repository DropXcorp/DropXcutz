import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "./config/prisma";
import { errorHandler, notFound } from "./middleware/error.middleware";
import { securityHeaders } from "./middleware/security.middleware";
import { salonRouter } from "./routes/salon.routes";
import { platformRouter } from "./routes/platform.routes";

const app = express();
const port = Number(process.env.PORT_NO ?? 5000);
const origins = (
  process.env.FRONTEND_ORIGINS ?? "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((origin) => origin.trim());

app.disable("x-powered-by");
app.use(
  cors({
    origin: origins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);


app.use(express.json({ limit: "1mb" }));
app.get("/api/health", async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.json({ status: "ok", service: "dropxcutz-salon-api" });
});


app.use("/api/erp", salonRouter);
app.use("/api/platform", platformRouter);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () =>
  console.info(`Salon API listening on http://localhost:${port}`),
);

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
