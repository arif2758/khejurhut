// src/lib/steadfastApi.ts

export interface CreateSteadfastOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  alternative_phone?: string;
  recipient_email?: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  total_lot?: number;
  delivery_type?: 0 | 1;
}

export interface SteadfastConsignment {
  consignment_id: number | string;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SteadfastCreateOrderResponse {
  status: number;
  message?: string;
  consignment?: SteadfastConsignment;
  errors?: Record<string, string[]>;
}

export interface SteadfastStatusResponse {
  status: number;
  delivery_status?: string;
  message?: string;
}

export interface SteadfastBalanceResponse {
  status: number;
  current_balance?: number;
  message?: string;
}

function getSteadfastConfig() {
  const baseUrl =
    process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1";
  const apiKey = process.env.STEADFAST_API_KEY || "";
  const secretKey = process.env.STEADFAST_SECRET_KEY || "";

  return { baseUrl, apiKey, secretKey };
}

function getHeaders(apiKey: string, secretKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    "Secret-Key": secretKey,
  };
}

/**
 * Clean 11-digit Bangladeshi phone number for Steadfast format (e.g. 01712345678)
 */
export function sanitizePhoneForSteadfast(phone?: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.startsWith("880")) {
    cleaned = cleaned.slice(2);
  }
  if (cleaned.length > 11) {
    cleaned = cleaned.slice(-11);
  }
  return cleaned;
}

/**
 * Place a new single order with Steadfast Courier V1 API
 */
export async function createSteadfastOrder(
  payload: CreateSteadfastOrderPayload
): Promise<SteadfastCreateOrderResponse> {
  const { baseUrl, apiKey, secretKey } = getSteadfastConfig();

  if (!apiKey || !secretKey) {
    return {
      status: 400,
      message:
        "Steadfast API Key or Secret Key is missing in environment variables (STEADFAST_API_KEY / STEADFAST_SECRET_KEY).",
    };
  }

  const cleanPayload = {
    ...payload,
    recipient_phone: sanitizePhoneForSteadfast(payload.recipient_phone),
    alternative_phone: payload.alternative_phone
      ? sanitizePhoneForSteadfast(payload.alternative_phone)
      : undefined,
  };

  try {
    const res = await fetch(`${baseUrl}/create_order`, {
      method: "POST",
      headers: getHeaders(apiKey, secretKey),
      body: JSON.stringify(cleanPayload),
      cache: "no-store",
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error("[Steadfast API Error - createSteadfastOrder]:", error);
    return {
      status: 500,
      message: error.message || "Failed to connect to Steadfast API",
    };
  }
}

/**
 * Bulk order creation with Steadfast Courier V1 API
 */
export async function createSteadfastBulkOrders(
  orders: CreateSteadfastOrderPayload[]
): Promise<any> {
  const { baseUrl, apiKey, secretKey } = getSteadfastConfig();

  if (!apiKey || !secretKey) {
    throw new Error("Steadfast API credentials missing");
  }

  const formattedOrders = orders.map((o) => ({
    ...o,
    recipient_phone: sanitizePhoneForSteadfast(o.recipient_phone),
    alternative_phone: o.alternative_phone
      ? sanitizePhoneForSteadfast(o.alternative_phone)
      : undefined,
  }));

  try {
    const res = await fetch(`${baseUrl}/create_order/bulk-order`, {
      method: "POST",
      headers: getHeaders(apiKey, secretKey),
      body: JSON.stringify({ data: JSON.stringify(formattedOrders) }),
      cache: "no-store",
    });

    return await res.json();
  } catch (error: any) {
    console.error("[Steadfast API Error - bulkCreate]:", error);
    throw error;
  }
}

/**
 * Fetch delivery status by Steadfast Consignment ID
 */
export async function getSteadfastStatusByCid(
  consignmentId: string | number
): Promise<SteadfastStatusResponse> {
  const { baseUrl, apiKey, secretKey } = getSteadfastConfig();

  if (!apiKey || !secretKey) {
    return { status: 400, message: "Steadfast credentials missing" };
  }

  try {
    const res = await fetch(`${baseUrl}/status_by_cid/${consignmentId}`, {
      method: "GET",
      headers: getHeaders(apiKey, secretKey),
      cache: "no-store",
    });

    return await res.json();
  } catch (error: any) {
    console.error("[Steadfast API Error - statusByCid]:", error);
    return { status: 500, message: error.message };
  }
}

/**
 * Fetch delivery status by Merchant Invoice ID
 */
export async function getSteadfastStatusByInvoice(
  invoice: string
): Promise<SteadfastStatusResponse> {
  const { baseUrl, apiKey, secretKey } = getSteadfastConfig();

  if (!apiKey || !secretKey) {
    return { status: 400, message: "Steadfast credentials missing" };
  }

  try {
    const res = await fetch(`${baseUrl}/status_by_invoice/${encodeURIComponent(invoice)}`, {
      method: "GET",
      headers: getHeaders(apiKey, secretKey),
      cache: "no-store",
    });

    return await res.json();
  } catch (error: any) {
    console.error("[Steadfast API Error - statusByInvoice]:", error);
    return { status: 500, message: error.message };
  }
}

/**
 * Fetch delivery status by Steadfast Tracking Code
 */
export async function getSteadfastStatusByTrackingCode(
  trackingCode: string
): Promise<SteadfastStatusResponse> {
  const { baseUrl, apiKey, secretKey } = getSteadfastConfig();

  if (!apiKey || !secretKey) {
    return { status: 400, message: "Steadfast credentials missing" };
  }

  try {
    const res = await fetch(
      `${baseUrl}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`,
      {
        method: "GET",
        headers: getHeaders(apiKey, secretKey),
        cache: "no-store",
      }
    );

    return await res.json();
  } catch (error: any) {
    console.error("[Steadfast API Error - statusByTrackingCode]:", error);
    return { status: 500, message: error.message };
  }
}

/**
 * Check current balance from Steadfast Courier
 */
export async function getSteadfastBalance(): Promise<SteadfastBalanceResponse> {
  const { baseUrl, apiKey, secretKey } = getSteadfastConfig();

  if (!apiKey || !secretKey) {
    return { status: 400, message: "Steadfast credentials missing" };
  }

  try {
    const res = await fetch(`${baseUrl}/get_balance`, {
      method: "GET",
      headers: getHeaders(apiKey, secretKey),
      cache: "no-store",
    });

    return await res.json();
  } catch (error: any) {
    console.error("[Steadfast API Error - getBalance]:", error);
    return { status: 500, message: error.message };
  }
}
