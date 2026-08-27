import type { NextFunction, Request, RequestHandler, Response } from "express";
import { hasFeature } from "../services/feature.service";
import { ApiError } from "./error.middleware";

export function requireFeature(code: string): RequestHandler {
  return async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const salonId = response.locals.salon?.id as string | undefined;
      if (!salonId) throw new ApiError(401, "Salon context is required.");
      if (!(await hasFeature(salonId, code)))
        throw new ApiError(403, `Your subscription does not include ${code.replace(/_/g, " ")}.`);
      next();
    } catch (error) { next(error); }
  };
}
