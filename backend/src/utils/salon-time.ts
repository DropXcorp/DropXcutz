/**
 * Appointment times are stored as the salon's WALL-CLOCK time written as UTC
 * (10:00 in Kolkata is saved as 10:00Z). The ERP relies on this convention, so every
 * writer/reader must use these helpers instead of real UTC instants.
 */
export function wallTime(date: string, time: string) {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), hour, minute));
}

/** "Now" expressed in the same wall-clock-as-UTC convention for the given timezone. */
export function salonNow(timezone: string) {
  let parts: Record<string, string>;
  try {
    parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(new Date())
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
  } catch {
    return Date.now();
  }
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
}
