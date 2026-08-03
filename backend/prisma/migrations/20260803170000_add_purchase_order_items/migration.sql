CREATE TABLE "PurchaseOrderItem" (
  "id" TEXT NOT NULL, "purchaseOrderId" TEXT NOT NULL, "inventoryItemId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL, "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
  "unitCost" DECIMAL(12,2) NOT NULL, CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PurchaseOrderItem_purchaseOrderId_inventoryItemId_key" ON "PurchaseOrderItem"("purchaseOrderId", "inventoryItemId");
CREATE INDEX "PurchaseOrderItem_inventoryItemId_idx" ON "PurchaseOrderItem"("inventoryItemId");
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
