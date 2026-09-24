import { timingSafeEqual } from "node:crypto";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import { sendEmail } from "./email.service";
import { describeWebsite } from "./website.service";
import { salonNow } from "../utils/salon-time";

const esc = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

export function tokenMatches(stored: string | null, provided: string | undefined) {
  if (!stored || !provided || stored.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(stored), Buffer.from(provided));
}

/** scheduledAt holds the salon's wall-clock time as UTC, so format it in UTC to show the wall clock. */
const whenText = (date: Date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }).format(date);

type AppointmentForMail = Awaited<ReturnType<typeof loadForMail>>;

async function loadForMail(id: string) {
  return prisma.appointment.findUniqueOrThrow({
    where: { id },
    include: { customer: true, employee: true, lines: true, salon: true },
  });
}

async function manageUrl(appointment: AppointmentForMail) {
  const { urls } = await describeWebsite(appointment.salonId);
  const base = urls.live ?? process.env.PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return base && appointment.manageToken ? `${base}/manage/${appointment.id}?token=${appointment.manageToken}` : null;
}

async function emailsEnabled(salonId: string) {
  const settings = await prisma.salonSettings.findUnique({ where: { salonId }, select: { emailEnabled: true } });
  return settings?.emailEnabled ?? true;
}

function layout(salonName: string, title: string, body: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#18181b">
    <div style="background:#18181b;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0"><b style="font-size:18px">${esc(salonName)}</b></div>
    <div style="border:1px solid #e4e4e7;border-top:0;padding:24px;border-radius:0 0 12px 12px">
      <h2 style="margin:0 0 12px;font-size:20px">${esc(title)}</h2>${body}
      <p style="margin-top:24px;font-size:12px;color:#71717a">Sent on behalf of ${esc(salonName)} via DropXcutz.</p>
    </div></div>`;
}

const detailsTable = (appointment: AppointmentForMail) => `
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
    <tr><td style="padding:6px 0;color:#71717a">Booking</td><td style="text-align:right"><b>${esc(appointment.appointmentNumber)}</b></td></tr>
    <tr><td style="padding:6px 0;color:#71717a">When</td><td style="text-align:right">${esc(whenText(appointment.scheduledAt))}</td></tr>
    <tr><td style="padding:6px 0;color:#71717a">Services</td><td style="text-align:right">${esc(appointment.lines.map((line) => line.serviceName).join(", "))}</td></tr>
    ${appointment.employee ? `<tr><td style="padding:6px 0;color:#71717a">Stylist</td><td style="text-align:right">${esc(appointment.employee.name)}</td></tr>` : ""}
    <tr><td style="padding:6px 0;color:#71717a">Amount</td><td style="text-align:right">₹${Number(appointment.totalAmount).toLocaleString("en-IN")} (${esc(appointment.paymentStatus.replace("_", " ").toLowerCase())})</td></tr>
    ${appointment.salon.address ? `<tr><td style="padding:6px 0;color:#71717a">Where</td><td style="text-align:right">${esc([appointment.salon.address, appointment.salon.city].filter(Boolean).join(", "))}</td></tr>` : ""}
  </table>`;

async function sendToCustomer(appointment: AppointmentForMail, subject: string, title: string, intro: string, includeManage = true) {
  const to = appointment.customer.email;
  if (!to || !(await emailsEnabled(appointment.salonId))) return false;
  const link = includeManage ? await manageUrl(appointment) : null;
  const body = `<p style="font-size:14px;line-height:1.6">Hi ${esc(appointment.customer.name)},<br/>${esc(intro)}</p>${detailsTable(appointment)}${
    link ? `<p><a href="${esc(link)}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px">View or cancel booking</a></p>` : ""
  }`;
  await sendEmail({ to, subject, html: layout(appointment.salon.salonName, title, body) });
  return true;
}

/** Confirmation goes out once the booking is firm: paid, or pay-at-salon. */
async function sendPendingConfirmations() {
  const rows = await prisma.appointment.findMany({
    where: {
      source: "WEBSITE",
      confirmationSentAt: null,
      status: { in: ["BOOKED", "CONFIRMED"] },
      createdAt: { gt: new Date(Date.now() - 2 * 86_400_000) },
      OR: [{ holdExpiresAt: null }, { paymentStatus: { not: "PENDING" } }],
    },
    select: { id: true },
    take: 50,
  });
  for (const row of rows) {
    const claimed = await prisma.appointment.updateMany({ where: { id: row.id, confirmationSentAt: null }, data: { confirmationSentAt: new Date() } });
    if (claimed.count === 0) continue;
    try {
      const appointment = await loadForMail(row.id);
      const paid = appointment.paymentStatus === "PAID";
      await sendToCustomer(
        appointment,
        `Booking confirmed — ${appointment.appointmentNumber}`,
        paid ? "Payment received. You're booked!" : "Your booking is confirmed",
        paid ? "Thank you — we've received your payment and your appointment is confirmed." : "Your appointment is booked. Please pay at the salon.",
      );
    } catch (error) {
      console.error("Booking confirmation email failed", error);
    }
  }
}

/** Unpaid online bookings release their slot after the hold window. */
async function expireUnpaidHolds() {
  const rows = await prisma.appointment.findMany({
    where: { status: "BOOKED", paymentStatus: "PENDING", holdExpiresAt: { lt: new Date() } },
    select: { id: true },
    take: 50,
  });
  for (const row of rows) {
    const claimed = await prisma.appointment.updateMany({
      where: { id: row.id, status: "BOOKED", paymentStatus: "PENDING", holdExpiresAt: { lt: new Date() } },
      data: { status: "CANCELLED", holdExpiresAt: null },
    });
    if (claimed.count === 0) continue;
    try {
      const appointment = await loadForMail(row.id);
      await prisma.notification.create({
        data: {
          salonId: appointment.salonId,
          type: "APPOINTMENT",
          title: "Unpaid booking expired",
          message: `${appointment.appointmentNumber} (${appointment.customer.name}) was released because online payment wasn't completed in time.`,
        },
      });
      await sendToCustomer(
        appointment,
        `Booking expired — ${appointment.appointmentNumber}`,
        "Your booking was released",
        "We didn't receive payment in time, so we've released the slot. You're welcome to book again.",
        false,
      );
    } catch (error) {
      console.error("Hold expiry notification failed", error);
    }
  }
}

