export const employeeSkillDto = (item: {
  service: {
    id: string;
    name: string;
    description: string | null;
    price: { toString(): string };
    durationMinutes: number;
    active: boolean;
  };
}) => ({
  id: item.service.id,
  name: item.service.name,
  description: item.service.description,
  price: Number(item.service.price),
  durationMinutes: item.service.durationMinutes,
  active: item.service.active,
});
export const serviceEmployeeDto = (item: {
  employee: {
    id: string;
    name: string;
    role: string;
    phone: string;
    active: boolean;
  };
}) => ({
  id: item.employee.id,
  name: item.employee.name,
  role: item.employee.role,
  phone: item.employee.phone,
  active: item.employee.active,
});
