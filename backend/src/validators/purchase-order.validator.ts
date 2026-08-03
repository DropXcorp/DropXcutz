import { z } from "zod";
const line = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().positive(),
});

export const purchaseOrderInput = z.object({
  supplierId: z.string().min(1),
  branchId: z.string().min(1).optional().nullable(),
  expectedDate: z.coerce.date().optional().nullable(),
  items: z.array(line).min(1),
});


export const receivePurchaseOrderInput = z.object({
  items: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1),
});
