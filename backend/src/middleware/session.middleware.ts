import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "./error.middleware";
import { hasPlatformPermission, type PlatformPermission } from "../services/platform-permission.service";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const sessionCookie = {
  erp: "dropxcutz_erp_session",
  platform: "dropxcutz_platform_session",
} as const;
const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32)
    throw new ApiError(503, "JWT authentication is not configured.");
  return value;
};
async function sessionFor(
  request: Request,
  response: Response,
  scope: keyof typeof sessionCookie,
) {
  const cookieName = sessionCookie[scope];
  const token = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(`${cookieName}=`.length);
  if (!token) throw new ApiError(401, "Sign in is required.");
  let payload: { sub?: string; sid?: string; role?: string };
  try {
    payload = jwt.verify(token, secret()) as typeof payload;
  } catch {
    throw new ApiError(401, "Your session is invalid or expired.");
  }
  if (!payload.sub || !payload.sid)
    throw new ApiError(401, "Your session is invalid or expired.");
  const session = await prisma.session.findUnique({
    where: { tokenHash: hash(payload.sid) },
    include: { user: { include: { salon: true, platformRole: { include: { permissions: true } } } } },
  });
  if (session && session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new ApiError(401, "Your session is invalid or expired.");
  }
  if (!session || session.userId !== payload.sub || !session.user.active)
    throw new ApiError(401, "Your session is invalid or expired.");
  response.locals.user = session.user;
  response.locals.session = session;
  return session;
}
export async function requireAuthenticatedSalonUser(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const session = await sessionFor(request, response, "erp");
    if (!session.user.salon && session.user.role === "PLATFORM_ADMIN") {
      const activeSalon =
        (await prisma.salon.findFirst({
          where: { status: { in: ["ACTIVE", "TRIAL"] } },
        })) || (await prisma.salon.findFirst());
      if (activeSalon) {
        response.locals.salon = activeSalon;
        return next();
      }
    }
    if (
      !session.user.salon ||
      session.user.salon.status === "SUSPENDED" ||
      session.user.salon.status === "ARCHIVED"
    )
      throw new ApiError(403, "This salon account is unavailable.");
    response.locals.salon = session.user.salon;
    next();
  } catch (error) {
    next(error);
  }
}
export async function requirePlatformAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const session = await sessionFor(request, response, "platform");
    if (session.user.role !== "PLATFORM_ADMIN")
      throw new ApiError(403, "Platform administrator access is required.");
    next();
  } catch (error) {
    next(error);
  }
}
export function requirePlatformPermission(permission: PlatformPermission) {
  return (_request: Request, response: Response, next: NextFunction) => {
    if (!hasPlatformPermission(response.locals.user, permission)) {
      next(new ApiError(403, "You do not have permission for this platform operation."));
      return;
    }
    next();
  };
}
export function requireSalonAdmin(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  if (
    response.locals.user?.role !== "SALON_ADMIN" &&
    response.locals.user?.role !== "PLATFORM_ADMIN"
  ) {
    next(new ApiError(403, "Salon administrator access is required."));
    return;
  }
  next();
}
