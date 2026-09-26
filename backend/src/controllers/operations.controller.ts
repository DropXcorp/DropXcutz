import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
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
  const statusToDb = {
    Paid: "PAID",
    Pending: "PENDING",
    "Partially Paid": "PARTIALLY_PAID",
    Refunded: "REFUNDED",
  } as const;
  const item = await prisma.$transaction(async (client) => {
    const previous = await client.invoice.findUniqueOrThrow({
      where: { id },
      select: { customerId: true, appointmentId: true, totalAmount: true, status: true },
    });
    const finalAmount = input.amount ?? Number(previous.totalAmount);
    const finalStatus = input.status ?? (Object.entries(statusToDb).find(([, v]) => v === previous.status)?.[0] as keyof typeof statusToDb);
    const finalAmountPaid =
      finalStatus === "Paid"
        ? finalAmount
        : finalStatus === "Partially Paid"
          ? Math.min(Math.max(Number(input.amountReceived ?? 0), 0), finalAmount)
          : 0;
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
      ...((input.amount !== undefined || input.status !== undefined) && {
        status: statusToDb[finalStatus],
        amountPaid: finalAmountPaid,
      }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
      },
    });
    const appointmentChanged =
      input.appointmentId !== undefined && input.appointmentId !== previous.appointmentId;
    if (appointmentChanged && previous.appointmentId) {
      await client.appointment.update({
        where: { id: previous.appointmentId },
        data: { amountPaid: 0, paymentStatus: "PENDING" },
      });
    }
    if (item.appointmentId && (input.status !== undefined || input.amount !== undefined || appointmentChanged)) {
      await client.appointment.update({
        where: { id: item.appointmentId },
        data: {
          amountPaid: finalAmountPaid,
          paymentStatus: statusToDb[finalStatus],
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
      select: { customerId: true, appointmentId: true },
    });
    await client.invoice.delete({ where: { id } });
    if (invoice.appointmentId) {
      await client.appointment.update({
        where: { id: invoice.appointmentId },
        data: { amountPaid: 0, paymentStatus: "PENDING" },
      });
    }
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
  const editsFigures =
    input.employeeId !== undefined ||
    input.month !== undefined ||
    input.baseSalary !== undefined ||
    input.commission !== undefined ||
    input.deductions !== undefined;
  if (editsFigures) {
    const current = await prisma.payrollRun.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });
    if (current.status === "PAID")
      throw new ApiError(409, "A paid payroll run cannot be edited.");
  }
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
