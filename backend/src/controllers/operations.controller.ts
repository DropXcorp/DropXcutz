import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  assertOwned,
  createInvoice,
  createPayroll,
  invoiceDto,
  payrollDto,
  refreshCustomerSpend,
  saveAppointment,
} from "../services/salon.service";
import {
  appointmentInput,
  invoiceInput,
  invoicePatch,
  payrollInput,
  payrollPatch,
} from "../validators/salon.validator";
import { created, ok, salonId } from "./http.controller";

export async function createAppointment(request: Request, response: Response) {
  created(
    response,
    await saveAppointment(
      salonId(response),
      null,
      appointmentInput.parse(request.body),
    ),
  );
}
export async function updateAppointment(request: Request, response: Response) {
  ok(
    response,
    await saveAppointment(
      salonId(response),
      String(request.params.id),
      appointmentInput.parse(request.body),
    ),
  );
}
export async function deleteAppointment(request: Request, response: Response) {
  const id = String(request.params.id);
  await assertOwned("appointment", id, salonId(response));
  await prisma.appointment.delete({ where: { id } });
  response.status(204).end();
}
export async function createInvoiceController(
  request: Request,
  response: Response,
) {
  created(
    response,
    await createInvoice(salonId(response), invoiceInput.parse(request.body)),
  );
}
export async function updateInvoice(request: Request, response: Response) {
  const id = String(request.params.id);
  const currentSalonId = salonId(response);
  const input = invoicePatch.parse(request.body);
  await assertOwned("invoice", id, currentSalonId);
  if (input.customerId)
    await assertOwned("customer", input.customerId, currentSalonId);
  if (input.appointmentId)
    await assertOwned("appointment", input.appointmentId, currentSalonId);
  const item = await prisma.$transaction(async (client) => {
    const previous = await client.invoice.findUniqueOrThrow({
      where: { id },
      select: { customerId: true },
    });
    const item = await client.invoice.update({
      where: { id },
      data: {
      ...(input.customerId !== undefined && { customerId: input.customerId }),
      ...(input.appointmentId !== undefined && {
        appointmentId: input.appointmentId || null,
      }),
      ...(input.amount !== undefined && {
        subtotal: input.amount,
        totalAmount: input.amount,
      }),
      ...(input.status !== undefined && {
        status: {
          Paid: "PAID",
          Pending: "PENDING",
          "Partially Paid": "PARTIALLY_PAID",
          Refunded: "REFUNDED",
        }[input.status] as any,
        amountPaid: input.status === "Paid" ? input.amount : 0,
      }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
      },
    });
    if (item.appointmentId && input.status !== undefined) {
      await client.appointment.update({
        where: { id: item.appointmentId },
        data: {
          amountPaid: input.status === "Paid" ? (input.amount ?? Number(item.totalAmount)) : 0,
          paymentStatus: ({ Paid: "PAID", Pending: "PENDING", "Partially Paid": "PARTIALLY_PAID", Refunded: "REFUNDED" }[input.status] as any),
        },
      });
    }
    await refreshCustomerSpend(client, previous.customerId);
    if (item.customerId !== previous.customerId)
      await refreshCustomerSpend(client, item.customerId);
    return item;
  });
  ok(response, invoiceDto(item));
}
export async function deleteInvoice(request: Request, response: Response) {
  const id = String(request.params.id);
  await assertOwned("invoice", id, salonId(response));
  await prisma.$transaction(async (client) => {
    const invoice = await client.invoice.findUniqueOrThrow({
      where: { id },
      select: { customerId: true },
    });
    await client.invoice.delete({ where: { id } });
    await refreshCustomerSpend(client, invoice.customerId);
  });
  response.status(204).end();
}
export async function createPayrollController(
  request: Request,
  response: Response,
) {
  created(
    response,
    await createPayroll(salonId(response), payrollInput.parse(request.body)),
  );
}
export async function updatePayroll(request: Request, response: Response) {
  const id = String(request.params.id);
  const currentSalonId = salonId(response);
  const input = payrollPatch.parse(request.body);
  await assertOwned("payrollRun", id, currentSalonId);
  if (input.employeeId)
    await assertOwned("employee", input.employeeId, currentSalonId);
  const item = await prisma.payrollRun.update({
    where: { id },
    data: {
      ...(input.employeeId !== undefined && { employeeId: input.employeeId }),
      ...(input.month !== undefined && { month: input.month }),
      ...(input.baseSalary !== undefined && { baseSalary: input.baseSalary }),
      ...(input.commission !== undefined && { commission: input.commission }),
      ...(input.deductions !== undefined && { deductions: input.deductions }),
      ...(input.status !== undefined && {
        status: input.status === "Paid" ? "PAID" : "DRAFT",
        paidAt: input.status === "Paid" ? new Date() : null,
      }),
    },
  });
  ok(response, payrollDto(item));
}
export async function deletePayroll(request: Request, response: Response) {
  const id = String(request.params.id);
  await assertOwned("payrollRun", id, salonId(response));
  await prisma.payrollRun.delete({ where: { id } });
  response.status(204).end();
}
