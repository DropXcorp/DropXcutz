import { enforceLifecycle } from "./subscription.service";
import { sendDueTrialReminders } from "./trial-reminder.service";
import { verifyPendingDomains } from "./domain-automation.service";
import { runBookingAutomation } from "./booking-automation.service";
export function startScheduler() {
  const run = (name: string, task: () => Promise<unknown>) =>
    void task().catch((error) => console.error(`${name} failed`, error));
  run("Subscription lifecycle check", enforceLifecycle);
  run("Trial reminder job", sendDueTrialReminders);
  let bookingRunning = false;
  const runBookings = () => {
    if (bookingRunning) return;
    bookingRunning = true;
    void runBookingAutomation()
      .catch((error) => console.error("Booking automation failed", error))
      .finally(() => {
        bookingRunning = false;
      });
  };
  runBookings();
  const bookingTimer = setInterval(runBookings, 60_000);
  run("Domain verification", verifyPendingDomains);
  const domainTimer = setInterval(() => run("Domain verification", verifyPendingDomains), 5 * 60_000);
  const subscriptionTimer = setInterval(
    () => run("Subscription lifecycle check", enforceLifecycle),
    15 * 60_000,
  );
  const reminderTimer = setInterval(
    () => run("Trial reminder job", sendDueTrialReminders),
    60 * 60_000,
  );
  return () => {
    clearInterval(subscriptionTimer);
    clearInterval(reminderTimer);
    clearInterval(bookingTimer);
    clearInterval(domainTimer);
  };
}
