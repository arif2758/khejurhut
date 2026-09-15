// src/lib/pathaoMerchantApi.ts

export interface PathaoTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

export interface PathaoStore {
  store_id: number | string;
  store_name: string;
  store_address: string;
  is_active: number;
  city_id?: number | string;
  zone_id?: number | string;
  hub_id?: number | string;
  is_default_store?: boolean;
}

export interface CreatePathaoOrderPayload {
  store_id: number;
  merchant_order_id?: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_secondary_phone?: string;
  recipient_address: string;
  recipient_city?: number;
  recipient_zone?: number;
  recipient_area?: number;
  delivery_type: 48 | 12; // 48 = Normal, 12 = On Demand
  item_type: 1 | 2; // 1 = Document, 2 = Parcel
  special_instruction?: string;
  item_quantity: number;
  item_weight: number | string;
  item_description?: string;
  amount_to_collect: number;
}

export interface PathaoCreateOrderResponse {
  message?: string;
  type?: string;
  code?: number;
  data?: {
    consignment_id: string;
    merchant_order_id?: string;
    order_status?: string;
    delivery_fee?: number;
  };
  errors?: Record<string, string[]>;
}

export interface PathaoOrderInfoResponse {
  message?: string;
  type?: string;
  code?: number;
  data?: {
    consignment_id: string;
    merchant_order_id?: string;
    order_status?: string;
    order_status_slug?: string;
    updated_at?: string;
    invoice_id?: string | null;
  };
}

export interface PathaoPricePlanResponse {
  message?: string;
  type?: string;
  code?: number;
  data?: {
    price: number;
    discount: number;
    promo_discount: number;
    plan_id: number;
    cod_enabled: number;
    cod_percentage: number;
    additional_charge: number;
    final_price: number;
  };
}

let cachedToken: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} | null = null;

function getPathaoConfig() {
  const baseUrl =
    process.env.PATHAO_BASE_URL || "https://courier-api-sandbox.pathao.com";
  const clientId = process.env.PATHAO_CLIENT_ID || "7N1aMJQbWm";
  const clientSecret =
    process.env.PATHAO_CLIENT_SECRET ||
    "wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39";
  const username = process.env.PATHAO_USERNAME || "test@pathao.com";
  const password = process.env.PATHAO_PASSWORD || "lovePathao";
  const storeId = Number(process.env.PATHAO_STORE_ID || 0);

  return { baseUrl, clientId, clientSecret, username, password, storeId };
}

/**
 * Clean 11-digit Bangladeshi phone number for Pathao format (e.g. 01712345678)
 */
export function sanitizePhoneForPathao(phone?: string): string {
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
 * Issue or return cached OAuth 2.0 Access Token for Pathao Merchant API
 */
export async function getPathaoAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
  }

  const { baseUrl, clientId, clientSecret, username, password } =
    getPathaoConfig();

  let bodyData: any = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "password",
    username,
    password,
  };

  if (cachedToken?.refreshToken) {
    bodyData = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: cachedToken.refreshToken,
    };
  }

  try {
    const res = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
      cache: "no-store",
    });

    const data: PathaoTokenResponse = await res.json();

    if (!res.ok || !data.access_token) {
      // If refresh token failed, fall back to password grant
      if (bodyData.grant_type === "refresh_token") {
        cachedToken = null;
        return getPathaoAccessToken();
      }
      throw new Error((data as any).message || "Pathao authentication failed");
    }

    // Cache token (expires_in is in seconds, e.g. 432000)
    cachedToken = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };

    return cachedToken.accessToken;
  } catch (err: any) {
    console.error("[Pathao Token Error]:", err);
    throw new Error(err.message || "Failed to authenticate with Pathao API");
  }
}

/**
 * Fetch Merchant Stores from Pathao
 */
