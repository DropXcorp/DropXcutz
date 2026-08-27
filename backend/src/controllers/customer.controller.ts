import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import {
  assertOwned,
  customerData,
  customerDto,
} from "../services/salon.service";
import { customerInput, customerPatch } from "../validators/salon.validator";
import { created, ok, salonId } from "./http.controller";
import { loyaltyAdjustmentInput } from "../validators/loyalty.validator";

export async function createCustomer(request: Request, response: Response) {
  const input = customerInput.parse(request.body);
  const item = await prisma.customer.create({
    data: {
      salonId: salonId(response),
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      membership: (
        { Standard: "STANDARD", Silver: "SILVER", Gold: "GOLD" } as const
      )[input.membership],
      points: input.points ?? 0,
      totalSpend: input.totalSpend ?? 0,
      notes: input.notes || null,
    },
  });
  created(response, customerDto(item));
}

export async function updateCustomer(request: Request, response: Response) {
  const id = String(request.params.id);
  const currentSalonId = salonId(response);
  await assertOwned("customer", id, currentSalonId);
  const item = await prisma.customer.update({
    where: { id },
    data: customerData(customerPatch.parse(request.body)),
  });
  ok(response, customerDto(item));
}

export async function deleteCustomer(request: Request, response: Response) {
  const id = String(request.params.id);
  await assertOwned("customer", id, salonId(response));
  await prisma.customer.delete({ where: { id } });
  response.status(204).end();
}

export async function adjustLoyalty(request: Request, response: Response) {
  const currentSalonId = salonId(response);
  const customerId = String(request.params.customerId);
  await assertOwned("customer", customerId, currentSalonId);
  const { points, description } = loyaltyAdjustmentInput.parse(request.body);
  const result = await prisma.$transaction(async (client) => {
    const customer = await client.customer.findUniqueOrThrow({
      where: { id: customerId },
    });
    if (customer.points + points < 0)
      throw new ApiError(
        400,
        "The customer does not have enough loyalty points.",
      );
    await client.loyaltyEntry.create({
      data: {
        salonId: currentSalonId,
        customerId,
        type: "ADJUSTMENT",
        points,
        description: description || "Manual adjustment",
      },
    });
    return client.customer.update({
      where: { id: customerId },
      data: { points: { increment: points } },
    });
  });
  ok(response, customerDto(result));
}
