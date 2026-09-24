import { prisma } from "../config/prisma";
import { audit } from "../controllers/platform.controller";
import { sendEmail } from "./email.service";

const suspendLapsedSalon = async (
  salon: { id: string; salonName: string; adminEmail: string },
  action: string,
  emailSubject: string,
  emailBody: string,
) => {
  await prisma.$transaction(async (tx) => {
    await tx.salon.update({ where: { id: salon.id }, data: { status: "SUSPENDED" } });
    await tx.notification.create({
      data: { salonId: salon.id, type: "SYSTEM", title: emailSubject, message: emailBody },
    });
  });
  await audit(undefined, action, "SALON", salon.id, { salonName: salon.salonName });
  void sendEmail({ to: salon.adminEmail, subject: emailSubject, html: `<p>${emailBody}</p>` }).catch((error) =>
    console.error("Lifecycle email send failed", error),
  );
};

/** Keeps persisted subscription status aligned with expiry, then suspends any salon whose access should now end. */
export async function enforceLifecycle() {
  const now = new Date();

  const expired = await prisma.subscription.updateMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] }, expiresAt: { lte: now } },
    data: { status: "EXPIRED" },
  });

  const expiredTrialSalons = await prisma.salon.findMany({
    where: { status: "TRIAL", trialEndsAt: { lte: now } },
    select: { id: true, salonName: true, adminEmail: true },
  });
  for (const salon of expiredTrialSalons) {
    await suspendLapsedSalon(
      salon,
      "SALON_TRIAL_AUTO_SUSPENDED",
      "Trial expired",
      `Your ${salon.salonName} trial has ended and access has been suspended. Contact platform support to continue your subscription.`,
    );
  }

  const lapsedPaidSalons = await prisma.salon.findMany({
    where: { status: "ACTIVE", subscriptions: { none: { status: { in: ["ACTIVE", "TRIAL"] } } } },
    select: { id: true, salonName: true, adminEmail: true },
  });
  for (const salon of lapsedPaidSalons) {
    await suspendLapsedSalon(
      salon,
      "SALON_SUBSCRIPTION_AUTO_SUSPENDED",
      "Subscription expired",
      `Your ${salon.salonName} subscription has ended and access has been suspended. Contact platform support to renew.`,
    );
  }

  return {
    expiredSubscriptions: expired.count,
    suspendedTrials: expiredTrialSalons.length,
    suspendedPaid: lapsedPaidSalons.length,
  };
}
