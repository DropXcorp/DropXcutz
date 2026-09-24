-- Website bookings were stored as true UTC instants while the ERP stores salon wall-clock time as UTC.
-- Convert existing WEBSITE appointments to the ERP convention (runs once).
UPDATE "Appointment" AS a
   SET "scheduledAt" = (a."scheduledAt" AT TIME ZONE 'UTC') AT TIME ZONE s."timezone"
  FROM "Salon" AS s
 WHERE a."salonId" = s."id"
   AND a."source" = 'WEBSITE';
