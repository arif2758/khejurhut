// src/lib/courierManager.ts

import type { CourierProviderName, IOrderBase } from "@/types/order";
import {
  createPathaoOrder,
  getPathaoOrderInfo,
  sanitizePhoneForPathao,
} from "./pathaoMerchantApi";
import {
  createSteadfastOrder,
  getSteadfastStatusByCid,
  getSteadfastStatusByInvoice,
  getSteadfastStatusByTrackingCode,
  getSteadfastBalance,
  sanitizePhoneForSteadfast,
} from "./steadfastApi";
import { getPublicPathaoTracking } from "@/actions/pathaoTracking";

export interface BookingOptions {
  weightKg?: number;
  storeId?: number;
  note?: string;
  deliveryType?: 48 | 12; // Pathao: 48 = Normal, 12 = On demand
  steadfastDeliveryType?: 0 | 1; // Steadfast: 0 = Home, 1 = Hub
  trackingCode?: string; // For offline manual booking
  itemDescription?: string;
}

export interface BookingResult {
  success: boolean;
  provider: CourierProviderName;
  consignmentId?: string;
  trackingCode?: string;
  courierStatus?: string;
  deliveryFee?: number;
  error?: string;
}

export interface StatusSyncResult {
  success: boolean;
  provider: CourierProviderName;
  status?: string;
  statusSlug?: string;
  riderName?: string;
  riderPhone?: string;
  reason?: string;
  lastLogDesc?: string;
  attemptCount?: number;
  error?: string;
}

/**
 * Dispatch booking request to the selected carrier (Pathao, Steadfast, or Offline)
 */
export async function bookOrderWithCarrier(
  order: IOrderBase,
  provider: CourierProviderName,
  options: BookingOptions = {}
): Promise<BookingResult> {
  const recipientName =
    order.shipping?.name || order.customerPhone || "Customer";
  const recipientPhone =
    order.shipping?.phone || order.customerPhone || "";
  const addressParts = [
    order.shipping?.addressLine1,
    order.shipping?.addressLine2,
    order.shipping?.district || order.shipping?.city,
  ].filter(Boolean);
  const fullAddress =
    addressParts.join(", ") || "Dhaka, Bangladesh";

  const codAmount = order.paymentMethod === "cod" ? (order.total || 0) : 0;
  const itemDesc =
    options.itemDescription ||
    order.items
      ?.map((it) => `${it.productTitle} (Qty: ${it.itemQuantity})`)
      .join(", ") ||
    "Gadget Items";

  if (provider === "pathao") {
    const pathaoRes = await createPathaoOrder({
      store_id: options.storeId ? Number(options.storeId) : undefined,
      merchant_order_id: order.orderNumber,
      recipient_name: recipientName.slice(0, 90),
      recipient_phone: sanitizePhoneForPathao(recipientPhone),
      recipient_address: fullAddress.slice(0, 200),
      delivery_type: options.deliveryType || 48,
      item_type: 2, // 2 = Parcel
      item_quantity: order.items?.reduce((acc, i) => acc + i.itemQuantity, 0) || 1,
      item_weight: options.weightKg || 0.5,
      item_description: itemDesc.slice(0, 200),
      special_instruction: (options.note || order.customerNotes || "").slice(0, 200),
      amount_to_collect: codAmount,
    });

    if (
      (pathaoRes.code === 200 || pathaoRes.type === "success") &&
      pathaoRes.data?.consignment_id
    ) {
      return {
        success: true,
        provider: "pathao",
        consignmentId: String(pathaoRes.data.consignment_id),
        trackingCode: String(pathaoRes.data.consignment_id),
        courierStatus: pathaoRes.data.order_status || "Pending",
        deliveryFee: pathaoRes.data.delivery_fee || 0,
      };
    } else {
      const errMsg =
        pathaoRes.message ||
        (pathaoRes.errors
          ? Object.values(pathaoRes.errors).flat().join(", ")
          : "Failed to create order in Pathao");
      return { success: false, provider: "pathao", error: errMsg };
    }
  }

  if (provider === "steadfast") {
    const steadfastRes = await createSteadfastOrder({
      invoice: order.orderNumber,
      recipient_name: recipientName.slice(0, 90),
      recipient_phone: sanitizePhoneForSteadfast(recipientPhone),
      recipient_address: fullAddress.slice(0, 240),
      cod_amount: codAmount,
      note: (options.note || order.customerNotes || "").slice(0, 200),
      item_description: itemDesc.slice(0, 200),
      delivery_type: options.steadfastDeliveryType || 0,
    });

    if (
      (steadfastRes.status === 200 || steadfastRes.status === 201) &&
      steadfastRes.consignment
    ) {
      const c = steadfastRes.consignment;
      return {
        success: true,
        provider: "steadfast",
        consignmentId: String(c.consignment_id),
        trackingCode: c.tracking_code || String(c.consignment_id),
        courierStatus: c.status || "in_review",
      };
    } else {
      const errMsg =
        steadfastRes.message ||
        (steadfastRes.errors
          ? Object.values(steadfastRes.errors).flat().join(", ")
          : "Failed to create order in Steadfast");
      return { success: false, provider: "steadfast", error: errMsg };
    }
  }

  // Offline / Manual Booking
  const manualTracking = options.trackingCode || order.courierTrackingId || "";
  return {
    success: true,
    provider: "offline",
    consignmentId: manualTracking,
    trackingCode: manualTracking,
    courierStatus: manualTracking ? "Booked (Offline)" : "Pending (Offline)",
  };
}

