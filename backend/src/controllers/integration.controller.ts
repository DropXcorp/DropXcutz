import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { created, ok, salonId } from "./http.controller";
import { ApiError } from "../middleware/error.middleware";
import { integrationCreateInput, integrationPatchInput } from "../validators/integration.validator";

const key = () => `dx_pub_${randomBytes(24).toString("hex")}`;
const domains = (value: unknown) => {
  if (!Array.isArray(value))
    throw new ApiError(400, "allowedDomains must be an array.");
  return [
    ...new Set(
      value.map((item) => {
        if (typeof item !== "string")
          throw new ApiError(400, "Each allowed domain must be text.");
        const domain = item
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "");
        if (!/^[a-z0-9.-]+(?::\d{1,5})?$/.test(domain))
          throw new ApiError(400, "An allowed domain is invalid.");
        return domain;
      }),
    ),
  ];
};
const dto = (item: any, revealKey = false) => ({
  id: item.id,
  isActive: item.isActive,
  allowedDomains: item.allowedDomains,
  publicKey: revealKey
    ? item.publicKey
    : `${item.publicKey.slice(0, 11)}${"•".repeat(12)}`,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export async function getIntegration(_request: Request, response: Response) {
  const item = await prisma.salonIntegration.findFirst({
    where: { salonId: salonId(response) },
    orderBy: { createdAt: "asc" },
  });
  ok(response, item ? dto(item) : null);
}
export async function createIntegration(request: Request, response: Response) {
  const salonIdValue = salonId(response);
  const existing = await prisma.salonIntegration.findFirst({
    where: { salonId: salonIdValue },
  });
  if (existing)
    throw new ApiError(409, "An integration already exists for this salon.");
  const item = await prisma.salonIntegration.create({
    data: {
      salonId: salonIdValue,
      publicKey: key(),
      allowedDomains: domains(integrationCreateInput.parse(request.body).allowedDomains),
    },
  });
  created(response, dto(item, true));
}
export async function updateIntegration(request: Request, response: Response) {
  const item = await prisma.salonIntegration.findFirst({
    where: { id: String(request.params.id), salonId: salonId(response) },
  });
  if (!item) throw new ApiError(404, "Integration not found.");
  const input = integrationPatchInput.parse(request.body);
  const updated = await prisma.salonIntegration.update({
    where: { id: item.id },
    data: {
      ...(input.allowedDomains !== undefined
        ? { allowedDomains: domains(input.allowedDomains) }
        : {}),
      ...(input.isActive !== undefined
        ? { isActive: input.isActive }
        : {}),
    },
  });
  ok(response, dto(updated));
}
export async function rotateIntegrationKey(
  request: Request,
  response: Response,
) {
  const item = await prisma.salonIntegration.findFirst({
    where: { id: String(request.params.id), salonId: salonId(response) },
  });
  if (!item) throw new ApiError(404, "Integration not found.");
  const updated = await prisma.salonIntegration.update({
    where: { id: item.id },
    data: { publicKey: key() },
  });
  ok(response, dto(updated, true));
}
