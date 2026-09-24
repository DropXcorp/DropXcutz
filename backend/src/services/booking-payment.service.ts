import { prisma } from "../config/prisma";

/**
 * Credits an online payment exactly once. The conditional update means a webhook and a
 * checkout-verify racing each other can never both add the amount to the appointment.
 */
export async function markPaymentPaid(paymentId: string, razorpayPaymentId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: { not: "PAID" } },
      data: { status: "PAID", razorpayPaymentId, paidAt: new Date() },
    });
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (claimed.count === 0 || !payment.appointmentId) return { payment, credited: false, appointmentId: payment.appointmentId };

    const bumped = await tx.appointment.update({
      where: { id: payment.appointmentId },
      data: { amountPaid: { increment: payment.amount } },
    });
    const fullyPaid = Number(bumped.amountPaid) >= Number(bumped.totalAmount);
    await tx.appointment.update({
      where: { id: bumped.id },
      data: {
        paymentStatus: fullyPaid ? "PAID" : "PARTIALLY_PAID",
        holdExpiresAt: null,
        ...(bumped.status === "BOOKED" ? { status: "CONFIRMED" } : {}),
      },
    });
    return { payment, credited: true, appointmentId: bumped.id };
  });
  return result;
}

export async function notifyPaymentIssue(salonId: string, title: string, message: string) {
  await prisma.notification.create({ data: { salonId, type: "PAYMENT", title, message } });
}