/**
 * Sync status for an order based on its active provider
 */
export async function syncOrderCourierStatus(order: {
  courierProvider?: CourierProviderName;
  courierConsignmentId?: string;
  courierTrackingId?: string;
  orderNumber?: string;
}): Promise<StatusSyncResult> {
  const provider = order.courierProvider || "offline";
  const consignmentId =
    order.courierConsignmentId || order.courierTrackingId || "";

  if (provider === "pathao") {
    if (!consignmentId) {
      return { success: false, provider, error: "No Pathao Consignment ID" };
    }

    // Try Pathao Merchant Info API first
    const info = await getPathaoOrderInfo(consignmentId);
    if (info.code === 200 && info.data) {
      return {
        success: true,
        provider: "pathao",
        status: info.data.order_status || "Pending",
        statusSlug: info.data.order_status_slug || info.data.order_status,
      };
    }

    // Fall back to Pathao Public Tracking
    const pub = await getPublicPathaoTracking(consignmentId);
    if (pub.success && pub.data) {
      return {
        success: true,
        provider: "pathao",
        status: pub.data.currentStatus,
        statusSlug: pub.data.currentStatus,
        riderName: pub.data.riderName,
        riderPhone: pub.data.riderPhone,
        reason: pub.data.reason,
        lastLogDesc: pub.data.lastLogDesc,
        attemptCount: pub.data.attemptCount,
      };
    }

    return {
      success: false,
      provider: "pathao",
      error: pub.error || info.message || "Failed to fetch Pathao status",
    };
  }

  if (provider === "steadfast") {
    if (!consignmentId && !order.orderNumber) {
      return { success: false, provider, error: "No Steadfast Consignment ID or Invoice" };
    }

    let res = consignmentId
      ? await getSteadfastStatusByCid(consignmentId)
      : await getSteadfastStatusByInvoice(order.orderNumber || "");

    if (res.status !== 200 && consignmentId) {
      res = await getSteadfastStatusByTrackingCode(consignmentId);
    }

    if (res.status === 200 && res.delivery_status) {
      return {
        success: true,
        provider: "steadfast",
        status: res.delivery_status,
        statusSlug: res.delivery_status,
      };
    }

    return {
      success: false,
      provider: "steadfast",
      error: res.message || "Failed to fetch Steadfast status",
    };
  }

  return {
    success: true,
    provider: "offline",
    status: "Offline",
  };
}

/**
 * Fetch balances across integrated carriers
 */
export async function getAllCarrierBalances(): Promise<{
  steadfast?: { status: number; current_balance?: number; message?: string };
}> {
  const steadfastBalance = await getSteadfastBalance();
  return {
    steadfast: steadfastBalance,
  };
}
