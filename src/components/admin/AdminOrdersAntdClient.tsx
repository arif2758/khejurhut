// src/components/admin/AdminOrdersAntdClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, Tag, Input, Select, Button, Card, Space, Typography, Badge, Flex, Tooltip, Modal, Tabs } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, EyeOutlined, ShoppingCartOutlined, AlertOutlined, PrinterOutlined, EditOutlined, SaveOutlined, CarOutlined, ReloadOutlined, RocketOutlined, EllipsisOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import { IOrder, CHANNEL_LABELS, IOrderSerializable } from "@/types/order";
import { formatPrice } from "@/lib/priceUtils";
import { format } from "date-fns";
import { getZoneBadgeInfo } from "@/lib/shipping";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { CreateOrderModal } from "@/components/admin/CreateOrderModal";
import { PathaoTrackingModal } from "@/components/admin/PathaoTrackingModal";
import { updateOrderTrackingId } from "@/actions/pathaoTracking";
import { CarrierSelectorModal } from "@/components/admin/CarrierSelectorModal";
import { syncOrderCarrierStatusAction } from "@/actions/courierActions";

import { AdminOrderMobileCard } from "@/components/admin/AdminOrderMobileCard";
import { parseCourierStatus } from "@/lib/courierUtils";

const { Text, Title } = Typography;

interface ProductOption {
  _id: string;
  title: string;
  thumbnail?: string;
  colors?: string[];
  sizes?: string[];
  salePrice?: number;
  regularPrice: number;
}

