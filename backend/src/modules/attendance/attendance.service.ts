import type { Prisma } from "../../../generated/prisma/client";
import type { z } from "zod";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../middleware/error.middleware";
import type {
  attendancePatch,
  attendanceQuery,
  checkInInput,
} from "../../validators/attendance.validator";
import { attendanceDto } from "./attendance.dto";
type CheckIn = z.infer<typeof checkInInput>;
type Patch = z.infer<typeof attendancePatch>;
type Query = z.infer<typeof attendanceQuery>;


export class AttendanceService {
  async checkIn(salonId: string, userId: string, input: CheckIn) {
    await this.employee(salonId, input.employeeId);
    if (input.branchId) await this.branch(salonId, input.branchId);
    const checkIn = input.checkIn ?? new Date();
    return prisma.$transaction(async (client) => {
      // Attendance is one daily record per employee. Updating its status or
      // checking out must happen on that record rather than creating another.
      const existing = await client.attendance.findFirst({
        where: {
          employeeId: input.employeeId,
          checkIn: this.dayRange(checkIn),
        },
        select: { id: true },
      });
      if (existing)
        throw new ApiError(409, "Attendance is already recorded for this employee today.");
      const item = await client.attendance.create({
        data: {
          employeeId: input.employeeId,
          branchId: input.branchId ?? null,
          checkIn,
          status: input.status,
        },
        include: { employee: { select: { name: true } } },
      });
      await this.audit(
        client,
        salonId,
        userId,
        "CHECK_IN",
        item.id,
        attendanceDto(item),
      );
      return attendanceDto(item);
    });
  }
  async checkOut(
    salonId: string,
    userId: string,
    attendanceId: string,
    checkOut = new Date(),
  ) {
    return prisma.$transaction(async (client) => {
      const current = await client.attendance.findFirst({
        where: { id: attendanceId, employee: { salonId } },
        include: { employee: { select: { name: true } } },
      });
      if (!current) throw new ApiError(404, "Attendance record not found.");
      if (current.checkOut)
        throw new ApiError(409, "Employee is already checked out.");
      if (checkOut <= current.checkIn)
        throw new ApiError(400, "Check-out must be after check-in.");
      const totalHours =
        (checkOut.getTime() - current.checkIn.getTime()) / 3_600_000;
      const item = await client.attendance.update({
        where: { id: attendanceId },
        data: { checkOut, totalHours },
        include: { employee: { select: { name: true } } },
      });
      await this.audit(
        client,
        salonId,
        userId,
        "CHECK_OUT",
        attendanceId,
        attendanceDto(item),
      );
      return attendanceDto(item);
    });
  }
  async list(salonId: string, query: Query) {
    if (query.employeeId) await this.employee(salonId, query.employeeId);
    if (query.branchId) await this.branch(salonId, query.branchId);
    const range = query.date
      ? this.dayRange(new Date(`${query.date}T00:00:00.000Z`))
      : query.month
        ? this.monthRange(query.month)
        : undefined;
    const where: Prisma.AttendanceWhereInput = {
      employee: { salonId },
      ...(query.employeeId && { employeeId: query.employeeId }),
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.status && { status: query.status }),
      ...(range && { checkIn: range }),
    };
    const [items, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { employee: { select: { name: true } } },
        orderBy: { checkIn: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.attendance.count({ where }),
    ]);
    return {
      data: items.map(attendanceDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
  async update(salonId: string, userId: string, id: string, input: Patch) {
    if (input.branchId) await this.branch(salonId, input.branchId);
    return prisma.$transaction(async (client) => {
      const current = await client.attendance.findFirst({
        where: { id, employee: { salonId } },
      });
      if (!current) throw new ApiError(404, "Attendance record not found.");
      const checkIn = input.checkIn ?? current.checkIn;
      const checkOut =
        input.checkOut === undefined ? current.checkOut : input.checkOut;
      if (checkOut && checkOut <= checkIn)
        throw new ApiError(400, "Check-out must be after check-in.");
      const item = await client.attendance.update({
        where: { id },
        data: {
          ...input,
          totalHours: checkOut
            ? (checkOut.getTime() - checkIn.getTime()) / 3_600_000
            : null,
        },
        include: { employee: { select: { name: true } } },
      });
      await this.audit(
        client,
        salonId,
        userId,
        "UPDATE",
        id,
        attendanceDto(item),
      );
      return attendanceDto(item);
    });
  }
  async summary(salonId: string, month: string) {
    const range = this.monthRange(month);
    const records = await prisma.attendance.findMany({
      where: { employee: { salonId }, checkIn: range },
      include: { employee: { select: { id: true, name: true } } },
    });
    const totalHours = records.reduce(
      (sum, record) => sum + Number(record.totalHours ?? 0),
      0,
    );
    return {
      month,
      totalRecords: records.length,
      totalHours,
      lateEmployees: records
        .filter((record) => record.status === "LATE")
        .map((record) => ({
          id: record.employee.id,
          name: record.employee.name,
          attendanceId: record.id,
        })),
    };
  }
  private monthRange(month: string) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    return {
      gte: start,
      lt: new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
      ),
    };
  }
  private dayRange(date: Date) {
    const start = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ));
    return { gte: start, lt: new Date(start.getTime() + 86_400_000) };
  }
  private async employee(salonId: string, id: string) {
    if (
      !(await prisma.employee.findFirst({
        where: { id, salonId },
        select: { id: true },
      }))
    )
      throw new ApiError(404, "Employee not found.");
  }
  private async branch(salonId: string, id: string) {
    if (
      !(await prisma.branch.findFirst({
        where: { id, salonId },
        select: { id: true },
      }))
    )
      throw new ApiError(404, "Branch not found.");
  }
  private audit(
    client: Prisma.TransactionClient,
    salonId: string,
    userId: string,
    action: string,
    entityId: string,
    newValue: object,
  ) {
    return client.salonAuditLog.create({
      data: {
        salonId,
        userId,
        action,
        entity: "Attendance",
        entityId,
        newValue,
      },
    });
  }
}
