import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./error.middleware";

export function securityHeaders(_request: Request, response: Response, next: NextFunction) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  next();
}

/** Reject cross-origin writes when browser cookies are used for authentication. */
export function requireTrustedOrigin(request: Request, _response: Response, next: NextFunction) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return next();
  const origin = request.header("origin");
  if (!origin) return next(); // non-browser clients do not send Origin
  const allowed = (process.env.FRONTEND_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",").map((value) => value.trim());
  if (!allowed.includes(origin)) return next(new ApiError(403, "Request origin is not allowed."));
  next();
}
