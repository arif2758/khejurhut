// src/app/(admin)/admin/inventory/page.tsx
import { Metadata } from "next";
import { getWarehousePickListAction, getInventoryMatrixAction } from "@/actions/inventory";
import { InventoryClient } from "./InventoryClient";

export const metadata: Metadata = {
  title: "Inventory & Warehouse Pick List | GadgeterHub Admin",
  description: "Daily warehouse pick list requisition and live stock matrix control.",
};

export default async function InventoryPage() {
  const [pickListRes, matrixRes] = await Promise.all([
    getWarehousePickListAction(),
    getInventoryMatrixAction(),
  ]);

  return (
    <InventoryClient
      initialPickList={pickListRes.pickList || []}
      initialTotalUnits={pickListRes.totalUnitsNeeded || 0}
      initialActiveOrders={pickListRes.activeOrdersCount || 0}
      initialMatrix={matrixRes.matrix || []}
      initialTotalProducts={matrixRes.totalProducts || 0}
      initialLowStock={matrixRes.lowStockCount || 0}
      initialOutOfStock={matrixRes.outOfStockCount || 0}
    />
  );
}
