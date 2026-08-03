import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "./error.middleware";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32)
    throw new ApiError(503, "JWT authentication is not configured.");
  return value;
};
async function sessionFor(request: Request, response: Response) {
  const token = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("dropxcutz_session="))
    ?.slice("dropxcutz_session=".length);
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
    include: { user: { include: { salon: true } } },
  });
  if (
    !session ||
    session.userId !== payload.sub ||
    session.expiresAt <= new Date() ||
    !session.user.active
  )
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
    const session = await sessionFor(request, response);
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
    const session = await sessionFor(request, response);
    if (session.user.role !== "PLATFORM_ADMIN")
      throw new ApiError(403, "Platform administrator access is required.");
    next();
  } catch (error) {
    next(error);
  }
}
export function requireSalonAdmin(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  if (response.locals.user?.role !== "SALON_ADMIN") {
    next(new ApiError(403, "Salon administrator access is required."));
    return;
  }
  next();
}
