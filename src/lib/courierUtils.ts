// src/lib/courierUtils.ts

export interface CourierStatusInfo {
  label: string;
  color: "warning" | "error" | "success" | "cyan" | "blue" | "processing";
  isHold: boolean;
  isReturned: boolean;
  isDelivered: boolean;
  isAssigned: boolean;
  isReady: boolean;
}

/**
 * Parses raw courier status from Pathao / Steaddfast / Paperfly
 * and returns standardized badge labels, colors, and boolean flags.
 */
export function parseCourierStatus(
  courierStatus?: string,
  lastLogDesc?: string,
  riderName?: string,
  riderPhone?: string
): CourierStatusInfo {
  const stLower = (courierStatus || "").toLowerCase();
  const descLower = (lastLogDesc || "").toLowerCase();

  const isHold = stLower.includes("hold");
  const isReturned = stLower.includes("return");
  const isDelivered = stLower.includes("delivered");

  const hasRider = Boolean(riderName || riderPhone);
  const isAssigned =
    !isDelivered &&
    !isReturned &&
    !isHold &&
    (stLower.includes("assign") || descLower.includes("assigned to") || hasRider);

  const isReady =
    !isDelivered &&
    !isReturned &&
    !isHold &&
    !isAssigned &&
    (stLower.includes("ready") || stLower.includes("at hub") || stLower.includes("out for delivery"));

  let label = courierStatus || "In Transit";
  let color: "warning" | "error" | "success" | "cyan" | "blue" | "processing" = "processing";

  if (isDelivered) {
    label = "✅ DELIVERED";
    color = "success";
  } else if (isReturned) {
    label = "🚨 RETURNED";
    color = "error";
  } else if (isHold) {
    label = "⚠️ ON HOLD";
    color = "warning";
  } else if (isAssigned) {
    label = hasRider ? `🛵 ASSIGNED (${riderName || riderPhone})` : "🛵 ASSIGNED";
    color = "cyan";
  } else if (isReady) {
    label = "📦 READY FOR DELIVERY";
    color = "blue";
  }

  return {
    label,
    color,
    isHold,
    isReturned,
    isDelivered,
    isAssigned,
    isReady,
  };
}
