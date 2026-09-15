// src/components/admin/CarrierSelectorModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Tabs,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Button,
  Tag,
  Alert,
  Space,
  Spin,
  message,
} from "antd";
import {
  TruckOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { CourierProviderName, IOrderSerializable } from "@/types/order";
import {
  bookSingleOrderAction,
  getPathaoStoresAction,
} from "@/actions/courierActions";

interface CarrierSelectorModalProps {
  visible: boolean;
  order: IOrderSerializable | null;
  onClose: () => void;
  onSuccess?: (updatedOrder: IOrderSerializable) => void;
}

export const CarrierSelectorModal: React.FC<CarrierSelectorModalProps> = ({
  visible,
  order,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [activeCarrier, setActiveCarrier] = useState<CourierProviderName>("pathao");
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

  useEffect(() => {
    if (visible && order) {
      const initialProvider =
        order.courierProvider && order.courierProvider !== "offline"
          ? order.courierProvider
          : "pathao";
      setActiveCarrier(initialProvider);

      form.setFieldsValue({
        recipientName: order.shipping?.name || order.customerPhone,
        recipientPhone: order.shipping?.phone || order.customerPhone,
        recipientAddress:
          [
            order.shipping?.addressLine1,
            order.shipping?.addressLine2,
            order.shipping?.district || order.shipping?.city,
          ]
            .filter(Boolean)
            .join(", ") || "",
        codAmount: order.paymentMethod === "cod" ? order.total || 0 : 0,
        weightKg: 0.5,
        deliveryType: 48,
        steadfastDeliveryType: 0,
        note: order.customerNotes || "",
        trackingCode: order.courierTrackingId || "",
        storeId: order.courierStoreId ? Number(order.courierStoreId) : undefined,
      });

      // Load Pathao stores if selecting Pathao
      loadPathaoStores();
    }
  }, [visible, order]);

  const loadPathaoStores = async () => {
    setLoadingStores(true);
    try {
      const res = await getPathaoStoresAction();
      if (res.success && res.stores) {
        setStores(res.stores);
        if (res.stores.length > 0 && !form.getFieldValue("storeId")) {
          const defaultSt =
            res.stores.find((s: any) => s.is_default_store) || res.stores[0];
          form.setFieldValue("storeId", defaultSt.store_id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch stores", err);
    } finally {
      setLoadingStores(false);
    }
  };

  if (!order) return null;

  const handleBook = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const options = {
        weightKg: values.weightKg,
        storeId: values.storeId,
        deliveryType: values.deliveryType,
        steadfastDeliveryType: values.steadfastDeliveryType,
        note: values.note,
        trackingCode: values.trackingCode,
      };

      const result = await bookSingleOrderAction(
        order._id,
        activeCarrier,
        options
      );

      if (result.success && result.order) {
        message.success(
          result.message || `${activeCarrier.toUpperCase()} এ অর্ডার বুকিং সম্পন্ন হয়েছে!`
        );
        if (onSuccess) onSuccess(result.order);
        onClose();
      } else {
        message.error(result.error || "বুকিং করতে ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err.message || "একটি ত্রুটি ঘটেছে");
    } finally {
      setLoading(false);
    }
  };

  const recipientName = order.shipping?.name || order.customerPhone;
  const recipientPhone = order.shipping?.phone || order.customerPhone;
  const address =
    [
      order.shipping?.addressLine1,
      order.shipping?.addressLine2,
      order.shipping?.district || order.shipping?.city,
    ]
      .filter(Boolean)
      .join(", ") || "N/A";
  const codAmount = order.paymentMethod === "cod" ? order.total || 0 : 0;

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TruckOutlined style={{ fontSize: 20, color: "#1890ff" }} />
          <span>
            অর্ডার শিপমেন্ট বুকিং — <strong>#{order.orderNumber}</strong>
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      style={{ maxWidth: "calc(100vw - 24px)", width: 640 }}
      centered
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          বাতিল (Cancel)
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SendOutlined />}
          loading={loading}
          onClick={handleBook}
          style={{
            backgroundColor:
              activeCarrier === "pathao"
                ? "#e11d48"
                : activeCarrier === "steadfast"
                ? "#2563eb"
                : "#475569",
            borderColor: "transparent",
          }}
        >
          {activeCarrier === "offline"
            ? "সেভ ম্যানুয়াল স্ট্যাটাস"
            : `১-ক্লিক বুক করুন (${activeCarrier.toUpperCase()})`}
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
          <div>
            <strong>গ্রাহক:</strong> {recipientName} ({recipientPhone})
          </div>
          <div>
            <strong>COD পরিমাণ:</strong>{" "}
            <Tag color={codAmount > 0 ? "volcano" : "green"}>
              ৳{codAmount.toLocaleString()} BDT
            </Tag>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          <EnvironmentOutlined style={{ marginRight: 4 }} />
          {address}
        </div>
      </div>

      <Tabs
        activeKey={activeCarrier}
        onChange={(key) => setActiveCarrier(key as CourierProviderName)}
        items={[
          {
            key: "pathao",
            label: (
              <span style={{ fontWeight: 600, color: "#e11d48" }}>
                🔴 Pathao Courier
              </span>
            ),
          },
          {
            key: "steadfast",
            label: (
              <span style={{ fontWeight: 600, color: "#2563eb" }}>
                🦅 Steadfast Courier
              </span>
            ),
          },
          {
            key: "offline",
            label: (
              <span style={{ fontWeight: 600, color: "#475569" }}>
                🏢 Offline / Manual
              </span>
            ),
          },
        ]}
      />

      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        {activeCarrier === "pathao" && (
          <>
            <Alert
              type="info"
              showIcon
              title="Pathao Merchant API"
              description="অর্ডারটি সরাসরি আপনার পাঠাও মার্চেন্ট প্যানেলে অটো-বুকিং হবে।"
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="storeId"
              label={
                <span>
                  <ShopOutlined style={{ marginRight: 4 }} /> পিকআপ মার্চেন্ট স্টোর (Store ID)
                </span>
              }
              rules={[{ required: true, message: "দয়া করে পাঠাও স্টোর নির্বাচন করুন" }]}
            >
              <Select
                placeholder="স্টোর নির্বাচন করুন"
                loading={loadingStores}
                notFoundContent={
                  loadingStores ? <Spin size="small" /> : "কোন স্টোর পাওয়া যায়নি"
                }
              >
                {stores.map((s) => (
                  <Select.Option key={s.store_id} value={s.store_id}>
                    {s.store_name} ({s.store_address})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Form.Item
                name="weightKg"
                label="পার্সেল ওজন (KG)"
                rules={[{ required: true, message: "ওজন প্রদান করুন" }]}
              >
                <Space.Compact style={{ width: "100%" }}>
                  <InputNumber
                    min={0.5}
                    max={10}
                    step={0.5}
                    style={{ flex: 1 }}
                  />
                  <Button disabled style={{ pointerEvents: "none", cursor: "default" }}>KG</Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item
                name="deliveryType"
                label="ডেলিভারি টাইপ"
                rules={[{ required: true }]}
              >
                <Radio.Group buttonStyle="solid" style={{ width: "100%" }}>
                  <Radio.Button value={48}>Normal (48 Hrs)</Radio.Button>
                  <Radio.Button value={12}>Express (12 Hrs)</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </div>

            <Form.Item name="note" label="বিশেষ নির্দেশনাবলী (Special Instructions)">
              <Input.TextArea
                rows={2}
                placeholder="উদাহরণ: Deliver before 5 PM, Handle with care"
              />
            </Form.Item>
          </>
        )}

        {activeCarrier === "steadfast" && (
          <>
            <Alert
              type="info"
              showIcon
              title="Steadfast Courier API V1"
              description="স্টিডফাস্ট এপিআই-এর মাধ্যমে আপনার মার্চেন্ট প্যানেলে ইনস্ট্যান্ট কনসাইনমেন্ট তৈরি হবে।"
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="steadfastDeliveryType"
              label="ডেলিভারি টাইপ (Delivery Type)"
              rules={[{ required: true }]}
            >
              <Radio.Group buttonStyle="solid">
                <Radio.Button value={0}>🏠 Home Delivery (হোম ডেলিভারি)</Radio.Button>
                <Radio.Button value={1}>🏢 Hub Pickup (পয়েন্ট ডেলিভারি)</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="note" label="ডেলিভারি নোট (Delivery Note / Instruction)">
              <Input.TextArea
                rows={2}
                placeholder="উদাহরণ: কল করে ডেলিভারি দিবেন, চেক করতে দিবেন"
              />
            </Form.Item>
          </>
        )}

        {activeCarrier === "offline" && (
          <>
            <Alert
              type="warning"
              showIcon
              title="অফলাইন / ম্যানুয়াল বুকিং"
              description="কুরিয়ার কাউন্টারে বুকিং দিয়ে ম্যানুয়ালি ট্র্যাকিং আইডি ও স্ট্যাটাস লিখে আপডেট রাখতে পারবেন।"
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="trackingCode"
              label="কুরিয়ার কনসাইনমেন্ট / ট্র্যাকিং আইডি (Tracking Code)"
            >
              <Input placeholder="উদাহরণ: STEAD-992384 / PATH-88231" />
            </Form.Item>

            <Form.Item name="note" label="অভ্যন্তরীণ নোট (Internal Admin Note)">
              <Input.TextArea
                rows={2}
                placeholder="উদাহরণ: সুন্দরবন কুরিয়ার কাউন্টারে বুক করা হয়েছে"
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};
