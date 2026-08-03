import type { ServiceCategory } from "../../../generated/prisma/client";
export const serviceCategoryDto = (
  item: ServiceCategory & { _count?: { services: number } },
) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  image: item.image,
  isActive: item.isActive,
  serviceCount: item._count?.services ?? 0,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});
