import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "./error.middleware";

function domainFromOrigin(origin: string) {
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    throw new ApiError(403, "The request origin is invalid.");
  }
}

/** Resolves the tenant solely from the integration key; a public caller never supplies salonId. */
export async function requirePublicIntegration(request: Request, response: Response, next: NextFunction) {
  try {
    const publicKey = request.header("x-dropxcutz-key")?.trim();
    if (!publicKey) throw new ApiError(401, "The X-DropXcutz-Key header is required.");

    const integration = await prisma.salonIntegration.findFirst({
      where: { publicKey, isActive: true },
      include: { salon: true },
    });
    if (!integration || !["ACTIVE", "TRIAL"].includes(integration.salon.status))
      throw new ApiError(401, "The integration key is invalid or inactive.");

    const origin = request.header("origin");
    if (!origin) throw new ApiError(403, "An Origin header is required for public website requests.");
    if (!integration.allowedDomains.includes(domainFromOrigin(origin)))
      throw new ApiError(403, "This domain is not allowed for this integration key.");

    response.locals.publicIntegration = integration;
    response.locals.salon = integration.salon;
    next();
  } catch (error) {
    next(error);
  }
}

/** Browsers do not send custom API keys on CORS preflight requests. */
export async function publicPreflight(request: Request, response: Response, next: NextFunction) {
  try {
    const origin = request.header("origin");
    if (!origin) return response.sendStatus(403);
    const allowedDomain = domainFromOrigin(origin);
    const integration = await prisma.salonIntegration.findFirst({
      where: {
        isActive: true,
        allowedDomains: { has: allowedDomain },
        salon: { status: { in: ["ACTIVE", "TRIAL"] } },
      },
      select: { id: true },
    });
    if (!integration) return response.sendStatus(403);
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-DropXcutz-Key");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

export function publicCors(request: Request, response: Response, next: NextFunction) {
  const integration = response.locals.publicIntegration as { allowedDomains: string[] } | undefined;
  const origin = request.header("origin");
  if (origin && integration && integration.allowedDomains.includes(domainFromOrigin(origin))) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-DropXcutz-Key");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
  next();
}
