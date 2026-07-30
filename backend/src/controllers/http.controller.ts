import type { Response } from "express";

export const salonId = (response: Response) => String(response.locals.salon.id);
export const ok = (response: Response, data: unknown) =>
  response.json({ data });
export const created = (response: Response, data: unknown) =>
  response.status(201).json({ data });
