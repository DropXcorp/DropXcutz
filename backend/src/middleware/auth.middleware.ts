import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../middleware/error.middleware";
import { requireSalon } from "../services/salon.service";

export async function requireSalonTenant(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const header = request.header("x-salon-code")?.trim();
    const code =
      header ||
      (process.env.NODE_ENV === "production"
        ? ""
        : (process.env.DEFAULT_SALON_CODE ?? "dropx-studio"));
    if (!code) throw new ApiError(400, "The x-salon-code header is required.");
    response.locals.salon = await requireSalon(code);
    next();
  } catch (error) {
    next(error);
  }
}

export function requirePlatformKey(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const expected = process.env.SUPER_ADMIN_API_KEY;
    if (!expected)
      throw new ApiError(503, "Platform administration is not configured.");
    const actual = request.header("x-super-admin-key") ?? "";
    const expectedBytes = Buffer.from(expected);
    const actualBytes = Buffer.from(actual);
    if (
      expectedBytes.length !== actualBytes.length ||
      !timingSafeEqual(expectedBytes, actualBytes)
    )
      throw new ApiError(401, "Invalid platform administration key.");
    next();
  } catch (error) {
    next(error);
  }
}
