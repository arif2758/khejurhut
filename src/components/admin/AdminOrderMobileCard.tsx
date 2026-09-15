// src/components/admin/AdminOrderMobileCard.tsx
"use client";

import Link from "next/link";
import { Card, Tag, Typography, Button, Flex, Tooltip } from "antd";
import {
  EditOutlined,
  ReloadOutlined,
  RocketOutlined,
  PhoneOutlined,
  MessageOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { formatPrice } from "@/lib/priceUtils";
import { IOrder, CHANNEL_LABELS } from "@/types/order";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { getZoneBadgeInfo } from "@/lib/shipping";
import { parseCourierStatus } from "@/lib/courierUtils";

const { Text } = Typography;

interface AdminOrderMobileCardProps {
  order: IOrder;
  marginBottom?: number;
  onOpenShipModal?: (order: IOrder) => void;
  onAddPathaoId?: (orderId: string, orderNumber: string) => void;
  onOpenTrackingModal?: (consignmentId: string, orderNumber: string) => void;
  onEditPathaoId?: (orderId: string, orderNumber: string, consignmentId?: string) => void;
  onSyncCourierStatus?: (orderId: string, consignmentId: string) => void;
}

export function AdminOrderMobileCard({
  order,
  marginBottom = 10,
  onOpenShipModal,
  onAddPathaoId,
  onOpenTrackingModal,
  onEditPathaoId,
  onSyncCourierStatus,
}: AdminOrderMobileCardProps) {
  const channelKey = order.channelSource || "web";
  const channelLabel = CHANNEL_LABELS[channelKey] || "Website";
  const orderIdStr = order._id ? order._id.toString() : "";
  const isInReturn = order.orderStatus === "in_return";
  const provider = order.courierProvider || "offline";
  const trackingId = order.courierTrackingId || order.courierConsignmentId || "";

  const recipientPhone = order.shipping?.phone || order.customerPhone || "";
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
  const waNumber = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;

  const courierInfo = parseCourierStatus(
    order.courierStatus,
    order.courierLastLogDesc,
    order.courierRiderName,
    order.courierRiderPhone
  );

  return (
    <Card
      style={{
        borderRadius: 16,
        border: isInReturn ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
        backgroundColor: isInReturn ? "#fef2f2" : "#ffffff",
        marginBottom,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
      styles={{ body: { padding: "14px 14px 12px 14px" } }}
    >
      <div className="space-y-3">
        {/* Top Header: Order ID, Channel Tag & Status Updater */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 wrap flex-wrap">
              <Text
                code
                style={{
                  fontWeight: 900,
                  fontSize: "14px",
                  margin: 0,
                  letterSpacing: "0.5px",
                }}
              >
                {order.orderNumber}
              </Text>
              <Tag
                color="blue"
                style={{
                  fontSize: "10px",
                  margin: 0,
                  borderRadius: 6,
                  padding: "0 6px",
                  lineHeight: "18px",
                  fontWeight: 700,
                }}
              >
                {channelLabel}
              </Tag>
            </div>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: "11px" }}>
                {order.createdAt ? format(new Date(order.createdAt), "dd MMM, hh:mm a") : ""}
              </Text>
            </div>
          </div>

          {orderIdStr && (
            <div className="shrink-0">
              <StatusUpdater
                orderId={orderIdStr}
                currentStatus={order.orderStatus || "pending"}
              />
            </div>
          )}
        </div>

        {/* Middle Section: Customer Details & COD Amount */}
        {(() => {
          const vipDeduction =
            order.vipPrivilege && order.vipPrivilege > 0
              ? order.vipPrivilege
              : order.discount || 0;
          const districtName = order.shipping?.district;
          const zoneBadge = getZoneBadgeInfo(order.shipping, order.shippingCost);
          const displayLabel = districtName ? `📍 ${districtName}` : zoneBadge.label;

          return (
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Flex align="center" gap={6} wrap="wrap">
                  <Text strong style={{ fontSize: "13.5px", color: "#0f172a" }}>
                    {order.shipping?.name || "Customer"}
                  </Text>
                  {vipDeduction > 0 && (
                    <Tag color="gold" style={{ margin: 0, fontSize: "9px", fontWeight: 900, padding: "0 4px" }}>
                      🌟 VIP
                    </Tag>
                  )}
                  <Tag
                    variant="filled"
                    style={{
                      margin: 0,
                      fontSize: "10px",
                      padding: "0 6px",
                      lineHeight: "18px",
                      borderRadius: 4,
                      fontWeight: 700,
                      background: "#e2e8f0",
                      color: "#334155",
                    }}
                  >
                    {displayLabel}
                  </Tag>
                </Flex>

                <div className="flex items-center gap-2 mt-1">
                  <Text type="secondary" style={{ fontSize: "12px", fontWeight: 600 }}>
                    {recipientPhone}
                  </Text>
                  {cleanPhone && (
                    <div className="flex items-center gap-1">
                      <a href={`tel:${cleanPhone}`}>
                        <Button
                          size="small"
                          type="text"
                          style={{ width: 22, height: 22, padding: 0 }}
                          icon={<PhoneOutlined style={{ fontSize: "12px", color: "#2563eb" }} />}
                        />
                      </a>
                      <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                        <Button
                          size="small"
                          type="text"
                          style={{ width: 22, height: 22, padding: 0 }}
                          icon={<MessageOutlined style={{ fontSize: "12px", color: "#25D366" }} />}
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right" }} className="shrink-0">
                <Text strong style={{ fontSize: "15px", color: "#2563eb", display: "block" }}>
                  {formatPrice(Math.max(0, order.total - (order.advancePaid || 0)))}
                </Text>
                {Boolean(order.advancePaid && order.advancePaid > 0) && (
                  <Text type="secondary" style={{ fontSize: "10px", display: "block", color: "#059669", fontWeight: 700 }}>
                    Adv: {formatPrice(order.advancePaid || 0)}
                  </Text>
                )}
              </div>
            </div>
          );
        })()}

        {/* Action Row: Carrier Badge & 1-Click Ship Button */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 wrap flex-wrap">
            {provider === "pathao" ? (
              <Tag
                color="rose"
                style={{
                  margin: 0,
                  fontWeight: 800,
                  fontSize: "10.5px",
                  background: "#ffe4e6",
                  color: "#e11d48",
                  border: "1px solid #fecdd3",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                🔴 Pathao
              </Tag>
            ) : provider === "steadfast" ? (
              <Tag
                color="blue"
                style={{
                  margin: 0,
                  fontWeight: 800,
                  fontSize: "10.5px",
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                🦅 Steadfast
              </Tag>
            ) : (
              <Tag
                color="default"
                style={{
                  margin: 0,
                  fontWeight: 800,
                  fontSize: "10.5px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                🏢 Offline
              </Tag>
            )}

            {trackingId ? (
              <Flex align="center" gap={3}>
                <Text
                  code
                  style={{ fontSize: "11px", fontWeight: 900, cursor: "pointer" }}
                  onClick={() => onOpenTrackingModal?.(trackingId, order.orderNumber)}
                >
                  {trackingId}
                </Text>
                {onSyncCourierStatus && (
                  <Tooltip title="Sync status">
                    <Button
                      size="small"
                      type="text"
                      style={{ width: 20, height: 20, padding: 0 }}
                      icon={<ReloadOutlined style={{ fontSize: "11px", color: "#3b82f6" }} />}
                      onClick={() => onSyncCourierStatus(orderIdStr, trackingId)}
                    />
                  </Tooltip>
                )}
              </Flex>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenShipModal && (
              <Button
                size="small"
                type="primary"
                icon={<RocketOutlined />}
                style={{
                  fontSize: "11px",
                  height: "28px",
                  padding: "0 10px",
                  borderRadius: 8,
                  fontWeight: 800,
                  backgroundColor: provider === "pathao" ? "#e11d48" : provider === "steadfast" ? "#2563eb" : "#0f172a",
                  borderColor: "transparent",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
                onClick={() => onOpenShipModal(order)}
              >
                🚀 Ship Order
              </Button>
            )}

            {orderIdStr && (
              <Link href={`/admin/orders/${orderIdStr}`}>
                <Button
                  size="small"
                  type="default"
                  icon={<EyeOutlined />}
                  style={{
                    fontSize: "11px",
                    height: "28px",
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                >
                  View
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Live Courier Status (If available) */}
        {order.courierStatus && (
          <div className="pt-1 text-center">
            <Tag
              color={courierInfo.color}
              style={{
                margin: 0,
                fontSize: "10.5px",
                fontWeight: 800,
                borderRadius: 6,
                padding: "2px 10px",
                cursor: trackingId ? "pointer" : "default",
              }}
              onClick={() => trackingId && onOpenTrackingModal?.(trackingId, order.orderNumber)}
            >
              {courierInfo.label}
            </Tag>
          </div>
        )}
      </div>
    </Card>
  );
}