async function sendReminders() {
  const windows = [
    { field: "reminder24SentAt" as const, fromMin: 23 * 60, toMin: 24 * 60, label: "tomorrow", subject: "Reminder: your appointment is tomorrow" },
    { field: "reminder2SentAt" as const, fromMin: 105, toMin: 120, label: "in about 2 hours", subject: "Reminder: your appointment is in 2 hours" },
  ];
  const nowUtc = Date.now();
  for (const window of windows) {
    // Wall-clock times can differ from real UTC by up to ~14h, so pre-filter wide and refine per salon timezone.
    const rows = await prisma.appointment.findMany({
      where: {
        [window.field]: null,
        status: { in: ["BOOKED", "CONFIRMED"] },
        scheduledAt: { gt: new Date(nowUtc - 15 * 3_600_000), lte: new Date(nowUtc + 40 * 3_600_000) },
        OR: [{ holdExpiresAt: null }, { paymentStatus: { not: "PENDING" } }],
      },
      select: { id: true, scheduledAt: true, salon: { select: { timezone: true } } },
      take: 500,
    });
    for (const row of rows) {
      const minutesAway = (row.scheduledAt.getTime() - salonNow(row.salon.timezone)) / 60_000;
      if (minutesAway <= window.fromMin || minutesAway > window.toMin) continue;
      const claimed = await prisma.appointment.updateMany({ where: { id: row.id, [window.field]: null }, data: { [window.field]: new Date() } });
      if (claimed.count === 0) continue;
      try {
        const appointment = await loadForMail(row.id);
        await sendToCustomer(appointment, `${window.subject} (${appointment.appointmentNumber})`, "Appointment reminder", `This is a friendly reminder that your appointment is ${window.label}.`);
      } catch (error) {
        console.error("Reminder email failed", error);
      }
    }
  }
}

/** Runs every minute from the scheduler. Each step claims rows atomically so overlapping runs never double-send. */
export async function runBookingAutomation() {
  await expireUnpaidHolds();
  await sendPendingConfirmations();
  await sendReminders();
}

/** Customer-facing view for the manage-booking page. */
export async function bookingForCustomer(id: string, token: string | undefined) {
  const appointment = await loadForMail(id).catch(() => null);
  if (!appointment || !tokenMatches(appointment.manageToken, token)) throw new ApiError(403, "This booking link is invalid or has expired.");
  const hoursUntil = (appointment.scheduledAt.getTime() - salonNow(appointment.salon.timezone)) / 3_600_000;
  const cancellable = ["BOOKED", "CONFIRMED"].includes(appointment.status) && hoursUntil >= appointment.salon.cancellationWindowHours;
  return {
    appointment,
    view: {
      id: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      scheduledAt: appointment.scheduledAt,
      timezone: appointment.salon.timezone,
      salonName: appointment.salon.salonName,
      salonPhone: appointment.salon.phone,
      services: appointment.lines.map((line) => ({ name: line.serviceName, price: Number(line.unitPrice) })),
      stylist: appointment.employee?.name ?? null,
      total: Number(appointment.totalAmount),
      due: Math.max(Number(appointment.totalAmount) - Number(appointment.amountPaid), 0),
      holdExpiresAt: appointment.holdExpiresAt,
      cancellable,
      cancellationWindowHours: appointment.salon.cancellationWindowHours,
    },
  };
}

export async function cancelBookingForCustomer(id: string, token: string | undefined) {
  const { appointment, view } = await bookingForCustomer(id, token);
  if (!view.cancellable)
    throw new ApiError(409, `This booking can no longer be cancelled online (cancellations close ${view.cancellationWindowHours}h before the appointment). Please call the salon.`);
  await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED", holdExpiresAt: null } });
  await prisma.notification.create({
    data: {
      salonId: appointment.salonId,
      type: "APPOINTMENT",
      title: "Booking cancelled by customer",
      message: `${appointment.customer.name} cancelled ${appointment.appointmentNumber}.`,
    },
  });
  void sendToCustomer(appointment, `Booking cancelled — ${appointment.appointmentNumber}`, "Your booking was cancelled", "As requested, we've cancelled your appointment.", false).catch((error) => console.error("Cancellation email failed", error));
  return { ...view, status: "CANCELLED" as const, cancellable: false };
}
