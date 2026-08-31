import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../config/prisma";

const REMINDER_DAYS = [7, 3, 1] as const;
const DAY_MS = 24 * 60 * 60 * 1_000;

export async function sendDueTrialReminders(now = new Date()) {
  const sent: Array<{ salonId: string; reminderDay: number }> = [];

  for (const reminderDay of REMINDER_DAYS) {
    const start = new Date(now.getTime() + reminderDay * DAY_MS);
    const end = new Date(start.getTime() + DAY_MS);
    const salons = await prisma.salon.findMany({
      where: { status: "TRIAL", trialEndsAt: { gte: start, lt: end } },
      select: { id: true, salonName: true, trialEndsAt: true },
    });

    for (const salon of salons) {
      if (!salon.trialEndsAt) continue;
      try {
        await prisma.$transaction(async (tx) => {
          await tx.trialReminder.create({
            data: { salonId: salon.id, trialEndsAt: salon.trialEndsAt!, reminderDay },
          });
          await tx.notification.create({
            data: {
              salonId: salon.id,
              type: "SYSTEM",
              title: "Trial expiry reminder",
              message: `Your ${salon.salonName} trial expires in ${reminderDay} day${reminderDay === 1 ? "" : "s"}. Contact platform support to continue your subscription.`,
            },
          });
        });
        sent.push({ salonId: salon.id, reminderDay });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
          throw error;
        }
      }
    }
  }

  return sent;
}
