import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  assertOwned,
  employeeData,
  employeeDto,
  inventoryData,
  inventoryDto,
  serviceData,
  serviceDto,
} from "../services/salon.service";
import {
  employeeInput,
  employeePatch,
  inventoryInput,
  inventoryPatch,
  serviceInput,
  servicePatch,
} from "../validators/salon.validator";
import { created, ok, salonId } from "./http.controller";

export async function createEmployee(request: Request, response: Response) {
  const input = employeeInput.parse(request.body);
  const item = await prisma.employee.create({
    data: {
      salonId: salonId(response),
      name: input.name,
      role: input.role,
      phone: input.phone,
      email: input.email || null,
      baseSalary: input.baseSalary,
      commissionRate: input.commissionRate,
      active: input.active,
    },
  });
  created(response, employeeDto(item));
}
export async function updateEmployee(request: Request, response: Response) {
  const id = String(request.params.id);
  await assertOwned("employee", id, salonId(response));
  const item = await prisma.employee.update({
    where: { id },
    data: employeeData(employeePatch.parse(request.body)),
  });
  ok(response, employeeDto(item));
}
export async function deleteEmployee(request: Request, response: Response) {
  const id = String(request.params.id);
  await assertOwned("employee", id, salonId(response));
  await prisma.employee.delete({ where: { id } });
  response.status(204).end();
}
export async function createInventory(request: Request, response: Response) {
  const input = inventoryInput.parse(request.body);
  const item = await prisma.inventoryItem.create({
    data: {
      salonId: salonId(response),
      name: input.name,
      sku: input.sku,
      stock: input.stock,
      reorderLevel: input.reorderLevel,
      unitCost: input.unitCost,
      active: input.active,
    },
  });
  created(response, inventoryDto(item));
}
export async function updateInventory(request: Request, response: Response) {
  const id = String(request.params.id);
  await assertOwned("inventoryItem", id, salonId(response));
  const item = await prisma.inventoryItem.update({
    where: { id },
    data: inventoryData(inventoryPatch.parse(request.body)),
  });
  ok(response, inventoryDto(item));
}
export async function deleteInventory(request: Request, response: Response) {
  const id = String(request.params.id);
  await assertOwned("inventoryItem", id, salonId(response));
  await prisma.inventoryItem.delete({ where: { id } });
  response.status(204).end();
}
async function verifyStockLink(
  currentSalonId: string,
  stockItemId?: string | null,
) {
  if (stockItemId)
    await assertOwned("inventoryItem", stockItemId, currentSalonId);
}
export async function createService(request: Request, response: Response) {
  const input = serviceInput.parse(request.body);
  const currentSalonId = salonId(response);
  await verifyStockLink(currentSalonId, input.stockItemId);
  const item = await prisma.service.create({
    data: {
      salonId: currentSalonId,
      name: input.name,
      description: input.description || null,
      price: input.price,
      durationMinutes: input.durationMinutes,
      inventoryItemId: input.stockItemId || null,
      inventoryQuantity: input.inventoryQuantity,
      active: input.active,
    },
  });
  created(response, serviceDto(item));
}
export async function updateService(request: Request, response: Response) {
  const id = String(request.params.id);
  const currentSalonId = salonId(response);
  const input = servicePatch.parse(request.body);
  await assertOwned("service", id, currentSalonId);
  await verifyStockLink(currentSalonId, input.stockItemId);
  const item = await prisma.service.update({
    where: { id },
    data: serviceData(input),
  });
  ok(response, serviceDto(item));
}
export async function deleteService(request: Request, response: Response) {
  const id = String(request.params.id);
  await assertOwned("service", id, salonId(response));
  await prisma.service.delete({ where: { id } });
  response.status(204).end();
}
