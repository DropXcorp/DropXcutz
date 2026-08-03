export const attendanceDto = (item: {
  id: string;
  employeeId: string;
  branchId: string | null;
  checkIn: Date;
  checkOut: Date | null;
  totalHours: { toString(): string } | null;
  status: string;
  createdAt: Date;
  employee?: { name: string };
}) => ({
  id: item.id,
  employeeId: item.employeeId,
  employeeName: item.employee?.name,
  branchId: item.branchId,
  checkIn: item.checkIn,
  checkOut: item.checkOut,
  totalHours: item.totalHours === null ? null : Number(item.totalHours),
  status: item.status,
  createdAt: item.createdAt,
});