export function AdminOrdersAntdClient({
  orders,
  products,
  isDashboard = false,
}: {
  orders: IOrder[];
  products: ProductOption[];
  isDashboard?: boolean;
}) {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [activeTabKey, setActiveTabKey] = useState<string>("active");

  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
    if (key.startsWith("carrier_")) {
      setCarrierFilter(key.replace("carrier_", ""));
      setStatusFilter("all");
    } else {
      setCarrierFilter("all");
      setStatusFilter(key);
    }
  };

  // Carrier Shipping Modal State
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [selectedShipOrder, setSelectedShipOrder] = useState<IOrderSerializable | null>(null);

  // Pathao Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [activeConsignmentId, setActiveConsignmentId] = useState("");
  const [activeOrderNumber, setActiveOrderNumber] = useState("");

  // Edit Consignment ID Modal State
  const [editConsignmentModalOpen, setEditConsignmentModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState("");
  const [editingOrderNumber, setEditingOrderNumber] = useState("");
  const [inputConsignmentId, setInputConsignmentId] = useState("");
  const [savingConsignment, setSavingConsignment] = useState(false);

  // Per-row sync state
  const [syncingOrderId, setSyncingOrderId] = useState("");

  const openShipModal = (orderRecord: IOrder) => {
    setSelectedShipOrder(JSON.parse(JSON.stringify(orderRecord)));
    setShipModalOpen(true);
  };

  const openTrackingModal = (cid: string, orderNum: string) => {
    setActiveConsignmentId(cid);
    setActiveOrderNumber(orderNum);
    setTrackingModalOpen(true);
  };

  const openEditConsignmentModal = (orderId: string, orderNum: string, currentId?: string) => {
    setEditingOrderId(orderId);
    setEditingOrderNumber(orderNum);
    setInputConsignmentId(currentId || "");
    setEditConsignmentModalOpen(true);
  };

  const syncSingleOrderStatus = async (orderId: string) => {
    setSyncingOrderId(orderId);
    try {
      const res = await syncOrderCarrierStatusAction(orderId);
      if (res.success) {
        toast.success(res.message || "Live courier status updated!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to sync courier status");
      }
    } catch {
      toast.error("Failed to sync status");
    } finally {
      setSyncingOrderId("");
    }
  };

  const handleSaveConsignmentModal = async (overrideId?: string) => {
    const targetId = overrideId !== undefined ? overrideId : inputConsignmentId;
    setSavingConsignment(true);
    try {
      const res = await updateOrderTrackingId(editingOrderId, targetId);
      if (res.success) {
        if (!targetId.trim()) {
          toast.success("Consignment ID removed!");
        } else {
          toast.success("Consignment ID saved and live status synced!");
        }
        setEditConsignmentModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save Consignment ID");
      }
    } catch {
      toast.error("Error saving Consignment ID");
    } finally {
      setSavingConsignment(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchText ||
      order.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      order.shipping.name.toLowerCase().includes(searchText.toLowerCase()) ||
      order.shipping.phone.includes(searchText);

    const matchesStatus =
      statusFilter === "active"
        ? !["returned", "cancelled"].includes(order.orderStatus || "")
        : statusFilter === "all"
        ? true
        : order.orderStatus === statusFilter;

    const matchesChannel =
      channelFilter === "all" || (order.channelSource || "web") === channelFilter;

    const matchesCarrier =
      carrierFilter === "all" || (order.courierProvider || "offline") === carrierFilter;

    return matchesSearch && matchesStatus && matchesChannel && matchesCarrier;
  });

  const activeCount = orders.filter((o) => !["returned", "cancelled"].includes(o.orderStatus || "")).length;
  const inReturnCount = orders.filter((o) => o.orderStatus === "in_return").length;
  const returnedCount = orders.filter((o) => o.orderStatus === "returned").length;
  const cancelledCount = orders.filter((o) => o.orderStatus === "cancelled").length;
  const pendingCount = orders.filter((o) => o.orderStatus === "pending").length;

  const pathaoCount = orders.filter((o) => o.courierProvider === "pathao").length;
  const steadfastCount = orders.filter((o) => o.courierProvider === "steadfast").length;
  const offlineCount = orders.filter((o) => !o.courierProvider || o.courierProvider === "offline").length;

  const columns: ColumnsType<IOrder> = [
    {
      title: "Order ID & Channel",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (_, record) => {
        const channelKey = record.channelSource || "web";
        const channelLabel = CHANNEL_LABELS[channelKey] || "Website";
        return (
          <Flex vertical gap={2}>
            <Text code style={{ fontWeight: 800, fontSize: "13px" }}>
            {record.orderNumber}
            </Text>
            <Tag color="blue" style={{ fontSize: "10px", borderRadius: "6px", width: "fit-content" }}>
              {channelLabel}
            </Tag>
          </Flex>
        );
      },
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => {
        const vipDeduction = (record.vipPrivilege && record.vipPrivilege > 0) ? record.vipPrivilege : (record.discount || 0);
        const districtName = record.shipping?.district;
        return (
          <div>
            <Flex align="center" gap={6} wrap="wrap">
              <Text strong style={{ display: "block", fontSize: "13px" }}>
                {record.shipping.name}
              </Text>
              {vipDeduction > 0 && (
                <Tag color="gold" style={{ margin: 0, fontSize: "10px", fontWeight: 900, padding: "0 4px" }}>
                  🌟 VIP
                </Tag>
              )}
              {districtName && (
                <Tag
                  variant="filled"
                  style={{
                    margin: 0,
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "0 6px",
                    borderRadius: 4,
                    background: "#f1f5f9",
                    color: "#475569",
                  }}
                >
                  📍 {districtName}
                </Tag>
              )}
            </Flex>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              {record.shipping.phone}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Date",
      key: "date",
      render: (_, record) => (
        <div>
          <Text style={{ display: "block", fontSize: "12px", fontWeight: 600 }}>
            {format(new Date(record.createdAt!), "dd MMM, yyyy")}
          </Text>
          <Text type="secondary" style={{ fontSize: "10px" }}>
            {format(new Date(record.createdAt!), "hh:mm a")}
          </Text>
        </div>
      ),
    },
    {
      title: "Amount (COD)",
      key: "amount",
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: "14px", color: "#0f172a", display: "block" }}>
            {formatPrice(Math.max(0, record.total - (record.advancePaid || 0)))}
          </Text>
          {Boolean(record.advancePaid && record.advancePaid > 0) && (
            <Text type="secondary" style={{ fontSize: "10px", color: "#2563eb", fontWeight: 700 }}>
              Adv Paid: {formatPrice(record.advancePaid || 0)}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      render: (_, record) => (
        <Tag color={record.paymentMethod === "mobile" ? "cyan" : "default"}>
          {record.paymentMethod?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Courier & Shipping",
      key: "courier",
      render: (_, record) => {
        const provider = record.courierProvider || "offline";
        const trackingId = record.courierTrackingId || record.courierConsignmentId || "";

        const courierInfo = parseCourierStatus(
          record.courierStatus,
          record.courierLastLogDesc,
          record.courierRiderName,
          record.courierRiderPhone
        );

        const isSyncing = syncingOrderId === record._id.toString();

        return (
          <div className="space-y-1">
            <Flex align="center" gap={4} wrap="wrap">
              {provider === "pathao" ? (
                <Tag color="rose" style={{ margin: 0, fontWeight: 800, fontSize: "10px", background: "#ffe4e6", color: "#e11d48", border: "1px solid #fecdd3" }}>
                  🔴 Pathao
                </Tag>
              ) : provider === "steadfast" ? (
                <Tag color="blue" style={{ margin: 0, fontWeight: 800, fontSize: "10px", background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                  🦅 Steadfast
                </Tag>
              ) : (
                <Tag color="default" style={{ margin: 0, fontWeight: 800, fontSize: "10px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}>
                  🏢 Offline
                </Tag>
              )}

              <Button
                size="small"
                type="primary"
                icon={<RocketOutlined />}
                style={{
                  fontSize: "10px",
                  height: "22px",
                  padding: "0 8px",
                  borderRadius: 6,
                  fontWeight: 700,
                  backgroundColor: provider === "pathao" ? "#e11d48" : provider === "steadfast" ? "#2563eb" : "#0f172a",
                }}
                onClick={() => openShipModal(record)}
              >
                Ship Order
              </Button>
            </Flex>

            {trackingId ? (
              <Flex align="center" gap={4} style={{ marginTop: 4 }}>
                <Text code style={{ fontSize: "11px", fontWeight: 900 }}>
                  {trackingId}
                </Text>
                <Tooltip title="Sync live status">
                  <Button
                    size="small"
                    type="text"
                    loading={isSyncing}
                    icon={<ReloadOutlined style={{ fontSize: "11px", color: "#3b82f6" }} />}
                    onClick={() => syncSingleOrderStatus(record._id.toString())}
                  />
                </Tooltip>
              </Flex>
            ) : null}

            {record.courierStatus && (
              <div style={{ marginTop: 2 }}>
                <Tag
                  color={courierInfo.color}
                  style={{
                    fontWeight: 900,
                    fontSize: "10px",
                    margin: 0,
                    borderRadius: 4,
                    cursor: trackingId ? "pointer" : "default",
                    padding: "1px 6px",
                  }}
                  onClick={() => trackingId && openTrackingModal(trackingId, record.orderNumber)}
                >
                  {courierInfo.label}
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <StatusUpdater
          orderId={record._id.toString()}
          currentStatus={record.orderStatus || "pending"}
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Link href={`/admin/orders/${record._id?.toString()}`}>
          <Button icon={<EyeOutlined />} type="default" shape="circle" />
        </Link>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }} className="space-y-4">
      {/* Header Bar - Hidden in Dashboard */}
      {!isDashboard && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div style={{ textAlign: "center" }}>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            Orders Management
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Track and manage all customer purchases across all sales channels.
          </Text>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          <Badge count={pendingCount} overflowCount={99}>
            <Button
              icon={<AlertOutlined />}
              type={statusFilter === "pending" ? "primary" : "dashed"}
              danger
              onClick={() =>
                setStatusFilter((prev) => (prev === "pending" ? "all" : "pending"))
              }
              style={{ fontWeight: 700 }}
            >
              Pending Orders
            </Button>
          </Badge>

          {pendingCount > 0 && (
            <Button
              icon={<PrinterOutlined />}
              onClick={() => {
                const pendingIds = orders
                  .filter((o) => o.orderStatus === "pending")
                  .map((o) => o._id.toString());

                if (pendingIds.length === 0) return toast.error("কোনো পেন্ডিং অর্ডার নেই");

                // Open first pending invoice or batch window
                window.open(`/admin/orders/${pendingIds[0]}/invoice`, "_blank");
              }}
              style={{ fontWeight: 700 }}
            >
              Batch Print A5 ({pendingCount})
            </Button>
          )}

          <CreateOrderModal products={products} triggerText="+ Create / 🤖 AI Order" />
        </div>
      </div>
      )}

      {/* Filters Toolbar - Hidden in Dashboard */}
      {!isDashboard && (
        <Card
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: "12px 16px" } }}
          className="border border-slate-200 bg-white shadow-sm"
        >
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <Input
              placeholder="Search by Order ID or Name..."
              prefix={<SearchOutlined style={{ color: "#94a3b8", marginRight: 4 }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ borderRadius: 10 }}
              className="w-full sm:w-80"
              allowClear
            />

            <Space wrap className="w-full sm:w-auto justify-between sm:justify-start">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 170 }}
                options={[
                  { value: "active", label: `⚡ Active Orders (${activeCount})` },
                  { value: "in_return", label: `🚚 In-Return (${inReturnCount})` },
                  { value: "returned", label: `📦 Returned (${returnedCount})` },
                  { value: "cancelled", label: `❌ Cancelled (${cancelledCount})` },
                  { value: "all", label: `📋 All Orders (${orders.length})` },
                  { value: "pending", label: "Pending Only" },
                  { value: "processing", label: "Processing Only" },
                  { value: "shipped", label: "Shipped Only" },
                ]}
              />

              <Select
                defaultValue="all"
                value={channelFilter}
                onChange={setChannelFilter}
                style={{ width: 140 }}
                options={[
                  { value: "all", label: "All Channels" },
                  ...Object.entries(CHANNEL_LABELS).map(([k, label]) => ({
                    value: k,
                    label,
                  })),
                ]}
              />

              <Select
                defaultValue="all"
                value={carrierFilter}
                onChange={setCarrierFilter}
                style={{ width: 160 }}
                options={[
                  { value: "all", label: "All Carriers" },
                  { value: "pathao", label: `🔴 Pathao (${pathaoCount})` },
                  { value: "steadfast", label: `🦅 Steadfast (${steadfastCount})` },
                  { value: "offline", label: `🏢 Offline (${offlineCount})` },
                ]}
              />
            </Space>
          </div>

          {/* Native Ant Design Tabs with automatic responsive overflow control & three-dot dropdown menu */}
          <div className="pt-2 border-t border-slate-100/80">
            <Tabs
              activeKey={activeTabKey}
              onChange={handleTabChange}
              type="line"
              size="middle"
              more={{ icon: <EllipsisOutlined style={{ fontSize: 18, color: "#2563eb" }} /> }}
              style={{ marginBottom: 0 }}
              tabBarStyle={{ marginBottom: 0 }}
              items={[
                {
                  key: "active",
                  label: `⚡ Active (${activeCount})`,
                },
                {
                  key: "carrier_pathao",
                  label: (
                    <span style={{ color: "#e11d48", fontWeight: 700 }}>
                      🔴 Pathao ({pathaoCount})
                    </span>
                  ),
                },
                {
                  key: "carrier_steadfast",
                  label: (
                    <span style={{ color: "#2563eb", fontWeight: 700 }}>
                      🦅 Steadfast ({steadfastCount})
                    </span>
                  ),
                },
                {
                  key: "carrier_offline",
                  label: (
                    <span style={{ color: "#475569", fontWeight: 700 }}>
                      🏢 Offline ({offlineCount})
                    </span>
                  ),
                },
                {
                  key: "in_return",
                  label: (
                    <span style={{ color: "#d97706", fontWeight: 700 }}>
                      🚚 In-Return ({inReturnCount})
                    </span>
                  ),
                },
                {
                  key: "returned",
                  label: (
                    <span style={{ color: "#c026d3", fontWeight: 700 }}>
                      📦 Returned ({returnedCount})
                    </span>
                  ),
                },
                {
                  key: "cancelled",
                  label: (
                    <span style={{ color: "#dc2626", fontWeight: 700 }}>
                      ❌ Cancelled ({cancelledCount})
                    </span>
                  ),
                },
                {
                  key: "all",
                  label: `📋 All Archive (${orders.length})`,
                },
                {
                  key: "pending",
                  label: `⏳ Pending (${pendingCount})`,
                },
                {
                  key: "processing",
                  label: `⚙️ Processing (${orders.filter((o) => o.orderStatus === "processing").length})`,
                },
                {
                  key: "shipped",
                  label: `🚀 Shipped (${orders.filter((o) => o.orderStatus === "shipped").length})`,
                },
              ]}
            />
          </div>
        </div>
      </Card>
      )}

      {/* DESKTOP VIEW: Antd Data Table */}
      <div className="hidden lg:block">
        <Card style={{ borderRadius: isDashboard ? 0 : 16, overflow: "hidden", border: isDashboard ? 'none' : undefined }} styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey={(record) => record._id.toString()}
            rowClassName={(record) =>
              record.orderStatus === "in_return" ? "in-return-table-row font-semibold" : ""
            }
            scroll={{ x: 800 }}
            pagination={isDashboard ? false : { pageSize: 10, showSizeChanger: true }}
            locale={{
              emptyText: (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <ShoppingCartOutlined style={{ fontSize: 40, color: "#ccc" }} />
                  <p style={{ marginTop: 8, fontWeight: 700, color: "#999" }}>
                    No Orders Found
                  </p>
                </div>
              ),
            }}
          />
          <style jsx global>{`
            .in-return-table-row > td {
              background-color: #fef2f2 !important;
              border-top: 1.5px solid #ef4444 !important;
              border-bottom: 1.5px solid #ef4444 !important;
            }
            .in-return-table-row > td:first-child {
              border-left: 1.5px solid #ef4444 !important;
            }
            .in-return-table-row > td:last-child {
              border-right: 1.5px solid #ef4444 !important;
            }
          `}</style>
        </Card>
      </div>

      {/* MOBILE VIEW: Ultra Responsive Fluid Antd Cards */}
      <div className="block lg:hidden mt-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <AdminOrderMobileCard
              key={order._id.toString()}
              order={order}
              marginBottom={10}
              onOpenShipModal={openShipModal}
              onAddPathaoId={openEditConsignmentModal}
              onOpenTrackingModal={openTrackingModal}
              onEditPathaoId={openEditConsignmentModal}
              onSyncCourierStatus={syncSingleOrderStatus}
            />
          ))
        ) : (
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 30 } }}>
            <div style={{ textAlign: "center" }}>
              <ShoppingCartOutlined style={{ fontSize: 36, color: "#ccc" }} />
              <p style={{ marginTop: 8, fontWeight: 700, color: "#999" }}>
                No Orders Found
              </p>
            </div>
          </Card>
        )}
      </div>

      <CarrierSelectorModal
        visible={shipModalOpen}
        order={selectedShipOrder}
        onClose={() => setShipModalOpen(false)}
        onSuccess={() => router.refresh()}
      />

      <PathaoTrackingModal
        open={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        consignmentId={activeConsignmentId}
        orderNumber={activeOrderNumber}
      />

      {/* Quick Edit Consignment ID Modal */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <CarOutlined style={{ color: "#e11d48", fontSize: 18 }} />
            <span>Pathao Consignment ID (Order #{editingOrderNumber})</span>
          </Flex>
        }
        open={editConsignmentModalOpen}
        onCancel={() => setEditConsignmentModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditConsignmentModalOpen(false)} style={{ borderRadius: 8 }}>
            Cancel
          </Button>,
          inputConsignmentId.trim() && (
            <Button
              key="clear"
              danger
              loading={savingConsignment}
              onClick={() => handleSaveConsignmentModal("")}
              style={{ borderRadius: 8, fontWeight: 700 }}
            >
              🗑️ Remove ID
            </Button>
          ),
          <Button
            key="submit"
            type="primary"
            loading={savingConsignment}
            onClick={() => handleSaveConsignmentModal()}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            Save & Sync
          </Button>,
        ].filter(Boolean)}
        style={{ borderRadius: 16 }}
        styles={{ body: { padding: "16px 0 8px 0" } }}
      >
        <div className="space-y-3">
          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
            পাঠাও হাব থেকে বুকিং করার পর পাওয়া Consignment ID (যেমন: <Text code>SG030826FV2JHW</Text>) নিচে লিখুন। ভুল বসানো হলে ঘরটি খালি রেখে **Save & Sync** অথবা **Remove ID** বাটনে চাপুন।
          </Text>
          <Input
            placeholder="e.g. SG030826FV2JHW"
            value={inputConsignmentId}
            onChange={(e) => setInputConsignmentId(e.target.value)}
            style={{ borderRadius: 10, height: 40 }}
            allowClear
          />
        </div>
      </Modal>
    </div>
  );
}
