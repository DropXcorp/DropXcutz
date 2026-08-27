import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import { publicBookingInput } from "../validators/public-booking.validator";
import { hasFeature } from "../services/feature.service";

const activeAppointment = {
  status: { notIn: ["CANCELLED", "NO_SHOW"] as ("CANCELLED" | "NO_SHOW")[] },
};

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (hour === undefined || minute === undefined || hour > 23 || minute > 59)
    throw new ApiError(400, "Time must be in HH:mm format.");
  return hour * 60 + minute;
}

function assertDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || parsed.toISOString().slice(0, 10) !== value)
    throw new ApiError(400, "A valid date is required.");
}

function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Converts a salon-local wall-clock date and time to its actual UTC instant. */
function atSalonTime(date: string, time: string, timezone: string) {
  assertDate(date);
  const total = minutes(time);
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    throw new ApiError(500, "The salon timezone is invalid.");
  }
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(wallClock)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  const displayedAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
  return new Date(wallClock - (displayedAsUtc - wallClock));
}

function durationEnd(date: string, time: string, duration: number, timezone: string) {
  return new Date(atSalonTime(date, time, timezone).getTime() + duration * 60_000);
}

async function salonForPublic(response: Response) {
  const salon = response.locals.salon;
  if (!salon) throw new ApiError(401, "A valid integration key is required.");
  if (!salon.allowOnlineBooking)
    throw new ApiError(403, "Online booking is currently unavailable.");
  if (!(await hasFeature(salon.id, "ONLINE_BOOKING")))
    throw new ApiError(403, "Online booking is not included in this subscription.");
  return salon;
}

export async function publicSalon(request: Request, response: Response) {
  const salon = await salonForPublic(response);
  response.json({
    data: {
      slug: salon.slug,
      name: salon.salonName,
      logoUrl: salon.logoUrl,
      phone: salon.phone,
      email: salon.email,
      address: salon.address,
      city: salon.city,
      openingTime: salon.openingTime,
      closingTime: salon.closingTime,
      timezone: salon.timezone,
    },
  });
}

export async function publicServices(request: Request, response: Response) {
  const salon = await salonForPublic(response);
  const services = await prisma.service.findMany({
    where: { salonId: salon.id, active: true, isPublic: true },
    orderBy: { name: "asc" },
  });
  response.json({
    data: services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: Number(service.price),
      durationMinutes: service.durationMinutes,
    })),
  });
}

