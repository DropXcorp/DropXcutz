import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import { publicBookingInput } from "../validators/public-booking.validator";
import { hasFeature } from "../services/feature.service";
import { salonNow, wallTime } from "../utils/salon-time";

const activeAppointment = {
  status: { notIn: ["CANCELLED", "NO_SHOW"] as ("CANCELLED" | "NO_SHOW")[] },
};

/** Unpaid online bookings only hold their slot until holdExpiresAt. */
const notExpiredHold = () => ({
  OR: [
    { holdExpiresAt: null },
    { holdExpiresAt: { gt: new Date() } },
    { paymentStatus: { not: "PENDING" as const } },
  ],
});

const MIN_LEAD_MINUTES = 15;
const holdMinutes = () => Math.min(Math.max(Number(process.env.BOOKING_HOLD_MINUTES ?? 15) || 15, 5), 120);

/** Booking-window and staff-leave rules shared by availability and booking creation. */
async function dayBlockedReason(salonId: string, employeeId: string, date: string, timezone: string) {
  const settings = await prisma.salonSettings.findUnique({ where: { salonId }, select: { bookingWindowDays: true } });
  const windowDays = settings?.bookingWindowDays ?? 30;
  const dayStart = atSalonTime(date, "00:00", timezone).getTime();
  if (dayStart > salonNow(timezone) + windowDays * 86_400_000)
    return `Bookings open up to ${windowDays} days ahead.`;
  const day = new Date(`${date}T00:00:00.000Z`);
  const leave = await prisma.leaveRequest.findFirst({
    where: { employeeId, status: "APPROVED", startDate: { lte: day }, endDate: { gte: day } },
    select: { id: true },
  });
  if (leave) return "This specialist is on leave that day.";
  return null;
}

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (hour === undefined || minute === undefined || hour > 23 || minute > 59)
    throw new ApiError(400, "Time must be in HH:mm format.");
  return hour * 60 + minute;
}

function assertDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    parsed.toISOString().slice(0, 10) !== value
  )
    throw new ApiError(400, "A valid date is required.");
}

function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Salon wall-clock date+time in the ERP's wall-clock-as-UTC storage convention (see utils/salon-time.ts). */
function atSalonTime(date: string, time: string, _timezone: string) {
  assertDate(date);
  minutes(time);
  return wallTime(date, time);
}

function durationEnd(
  date: string,
  time: string,
  duration: number,
  timezone: string,
) {
  return new Date(
    atSalonTime(date, time, timezone).getTime() + duration * 60_000,
  );
}

export async function salonForPublic(response: Response) {
  const salon = response.locals.salon;
  if (!salon) throw new ApiError(401, "A valid integration key is required.");
  if (!salon.allowOnlineBooking)
    throw new ApiError(403, "Online booking is currently unavailable.");
  if (!(await hasFeature(salon.id, "ONLINE_BOOKING")))
    throw new ApiError(
      403,
      "Online booking is not included in this subscription.",
    );
  // allowOnlinePayments lives on SalonSettings (not Salon); default is on when the salon has no settings row.
  const settings = await prisma.salonSettings.findUnique({ where: { salonId: salon.id }, select: { allowOnlinePayments: true } });
  return { ...salon, allowOnlinePayments: settings?.allowOnlinePayments ?? true } as typeof salon & { allowOnlinePayments: boolean };
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
      onlinePaymentsConfigured: Boolean(
        salon.allowOnlinePayments &&
          salon.razorpayKeyId &&
          salon.razorpayKeySecretCipher,
      ),
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
  const blocked = await dayBlockedReason(salon.id, employee.id, date, salon.timezone);
  if (blocked) {
    response.json({ data: { date, slots: [], reason: blocked } });
    return;
  }
  const start = atSalonTime(date, "00:00", salon.timezone);
  const end = atSalonTime(nextDate(date), "00:00", salon.timezone);
  const booked = await prisma.appointment.findMany({
    where: {
      salonId: salon.id,
      employeeId,
      scheduledAt: { gte: start, lt: end },
      ...activeAppointment,
      ...notExpiredHold(),
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
    if (slotStart < salonNow(salon.timezone) + MIN_LEAD_MINUTES * 60_000) continue;
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
  if (scheduledAt.getTime() <= salonNow(salon.timezone))
    throw new ApiError(400, "Please select a future appointment time.");
  const blocked = await dayBlockedReason(salon.id, input.employeeId, input.date, salon.timezone);
  if (blocked) throw new ApiError(400, blocked);
  const requestedMinutes = minutes(input.time);
  if (
    requestedMinutes < minutes(salon.openingTime) ||
    requestedMinutes >= minutes(salon.closingTime)
  )
    throw new ApiError(
      400,
      "The selected time is outside salon working hours.",
    );
  const onlinePayable = Boolean(salon.allowOnlinePayments && salon.razorpayKeyId && salon.razorpayKeySecretCipher);
  const runBooking = () => prisma.$transaction(
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
          ...notExpiredHold(),
        },
        select: { scheduledAt: true, durationMinutes: true },
      });
      const end = durationEnd(
        input.date,
        input.time,
        service.durationMinutes,
        salon.timezone,
      ).getTime();
      if (
        end >
        atSalonTime(input.date, salon.closingTime, salon.timezone).getTime()
      )
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
      const createdAppointment = await client.appointment.create({
        data: {
          salonId: salon.id,
          appointmentNumber: `APT-${counter.nextAppointmentNumber - 1}`,
          customerId: customer.id,
          employeeId: employee.id,
          source: "WEBSITE",
          websiteRequestId: input.requestId,
          manageToken: randomBytes(24).toString("base64url"),
          holdExpiresAt: onlinePayable ? new Date(Date.now() + holdMinutes() * 60_000) : null,
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

      await client.notification.create({
        data: {
          salonId: salon.id,
          type: "APPOINTMENT",
          title: "New Online Booking",
          message: `${customer.name} booked ${service.name} for ${input.date} at ${input.time} (${createdAppointment.appointmentNumber}).`,
        },
      });

      return createdAppointment;
    },
    { isolationLevel: "Serializable" },
  );
  let booking: Awaited<ReturnType<typeof runBooking>> | undefined;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      booking = await runBooking();
      break;
    } catch (error) {
      if ((error as { code?: string }).code !== "P2034" || attempt === 3) {
        if ((error as { code?: string }).code === "P2034")
          throw new ApiError(409, "That time was just booked. Please select another slot.");
        throw error;
      }
    }
  }
  if (!booking) throw new ApiError(503, "Booking could not be completed. Please try again.");
  response.status(201).json({
    data: {
      id: booking.id,
      appointmentNumber: booking.appointmentNumber,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      customer: booking.customer.name,
      manageToken: booking.manageToken,
      holdExpiresAt: booking.holdExpiresAt,
    },
  });
}
