import { expireSubscriptions } from "./subscription.service";
import { sendDueTrialReminders } from "./trial-reminder.service";
export function startScheduler() {
  const run = (name: string, task: () => Promise<unknown>) =>
    void task().catch((error) => console.error(`${name} failed`, error));
  run("Subscription expiry check", expireSubscriptions);
  run("Trial reminder job", sendDueTrialReminders);
  const subscriptionTimer = setInterval(
    () => run("Subscription expiry check", expireSubscriptions),
    15 * 60_000,
  );
  const reminderTimer = setInterval(
    () => run("Trial reminder job", sendDueTrialReminders),
    60 * 60_000,
  );
  return () => {
    clearInterval(subscriptionTimer);
    clearInterval(reminderTimer);
  };
}
