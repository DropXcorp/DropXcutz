import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import { getSnapshot, settingsDto } from "../services/salon.service";
import { settingsUpdateInput } from "../validators/salon.validator";
import { ok, salonId } from "./http.controller";

export async function bootstrap(_request: Request, response: Response) {
  ok(response, await getSnapshot(salonId(response)));
}
export async function updateSettings(request: Request, response: Response) {
  const input = settingsUpdateInput.parse(request.body);
  const item = await prisma.salon.update({
    where: { id: salonId(response) },
    data: {
      ...input,
      gstin: input.gstin || null,
      logoUrl: input.logoUrl || null,
      website: input.website || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      postalCode: input.postalCode || null,
    },
  });
  ok(response, settingsDto(item));
}



export async function listNotifications(_request: Request, response: Response) {
  ok(
    response,
    await prisma.notification.findMany({
      where: { salonId: salonId(response) },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  );
}


export async function markNotificationRead(
  request: Request,
  response: Response,
) {
  const id = String(request.params.id);
  const currentSalonId = salonId(response);
  const item = await prisma.notification.findFirst({
    where: { id, salonId: currentSalonId },
  });
  if (!item) throw new ApiError(404, "Notification not found.");
  ok(
    response,
    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    }),
  );
}
