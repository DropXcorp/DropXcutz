import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function notFound(_request: Request, response: Response) {
  response.status(404).json({ error: "Route not found." });
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    response.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({
      error: "Invalid request data.",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      response
        .status(409)
        .json({ error: "A record with the same unique value already exists." });
      return;
    }
    if (error.code === "P2003") {
      response
        .status(409)
        .json({
          error:
            "This record is still used by another salon record and cannot be deleted.",
        });
      return;
    }
    if (error.code === "P2025") {
      response.status(404).json({ error: "Record not found." });
      return;
    }
  }
  console.error(error);
  response.status(500).json({ error: "An unexpected server error occurred." });
}