export async function publicEmployees(request: Request, response: Response) {
  const salon = await salonForPublic(response);
  const serviceId =
    typeof request.query.serviceId === "string"
      ? request.query.serviceId
      : undefined;
  const employees = await prisma.employee.findMany({
    where: {
      salonId: salon.id,
      active: true,
      isBookable: true,
      ...(serviceId ? { employeeServices: { some: { serviceId } } } : {}),
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
  response.json({ data: employees });
}

export async function publicAvailability(request: Request, response: Response) {
  const salon = await salonForPublic(response);
  const serviceId = String(request.query.serviceId ?? "");
  const employeeId = String(request.query.employeeId ?? "");
  const date = String(request.query.date ?? "");
  assertDate(date);
  const [service, employee] = await Promise.all([
    prisma.service.findFirst({
      where: { id: serviceId, salonId: salon.id, active: true, isPublic: true },
    }),
    prisma.employee.findFirst({
      where: {
        id: employeeId,
        salonId: salon.id,
        active: true,
        isBookable: true,
        employeeServices: { some: { serviceId } },
      },
    }),
  ]);
  if (!service || !employee)
    throw new ApiError(
      400,
      "The selected service or specialist is unavailable.",
    );
  const start = atSalonTime(date, "00:00", salon.timezone);
  const end = atSalonTime(nextDate(date), "00:00", salon.timezone);
  const booked = await prisma.appointment.findMany({
    where: {
      salonId: salon.id,
      employeeId,
      scheduledAt: { gte: start, lt: end },
      ...activeAppointment,
    },
    select: { scheduledAt: true, durationMinutes: true },
  });
  const opening = minutes(salon.openingTime);
  const closing = minutes(salon.closingTime);
  const interval = salon.appointmentSlotMinutes;
  const available: string[] = [];
  for (
    let slot = opening;
    slot + service.durationMinutes <= closing;
    slot += interval
  ) {
    const time = `${String(Math.floor(slot / 60)).padStart(2, "0")}:${String(slot % 60).padStart(2, "0")}`;
    const slotStart = atSalonTime(date, time, salon.timezone).getTime();
    const slotEnd = slotStart + service.durationMinutes * 60_000;
    if (
      !booked.some(
        (item) =>
          slotStart <
            item.scheduledAt.getTime() + item.durationMinutes * 60_000 &&
          slotEnd > item.scheduledAt.getTime(),
      )
    )
      available.push(time);
  }
  response.json({ data: { date, slots: available } });
}

export async function createPublicBooking(
  request: Request,
  response: Response,
) {
  const input = publicBookingInput.parse(request.body);
  const salon = await salonForPublic(response);
  const scheduledAt = atSalonTime(input.date, input.time, salon.timezone);
  if (scheduledAt <= new Date())
    throw new ApiError(400, "Please select a future appointment time.");
  const requestedMinutes = minutes(input.time);
  if (
    requestedMinutes < minutes(salon.openingTime) ||
    requestedMinutes >= minutes(salon.closingTime)
  )
    throw new ApiError(
      400,
      "The selected time is outside salon working hours.",
    );
  const booking = await prisma.$transaction(
    async (client) => {
      if (input.requestId) {
        const existing = await client.appointment.findFirst({
          where: { salonId: salon.id, websiteRequestId: input.requestId },
          include: { customer: true },
        });
        if (existing) return existing;
      }
      const service = await client.service.findFirst({
        where: {
          id: input.serviceId,
          salonId: salon.id,
          active: true,
          isPublic: true,
        },
      });
      const employee = await client.employee.findFirst({
        where: {
          id: input.employeeId,
          salonId: salon.id,
          active: true,
          isBookable: true,
          employeeServices: { some: { serviceId: input.serviceId } },
        },
      });
      if (!service || !employee)
        throw new ApiError(
          400,
          "The selected service or specialist is unavailable.",
        );
      const dayStart = atSalonTime(input.date, "00:00", salon.timezone);
      const dayEnd = atSalonTime(nextDate(input.date), "00:00", salon.timezone);
      const existing = await client.appointment.findMany({
        where: {
          salonId: salon.id,
          employeeId: employee.id,
          scheduledAt: { gte: dayStart, lt: dayEnd },
          ...activeAppointment,
        },
        select: { scheduledAt: true, durationMinutes: true },
      });
      const end = durationEnd(
        input.date,
        input.time, service.durationMinutes, salon.timezone,
      ).getTime();
      if (end > atSalonTime(input.date, salon.closingTime, salon.timezone).getTime())
        throw new ApiError(
          400,
          "The selected service does not fit within salon working hours.",
        );
      if (
        existing.some(
          (item) =>
            scheduledAt.getTime() <
              item.scheduledAt.getTime() + item.durationMinutes * 60_000 &&
            end > item.scheduledAt.getTime(),
        )
      )
        throw new ApiError(
          409,
          "That time was just booked. Please select another slot.",
        );
      const customer = await client.customer.upsert({
        where: {
          salonId_phone: { salonId: salon.id, phone: input.customer.phone },
        },
        update: {
          name: input.customer.name,
          ...(input.customer.email ? { email: input.customer.email } : {}),
        },
        create: {
          salonId: salon.id,
          name: input.customer.name,
          phone: input.customer.phone,
          email: input.customer.email ?? null,
        },
      });
      const counter = await client.salon.update({
        where: { id: salon.id },
        data: { nextAppointmentNumber: { increment: 1 } },
        select: { nextAppointmentNumber: true },
      });
      return client.appointment.create({
        data: {
          salonId: salon.id,
          appointmentNumber: `APT-${counter.nextAppointmentNumber - 1}`,
          customerId: customer.id,
          employeeId: employee.id,
          source: "WEBSITE",
          websiteRequestId: input.requestId,
          scheduledAt,
          durationMinutes: service.durationMinutes,
          subtotal: service.price,
          taxAmount: 0,
          totalAmount: service.price,
          amountPaid: 0,
          paymentStatus: "PENDING",
          status: "BOOKED",
          notes: input.notes ?? null,
          lines: {
            create: {
              serviceId: service.id,
              serviceName: service.name,
              unitPrice: service.price,
              durationMinutes: service.durationMinutes,
            },
          },
        },
        include: { customer: true, employee: true, lines: true },
      });
    },
    { isolationLevel: "Serializable" },
  );
  response
    .status(201)
    .json({
      data: {
        id: booking.id,
        appointmentNumber: booking.appointmentNumber,
        status: booking.status,
        scheduledAt: booking.scheduledAt,
        customer: booking.customer.name,
      },
    });
}
