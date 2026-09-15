// src/actions/courierActions.ts
"use server";

import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import type { CourierProviderName, IOrderSerializable } from "@/types/order";
import {
  bookOrderWithCarrier,
  syncOrderCourierStatus,
  getAllCarrierBalances,
  BookingOptions,
} from "@/lib/courierManager";
import { getPathaoStores, getPathaoPricePlan } from "@/lib/pathaoMerchantApi";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Book an order with selected carrier (Pathao, Steadfast, or Offline)
 */
export async function bookSingleOrderAction(
  orderId: string,
  provider: CourierProviderName,
  options: BookingOptions = {}
): Promise<{
  success: boolean;
  order?: IOrderSerializable;
  message?: string;
  error?: string;
}> {
  try {
    await dbConnect();
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: "অর্ডার খুঁজে পাওয়া যায়নি (Order not found)" };
    }

    const bookingResult = await bookOrderWithCarrier(order, provider, options);

    if (!bookingResult.success) {
      return {
        success: false,
        error: bookingResult.error || `Failed to book order with ${provider}`,
      };
    }

    order.courierProvider = provider;
    if (bookingResult.consignmentId) {
      order.courierConsignmentId = bookingResult.consignmentId;
    }
    if (bookingResult.trackingCode) {
      order.courierTrackingId = bookingResult.trackingCode;
    }
    if (bookingResult.courierStatus) {
      order.courierStatus = bookingResult.courierStatus;
    }
    if (options.storeId) {
      order.courierStoreId = String(options.storeId);
    }
    order.courierLastUpdated = new Date();

    // Auto mark as shipped if not already delivered/cancelled/returned
    if (
      provider !== "offline" &&
      ["pending", "confirmed", "processing"].includes(order.orderStatus)
    ) {
      order.orderStatus = "shipped";
      if (!order.shippedAt) {
        order.shippedAt = new Date();
      }
    }

    await order.save();

    revalidatePath("/admin/orders");
    revalidatePath("/admin/courier");
    revalidatePath(`/admin/orders/${orderId}`);

    return {
      success: true,
      order: JSON.parse(JSON.stringify(order)),
      message: `${provider.toUpperCase()} এ সফলভাবে অর্ডার বুক করা হয়েছে!`,
    };
  } catch (err: any) {
    console.error("[bookSingleOrderAction error]:", err);
    return {
      success: false,
      error: err.message || "অর্ডার বুক করতে ব্যর্থ হয়েছে",
    };
  }
}

/**
 * Server Action: Sync live courier status for an order
 */
export async function syncOrderCarrierStatusAction(orderId: string): Promise<{
  success: boolean;
  order?: IOrderSerializable;
  message?: string;
  error?: string;
}> {
  try {
    await dbConnect();
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const syncRes = await syncOrderCourierStatus(order);

    if (!syncRes.success) {
      return {
        success: false,
        error: syncRes.error || "Failed to sync status",
      };
    }

    if (syncRes.status) {
      order.courierStatus = syncRes.status;
      order.courierReason = syncRes.reason || order.courierReason || "";
      order.courierRiderName = syncRes.riderName || order.courierRiderName || "";
      order.courierRiderPhone = syncRes.riderPhone || order.courierRiderPhone || "";
      order.courierLastLogDesc = syncRes.lastLogDesc || order.courierLastLogDesc || "";
      if (syncRes.attemptCount !== undefined) {
        order.courierAttemptCount = syncRes.attemptCount;
      }
      order.courierLastUpdated = new Date();

      const stLower = syncRes.status.toLowerCase();
      if (stLower.includes("delivered") && order.orderStatus !== "delivered") {
        order.orderStatus = "delivered";
        order.deliveredAt = new Date();
      } else if (stLower.includes("return")) {
        if (stLower.includes("returned") || stLower.includes("merchant")) {
          order.orderStatus = "returned";
        } else {
          order.orderStatus = "in_return";
        }
      }
    }

    await order.save();

    revalidatePath("/admin/orders");
    revalidatePath("/admin/courier");
    revalidatePath(`/admin/orders/${orderId}`);

    return {
      success: true,
      order: JSON.parse(JSON.stringify(order)),
      message: `Status updated to: ${order.courierStatus}`,
    };
  } catch (err: any) {
    console.error("[syncOrderCarrierStatusAction error]:", err);
    return {
      success: false,
      error: err.message || "Failed to sync status",
    };
  }
}

/**
 * Server Action: Get carrier balance summary
 */
export async function getCarrierBalancesAction() {
  try {
    const balances = await getAllCarrierBalances();
    return { success: true, balances };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Server Action: Get Pathao Stores list for admin selector modal
 */
export async function getPathaoStoresAction() {
  try {
    const stores = await getPathaoStores();
    return { success: true, stores };
  } catch (err: any) {
    return { success: false, stores: [], error: err.message };
  }
}

/**
 * Server Action: Calculate price estimate for Pathao
 */
export async function getPathaoPriceEstimateAction(payload: {
  store_id?: number;
  item_type: 1 | 2;
  delivery_type: 48 | 12;
  item_weight: number;
  recipient_city: number;
  recipient_zone: number;
}) {
  try {
    const estimate = await getPathaoPricePlan(payload);
    return { success: true, estimate };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