export async function getPathaoStores(): Promise<PathaoStore[]> {
  const { baseUrl } = getPathaoConfig();
  const token = await getPathaoAccessToken();

  try {
    const res = await fetch(`${baseUrl}/aladdin/api/v1/stores`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const json = await res.json();
    if (json.code === 200 && json.data?.data) {
      return json.data.data;
    }
    return [];
  } catch (err) {
    console.error("[Pathao API Error - getPathaoStores]:", err);
    return [];
  }
}

/**
 * Create a new single order in Pathao Merchant API
 */
export async function createPathaoOrder(
  payload: Omit<CreatePathaoOrderPayload, "store_id"> & { store_id?: number }
): Promise<PathaoCreateOrderResponse> {
  const { baseUrl, storeId: defaultStoreId } = getPathaoConfig();
  const token = await getPathaoAccessToken();

  const activeStoreId = payload.store_id || defaultStoreId;
  if (!activeStoreId) {
    return {
      code: 400,
      message:
        "Pathao Store ID is missing. Please set PATHAO_STORE_ID in environment variables or select a store.",
    };
  }

  const cleanPayload: CreatePathaoOrderPayload = {
    ...payload,
    store_id: activeStoreId,
    recipient_phone: sanitizePhoneForPathao(payload.recipient_phone),
    recipient_secondary_phone: payload.recipient_secondary_phone
      ? sanitizePhoneForPathao(payload.recipient_secondary_phone)
      : undefined,
  };

  try {
    const res = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cleanPayload),
      cache: "no-store",
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error("[Pathao API Error - createPathaoOrder]:", err);
    return {
      code: 500,
      message: err.message || "Failed to create order in Pathao",
    };
  }
}

/**
 * Get short order info from Pathao Merchant API
 */
export async function getPathaoOrderInfo(
  consignmentId: string
): Promise<PathaoOrderInfoResponse> {
  const { baseUrl } = getPathaoConfig();
  const token = await getPathaoAccessToken();

  try {
    const res = await fetch(
      `${baseUrl}/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    return await res.json();
  } catch (err: any) {
    console.error("[Pathao API Error - getPathaoOrderInfo]:", err);
    return { code: 500, message: err.message };
  }
}

/**
 * Calculate order price plan via Pathao Merchant API
 */
export async function getPathaoPricePlan(payload: {
  store_id?: number;
  item_type: 1 | 2;
  delivery_type: 48 | 12;
  item_weight: number;
  recipient_city: number;
  recipient_zone: number;
}): Promise<PathaoPricePlanResponse> {
  const { baseUrl, storeId: defaultStoreId } = getPathaoConfig();
  const token = await getPathaoAccessToken();

  const store_id = payload.store_id || defaultStoreId;

  try {
    const res = await fetch(`${baseUrl}/aladdin/api/v1/merchant/price-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...payload, store_id }),
      cache: "no-store",
    });

    return await res.json();
  } catch (err: any) {
    console.error("[Pathao API Error - getPathaoPricePlan]:", err);
    return { code: 500, message: err.message };
  }
}

/**
 * Fetch List of Cities from Pathao
 */
export async function getPathaoCities(): Promise<any[]> {
  const { baseUrl } = getPathaoConfig();
  const token = await getPathaoAccessToken();

  try {
    const res = await fetch(`${baseUrl}/aladdin/api/v1/city-list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const json = await res.json();
    return json?.data?.data || [];
  } catch (err) {
    console.error("[Pathao API Error - getPathaoCities]:", err);
    return [];
  }
}

/**
 * Fetch List of Zones in a City from Pathao
 */
export async function getPathaoZones(cityId: number): Promise<any[]> {
  const { baseUrl } = getPathaoConfig();
  const token = await getPathaoAccessToken();

  try {
    const res = await fetch(
      `${baseUrl}/aladdin/api/v1/cities/${cityId}/zone-list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const json = await res.json();
    return json?.data?.data || [];
  } catch (err) {
    console.error("[Pathao API Error - getPathaoZones]:", err);
    return [];
  }
}

/**
 * Fetch List of Areas in a Zone from Pathao
 */
export async function getPathaoAreas(zoneId: number): Promise<any[]> {
  const { baseUrl } = getPathaoConfig();
  const token = await getPathaoAccessToken();

  try {
    const res = await fetch(
      `${baseUrl}/aladdin/api/v1/zones/${zoneId}/area-list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const json = await res.json();
    return json?.data?.data || [];
  } catch (err) {
    console.error("[Pathao API Error - getPathaoAreas]:", err);
    return [];
  }
}
