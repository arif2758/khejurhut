// src/actions/inventory.ts
"use server";

import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { revalidatePath } from "next/cache";

export interface PickListItem {
  key: string;
  productId: string;
  productTitle: string;
  variantTitle?: string;
  color?: string;
  size?: string;
  sku?: string;
  thumbnail?: string;
  totalQuantityNeeded: number;
  orderNumbers: string[];
}

export interface InventoryMatrixItem {
  _id: string;
  title: string;
  sku: string;
  thumbnail: string;
  categoryName?: string;
  totalStock: number;
  hasVariants: boolean;
  variants: {
    _id: string;
    variantTitle: string;
    variantSku: string;
    stockQuantity: number;
    color?: string;
    size?: string;
  }[];
}

/**
 * Aggregates all active orders to calculate exact items needed from warehouse today.
 */
export async function getWarehousePickListAction(): Promise<{
  success: boolean;
  pickList?: PickListItem[];
  totalUnitsNeeded?: number;
  activeOrdersCount?: number;
  error?: string;
}> {
  try {
    await dbConnect();

    // Query active orders ready for fulfillment
    const activeOrders = await Order.find({
      orderStatus: { $in: ["pending", "processing", "ready", "assigned"] },
    })
      .select("orderNumber items orderStatus")
      .lean();

    const itemMap = new Map<string, PickListItem>();
    let totalUnits = 0;

    activeOrders.forEach((order: any) => {
      const orderNum = order.orderNumber || "";
      const items = order.items || [];

      items.forEach((item: any) => {
        const prodId = item.product ? item.product.toString() : item.productId || "";
        const title = item.productTitle || "Unknown Item";
        const color = (item.color || "").trim();
        const size = (item.size || "").trim();
        const qty = Math.max(1, Number(item.quantity || item.itemQuantity || 1));

        // Create a unique key per product + variant combination
        const key = `${prodId}_${color.toLowerCase()}_${size.toLowerCase()}`;

        totalUnits += qty;

        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          existing.totalQuantityNeeded += qty;
          if (!existing.orderNumbers.includes(orderNum)) {
            existing.orderNumbers.push(orderNum);
          }
        } else {
          itemMap.set(key, {
            key,
            productId: prodId,
            productTitle: title,
            color: color || undefined,
            size: size || undefined,
            sku: item.sku,
            thumbnail: item.thumbnail,
            totalQuantityNeeded: qty,
            orderNumbers: [orderNum],
          });
        }
      });
    });

    const pickList = Array.from(itemMap.values()).sort(
      (a, b) => b.totalQuantityNeeded - a.totalQuantityNeeded
    );

    return {
      success: true,
      pickList,
      totalUnitsNeeded: totalUnits,
      activeOrdersCount: activeOrders.length,
    };
  } catch (err: any) {
    console.error("Error in getWarehousePickListAction:", err);
    return { success: false, error: err.message || "Failed to generate pick list" };
  }
}

/**
 * Fetches inventory stock matrix for all products and variants.
 */
export async function getInventoryMatrixAction(): Promise<{
  success: boolean;
  matrix?: InventoryMatrixItem[];
  totalProducts?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  error?: string;
}> {
  try {
    await dbConnect();

    const products = await Product.find({})
      .populate("category", "name")
      .select("title sku thumbnail stockQuantity variants colors sizes category status")
      .lean();

    let lowStock = 0;
    let outOfStock = 0;

    const matrix: InventoryMatrixItem[] = products.map((p: any) => {
      let hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
      const rawColors: string[] = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : [];

      let variantsList = hasVariants
        ? p.variants.map((v: any, vIdx: number) => {
            const colorAttr = v.variantAttributes?.find(
              (a: any) => a.attributeName?.toLowerCase() === "color"
            )?.attributeValue;
            const sizeAttr = v.variantAttributes?.find(
              (a: any) => a.attributeName?.toLowerCase() === "size"
            )?.attributeValue;

            return {
              _id: v._id ? v._id.toString() : `v_${p._id.toString()}_${vIdx}`,
              variantTitle: v.variantTitle || colorAttr || v.variantSku || `Variant #${vIdx + 1}`,
              variantSku: v.variantSku || "",
              stockQuantity: Number(v.stockQuantity || 0),
              color: colorAttr || (rawColors.includes(v.variantTitle) ? v.variantTitle : undefined),
              size: sizeAttr || undefined,
            };
          })
        : [];

      // Auto-fallback: If MongoDB record has colors but empty variants array, generate variant per color with initial stock = 2
      if (!hasVariants && rawColors.length > 0) {
        hasVariants = true;
        variantsList = rawColors.map((colorName, cIdx) => ({
          _id: `v_${p._id.toString()}_${cIdx}`,
          variantTitle: colorName,
          variantSku: `${p.sku || "sku"}-${colorName.toLowerCase().replace(/\s+/g, "")}`,
          stockQuantity: 2, // Default 2 pcs per color variant as requested
          color: colorName,
          size: undefined,
        }));
      }

      let totalStock = p.stockQuantity || 0;
      if (hasVariants) {
        totalStock = variantsList.reduce((sum: number, v: any) => sum + v.stockQuantity, 0);
      }

      if (totalStock === 0) outOfStock++;
      else if (totalStock <= 5) lowStock++;

      return {
        _id: p._id.toString(),
        title: p.title || "Untitled",
        sku: p.sku || "",
        thumbnail: p.thumbnail || "",
        categoryName: p.category?.name || "Uncategorized",
        totalStock,
        hasVariants,
        variants: variantsList,
      };
    });

    return {
      success: true,
      matrix,
      totalProducts: matrix.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
    };
  } catch (err: any) {
    console.error("Error in getInventoryMatrixAction:", err);
    return { success: false, error: err.message || "Failed to load inventory matrix" };
  }
}

/**
 * Updates stock quantity for a product or a specific variant inline.
 */
export async function updateProductStockAction(
  productId: string,
  variantId?: string | null,
  newStockQuantity: number = 0
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();

    const safeQty = Math.max(0, Number(newStockQuantity) || 0);

    if (variantId) {
      // Update specific variant inside variants array
      const res = await Product.updateOne(
        { _id: productId, "variants._id": variantId },
        { $set: { "variants.$.stockQuantity": safeQty } }
      );

      // Recalculate main product total stockQuantity
      const updatedProduct = await Product.findById(productId).select("variants");
      if (updatedProduct && updatedProduct.variants) {
        const total = updatedProduct.variants.reduce(
          (sum: number, v: any) => sum + (v.stockQuantity || 0),
          0
        );
        await Product.updateOne({ _id: productId }, { $set: { stockQuantity: total } });
      }
    } else {
      // Update main product stockQuantity
      await Product.updateOne({ _id: productId }, { $set: { stockQuantity: safeQty } });
    }

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateProductStockAction:", err);
    return { success: false, error: err.message || "Failed to update stock quantity" };
  }
}
