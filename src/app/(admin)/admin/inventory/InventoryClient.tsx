// src/app/(admin)/admin/inventory/InventoryClient.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tabs,
  Input,
  Button,
  Tag,
  Flex,
  Tooltip,
  Modal,
  Spin,
} from "antd";
import {
  InboxOutlined,
  CopyOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
  MinusOutlined,
  SaveOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import {
  PickListItem,
  InventoryMatrixItem,
  getWarehousePickListAction,
  getInventoryMatrixAction,
  updateProductStockAction,
} from "@/actions/inventory";

const { Text, Title } = Typography;

interface InventoryClientProps {
  initialPickList: PickListItem[];
  initialTotalUnits: number;
  initialActiveOrders: number;
  initialMatrix: InventoryMatrixItem[];
  initialTotalProducts: number;
  initialLowStock: number;
  initialOutOfStock: number;
}

export function InventoryClient({
  initialPickList,
  initialTotalUnits,
  initialActiveOrders,
  initialMatrix,
  initialTotalProducts,
  initialLowStock,
  initialOutOfStock,
}: InventoryClientProps) {
  const [activeTab, setActiveTab] = useState<string>("picklist");
  const [pickList, setPickList] = useState<PickListItem[]>(initialPickList);
  const [totalUnits, setTotalUnits] = useState<number>(initialTotalUnits);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(initialActiveOrders);

  const [matrix, setMatrix] = useState<InventoryMatrixItem[]>(initialMatrix);
  const [totalProducts, setTotalProducts] = useState<number>(initialTotalProducts);
  const [lowStockCount, setLowStockCount] = useState<number>(initialLowStock);
  const [outOfStockCount, setOutOfStockCount] = useState<number>(initialOutOfStock);

  const [isLoadingPickList, setIsLoadingPickList] = useState<boolean>(false);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState<boolean>(false);

  const [search, setSearch] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingStockMap, setEditingStockMap] = useState<Record<string, number>>({});
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  const toggleExpandProduct = (productId: string) => {
    setExpandedProductIds((prev) => ({
      ...prev,
      [productId]: prev[productId] === undefined ? false : !prev[productId],
    }));
  };

  const handleExpandAllVariants = () => {
    const newMap: Record<string, boolean> = {};
    matrix.forEach((p) => {
      if (p.hasVariants) newMap[p._id] = true;
    });
    setExpandedProductIds(newMap);
    toast.info("সব ভ্যারিয়েন্ট খুলে দেওয়া হয়েছে");
  };

  const handleCollapseAllVariants = () => {
    const newMap: Record<string, boolean> = {};
    matrix.forEach((p) => {
      if (p.hasVariants) newMap[p._id] = false;
    });
    setExpandedProductIds(newMap);
    toast.info("সব ভ্যারিয়েন্ট ভাজ করা হয়েছে");
  };

  // Refresh Warehouse Pick List
  const handleRefreshPickList = async () => {
    setIsLoadingPickList(true);
    try {
      const res = await getWarehousePickListAction();
      if (res.success && res.pickList) {
        setPickList(res.pickList);
        setTotalUnits(res.totalUnitsNeeded || 0);
        setActiveOrdersCount(res.activeOrdersCount || 0);
        toast.success("পিক-লিস্ট রিলোড সম্পন্ন হয়েছে!");
      } else {
        toast.error(res.error || "পিক-লিস্ট লোড করতে ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      toast.error("নেটওয়ার্ক ত্রুটি");
    } finally {
      setIsLoadingPickList(false);
    }
  };

  // Refresh Inventory Matrix
  const handleRefreshMatrix = async () => {
    setIsLoadingMatrix(true);
    try {
      const res = await getInventoryMatrixAction();
      if (res.success && res.matrix) {
        setMatrix(res.matrix);
        setTotalProducts(res.totalProducts || 0);
        setLowStockCount(res.lowStockCount || 0);
        setOutOfStockCount(res.outOfStockCount || 0);
        toast.success("স্টক মেটাবোলিজম রিলোড হয়েছে!");
      } else {
        toast.error(res.error || "স্টক ডাটা লোড করতে ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      toast.error("নেটওয়ার্ক ত্রুটি");
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  // Copy Pick List for WhatsApp / Print
  const handleCopyPickList = () => {
    if (pickList.length === 0) {
      toast.error("আজকে পিক করার মতো কোনো আইটেম নেই!");
      return;
    }

    const todayDate = new Date().toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let text = `📦 *আজকের গোডাউন প্যাকিং রিকুইজিশন লিস্ট (${todayDate})*\n`;
    text += `🎯 মোট অর্ডার: ${activeOrdersCount} টি | মোট প্রোডাক্ট: ${totalUnits} পিস\n`;
    text += `------------------------------------\n\n`;

    pickList.forEach((item, index) => {
      text += `${index + 1}. *${item.productTitle}*\n`;
      if (item.color) text += `   • কালার: ${item.color}\n`;
      if (item.size) text += `   • সাইজ: ${item.size}\n`;
      text += `   👉 *পরিমাণ: ${item.totalQuantityNeeded} পিস*\n`;
      text += `   📄 অর্ডার: ${item.orderNumbers.join(", ")}\n\n`;
    });

    navigator.clipboard.writeText(text);
    toast.success("হোয়াটসঅ্যাপ পিক-লিস্ট কপি করা হয়েছে!");
  };

  // Print Pick List Window
  const handlePrintPickList = () => {
    if (pickList.length === 0) {
      toast.error("আজকে পিক করার মতো কোনো আইটেম নেই!");
      return;
    }

    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const todayDate = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Warehouse Pick List — ${todayDate}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
            h2 { margin-bottom: 4px; }
            .meta { color: #64748b; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f1f5f9; }
            .qty { font-weight: bold; font-size: 16px; color: #2563eb; }
            .orders { font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <h2>📦 Warehouse Pick List (প্যাকিং লিস্ট)</h2>
          <div class="meta">তারিখ: ${todayDate} | মোট অর্ডার: ${activeOrdersCount} টি | মোট আইটেম: ${totalUnits} পিস</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>প্রোডাক্টের নাম</th>
                <th>ভ্যারিয়েন্ট (কালার/সাইজ)</th>
                <th>প্রয়োজনীয় পরিমাণ</th>
                <th>সংশ্লিষ্ট অর্ডার #</th>
              </tr>
            </thead>
            <tbody>
    `;

    pickList.forEach((item, idx) => {
      const variantDesc = [item.color ? `Color: ${item.color}` : "", item.size ? `Size: ${item.size}` : ""]
        .filter(Boolean)
        .join(" | ");

      html += `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${item.productTitle}</strong></td>
          <td>${variantDesc || "Standard"}</td>
          <td class="qty">${item.totalQuantityNeeded} pcs</td>
          <td class="orders">${item.orderNumbers.join(", ")}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  };

  // Update inline stock quantity
  const handleUpdateStock = async (productId: string, variantId?: string | null, currentQty: number = 0) => {
    const editKey = variantId ? `${productId}_${variantId}` : productId;
    const newQty = editingStockMap[editKey] !== undefined ? editingStockMap[editKey] : currentQty;

    setUpdatingId(editKey);
    try {
      const res = await updateProductStockAction(productId, variantId, newQty);
      if (res.success) {
        toast.success("স্টক আপডেট সম্পন্ন হয়েছে!");
        // Update local matrix state
        setMatrix((prev) =>
          prev.map((prod) => {
            if (prod._id === productId) {
              if (variantId && prod.hasVariants) {
                const updatedVariants = prod.variants.map((v) =>
                  v._id === variantId ? { ...v, stockQuantity: newQty } : v
                );
                const total = updatedVariants.reduce((s, v) => s + v.stockQuantity, 0);
                return { ...prod, variants: updatedVariants, totalStock: total };
              } else {
                return { ...prod, totalStock: newQty };
              }
            }
            return prod;
          })
        );
      } else {
        toast.error(res.error || "স্টক আপডেট করতে সমস্যা হয়েছে");
      }
    } catch (err: any) {
      toast.error("ত্রুটি ঘটেছে");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered matrix items
  const filteredMatrix = matrix.filter((item) => {
    const q = search.toLowerCase();
    const matchesQuery =
      item.title.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      (item.categoryName || "").toLowerCase().includes(q);

    if (!matchesQuery) return false;

    if (stockFilter === "low") return item.totalStock > 0 && item.totalStock <= 5;
    if (stockFilter === "out") return item.totalStock <= 0;
    return true;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Header Banner */}
      <Flex align="center" justify="space-between" wrap="wrap" gap={12} className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 900, color: "#0f172a" }}>
            📦 Smart Inventory & Warehouse Pick List
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            আজকের প্যাকিং লিস্ট, গোডাউন রিকুইজিশন এবং ১-ক্লিক ভ্যারিয়েন্ট স্টক কন্ট্রোল
          </Text>
        </div>

        <Flex align="center" gap={8} wrap="wrap">
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrintPickList}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            Print Pick List
          </Button>
          <Button
            style={{ background: "#25D366", borderColor: "#25D366", color: "#fff", borderRadius: 8, fontWeight: 700 }}
            icon={<CopyOutlined />}
            onClick={handleCopyPickList}
          >
            Copy WhatsApp
          </Button>
        </Flex>
      </Flex>

      {/* Metric Cards Grid */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="shadow-xs border border-slate-200">
            <Statistic
              title={<span className="text-slate-500 font-bold text-xs">📦 TOTAL ITEMS TO PICK</span>}
              value={totalUnits}
              styles={{ content: { color: "#1677ff", fontWeight: 900, fontSize: 22 } }}
              prefix={<InboxOutlined />}
              suffix={<span className="text-xs text-slate-400 font-normal">pcs</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="shadow-xs border border-slate-200">
            <Statistic
              title={<span className="text-slate-500 font-bold text-xs">🎯 ACTIVE ORDERS</span>}
              value={activeOrdersCount}
              styles={{ content: { color: "#6366f1", fontWeight: 900, fontSize: 22 } }}
              suffix={<span className="text-xs text-slate-400 font-normal">orders</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="shadow-xs border border-slate-200">
            <Statistic
              title={<span className="text-slate-500 font-bold text-xs">⚠️ LOW STOCK (&lt;=5)</span>}
              value={lowStockCount}
              styles={{ content: { color: "#d97706", fontWeight: 900, fontSize: 22 } }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 14 } }} className="shadow-xs border border-slate-200">
            <Statistic
              title={<span className="text-slate-500 font-bold text-xs">🚨 OUT OF STOCK</span>}
              value={outOfStockCount}
              styles={{ content: { color: "#dc2626", fontWeight: 900, fontSize: 22 } }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs Container */}
      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: "12px 16px 16px 16px" } }} className="shadow-sm border border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "picklist",
              label: (
                <span className="font-bold">
                  📋 Daily Warehouse Pick List ({pickList.length})
                </span>
              ),
            },
            {
              key: "matrix",
              label: (
                <span className="font-bold">
                  📊 Inventory Stock Matrix ({matrix.length})
                </span>
              ),
            },
          ]}
        />

        {/* Tab 1: Daily Warehouse Pick List */}
        {activeTab === "picklist" && (
          <div className="space-y-4 pt-2">
            <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
              <Text type="secondary" style={{ fontSize: "12px", fontWeight: 700 }}>
                আজকের পন্ডিং/প্রসেসিং/রেডি অর্ডারের প্রোডাক্ট অনুযায়ী মোট প্রয়োজনীয় পরিমাণ:
              </Text>
              <Button
                size="small"
                icon={<ReloadOutlined spin={isLoadingPickList} />}
                onClick={handleRefreshPickList}
                style={{ borderRadius: 6, fontWeight: 700 }}
              >
                Refresh List
              </Button>
            </Flex>

            {isLoadingPickList ? (
              <div className="text-center py-12">
                <Spin size="large" />
                <div className="text-slate-400 text-xs mt-2">পিক-লিস্ট ক্যালকুলেট হচ্ছে...</div>
              </div>
            ) : pickList.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircleOutlined style={{ fontSize: 36, color: "#22c55e" }} />
                <div className="text-slate-700 font-bold text-sm mt-2">আজকে পিক করার মতো কোনো পেন্ডিং অর্ডার নেই!</div>
                <div className="text-slate-400 text-xs mt-1">সব শিপমেন্ট প্রসেসড অথবা প্রস্তুত রয়েছে।</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pickList.map((item, idx) => (
                  <Card
                    key={item.key || `pick_${idx}`}
                    style={{ borderRadius: 14 }}
                    styles={{ body: { padding: 14 } }}
                    className="border border-slate-200 bg-white hover:border-blue-400 transition-colors shadow-xs"
                  >
                    <div className="space-y-2">
                      <Flex align="start" justify="space-between" gap={8}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="bg-slate-100 text-slate-700 text-xs font-black px-2 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>
                          <Text strong style={{ fontSize: "13px", color: "#0f172a" }} className="truncate">
                            {item.productTitle}
                          </Text>
                        </div>
                        <Tag color="blue" style={{ margin: 0, fontWeight: 900, fontSize: "13px", padding: "2px 8px", borderRadius: 6 }}>
                          {item.totalQuantityNeeded} pcs
                        </Tag>
                      </Flex>

                      {/* Variant Badges */}
                      {(item.color || item.size) && (
                        <Flex align="center" gap={6} wrap="wrap" className="pt-0.5">
                          {item.color && (
                            <Tag color="cyan" style={{ margin: 0, fontWeight: 700, borderRadius: 6, fontSize: "11px" }}>
                              🎨 Color: {item.color}
                            </Tag>
                          )}
                          {item.size && (
                            <Tag color="purple" style={{ margin: 0, fontWeight: 700, borderRadius: 6, fontSize: "11px" }}>
                              📏 Size: {item.size}
                            </Tag>
                          )}
                        </Flex>
                      )}

                      {/* Linked Orders List */}
                      <div className="pt-2 border-t border-slate-100 text-xs">
                        <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: 2 }}>
                          📄 Linked Orders ({item.orderNumbers.length}):
                        </Text>
                        <Flex align="center" gap={4} wrap="wrap">
                          {item.orderNumbers.map((num, nIdx) => (
                            <Tag key={`${num}_${nIdx}`} style={{ margin: 0, fontSize: "10px", fontWeight: 800, background: "#f1f5f9", borderRadius: 4 }}>
                              #{num}
                            </Tag>
                          ))}
                        </Flex>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Inventory Stock Matrix & Quick Adjuster */}
        {activeTab === "matrix" && (
          <div className="space-y-4 pt-2">
            {/* Search & Filter Bar */}
            <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
              <Input
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                placeholder="প্রোডাক্ট টাইটেল, SKU বা ক্যাটাগরি দিয়ে সার্চ করুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 360, borderRadius: 10 }}
                allowClear
              />

              <Flex align="center" gap={6} wrap="wrap">
                <Tag
                  color={stockFilter === "all" ? "blue" : "default"}
                  onClick={() => setStockFilter("all")}
                  style={{ cursor: "pointer", fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}
                >
                  All ({matrix.length})
                </Tag>
                <Tag
                  color={stockFilter === "low" ? "warning" : "default"}
                  onClick={() => setStockFilter("low")}
                  style={{ cursor: "pointer", fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}
                >
                  ⚠️ Low Stock ({lowStockCount})
                </Tag>
                <Tag
                  color={stockFilter === "out" ? "error" : "default"}
                  onClick={() => setStockFilter("out")}
                  style={{ cursor: "pointer", fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}
                >
                  🚨 Out of Stock ({outOfStockCount})
                </Tag>

                <Button
                  size="small"
                  onClick={handleExpandAllVariants}
                  style={{ borderRadius: 6, fontWeight: 700, fontSize: "11px" }}
                >
                  👐 Expand All
                </Button>
                <Button
                  size="small"
                  onClick={handleCollapseAllVariants}
                  style={{ borderRadius: 6, fontWeight: 700, fontSize: "11px" }}
                >
                  📁 Collapse All
                </Button>
                <Button
                  size="small"
                  icon={<ReloadOutlined spin={isLoadingMatrix} />}
                  onClick={handleRefreshMatrix}
                  style={{ borderRadius: 6, fontWeight: 700 }}
                >
                  Refresh
                </Button>
              </Flex>
            </Flex>

            {isLoadingMatrix ? (
              <div className="text-center py-12">
                <Spin size="large" />
                <div className="text-slate-400 text-xs mt-2">স্টক মেটাবোলিজম ডাটা লোড হচ্ছে...</div>
              </div>
            ) : filteredMatrix.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                কোনো প্রোডাক্ট বা স্টক রেকর্ড পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMatrix.map((prod, pIdx) => {
                  const editKeyMain = prod._id;
                  const isMainUpdating = updatingId === editKeyMain;
                  const currentMainVal =
                    editingStockMap[editKeyMain] !== undefined
                      ? editingStockMap[editKeyMain]
                      : prod.totalStock;

                  const hasCriticalVariant = prod.variants.some((v) => {
                    const k = `${prod._id}_${v._id}`;
                    const val = editingStockMap[k] !== undefined ? editingStockMap[k] : v.stockQuantity;
                    return val === 1;
                  });

                  // Default: expand if low stock or has critical variant, unless explicitly toggled by user
                  const isExpanded =
                    expandedProductIds[prod._id] !== undefined
                      ? expandedProductIds[prod._id]
                      : (hasCriticalVariant || prod.totalStock <= 5);

                  return (
                    <Card
                      key={prod._id || `prod_${pIdx}`}
                      style={{ borderRadius: 14 }}
                      styles={{ body: { padding: 14 } }}
                      className="border border-slate-200 bg-white shadow-xs"
                    >
                      <div className="space-y-3">
                        {/* Product Header Row */}
                        <Flex align="center" justify="space-between" gap={10} wrap="wrap">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {prod.thumbnail && (
                              <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0 }} className="bg-slate-100 border border-slate-200">
                                <Image src={prod.thumbnail} alt={prod.title} fill style={{ objectFit: "cover" }} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <Text strong style={{ fontSize: "14px", color: "#0f172a", display: "block" }} className="truncate">
                                {prod.title}
                              </Text>
                              <Flex align="center" gap={6} className="mt-0.5">
                                <Text type="secondary" style={{ fontSize: "11px" }}>
                                  SKU: {prod.sku || "N/A"}
                                </Text>
                                <Tag style={{ fontSize: "10px", margin: 0, borderRadius: 4, background: "#f1f5f9" }}>
                                  {prod.categoryName}
                                </Tag>
                              </Flex>
                            </div>
                          </div>

                          {/* Stock Status Badge */}
                          <div className="shrink-0">
                            <Tag
                              color={
                                prod.totalStock <= 0
                                  ? "error"
                                  : prod.totalStock <= 5
                                  ? "warning"
                                  : "success"
                              }
                              style={{ fontWeight: 900, fontSize: "12px", padding: "3px 10px", borderRadius: 8, margin: 0 }}
                            >
                              {prod.totalStock <= 0
                                ? "Out of Stock"
                                : prod.totalStock <= 5
                                ? `Low Stock (${prod.totalStock})`
                                : `In Stock (${prod.totalStock})`}
                            </Tag>
                          </div>
                        </Flex>

                        {/* Variants List or Single Product Stock Editor */}
                        {prod.hasVariants ? (
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <Flex align="center" justify="space-between" className="select-none">
                              <div
                                className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-700 hover:text-blue-600 font-bold text-xs"
                                onClick={() => toggleExpandProduct(prod._id)}
                              >
                                {isExpanded ? <UpOutlined style={{ fontSize: 11, color: "#2563eb" }} /> : <DownOutlined style={{ fontSize: 11, color: "#64748b" }} />}
                                <span>🎨 ভ্যারিয়েন্ট স্টক সমূহের তালিকা ({prod.variants.length} টি)</span>
                                {hasCriticalVariant && (
                                  <Tag color="error" style={{ fontSize: "10px", margin: 0, fontWeight: 900, borderRadius: 4, padding: "0 4px" }}>
                                    🚨 1 Left Warning
                                  </Tag>
                                )}
                              </div>

                              <Button
                                type="text"
                                size="small"
                                onClick={() => toggleExpandProduct(prod._id)}
                                style={{ fontSize: "11px", fontWeight: 700, color: isExpanded ? "#ef4444" : "#2563eb", padding: "0 4px" }}
                              >
                                {isExpanded ? "লুকান ▲" : "দেখন ▼"}
                              </Button>
                            </Flex>

                            {isExpanded && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                {prod.variants.map((v, vIdx) => {
                                  const editKeyVar = `${prod._id}_${v._id}`;
                                  const isVarUpdating = updatingId === editKeyVar;
                                  const currentVarVal =
                                    editingStockMap[editKeyVar] !== undefined
                                      ? editingStockMap[editKeyVar]
                                      : v.stockQuantity;

                                  const isCriticalOne = currentVarVal === 1;
                                  const isOut = currentVarVal === 0;

                                  return (
                                    <div
                                      key={v._id || `v_${prod._id}_${vIdx}`}
                                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                                        isCriticalOne
                                          ? "border-red-400 bg-red-50/70 shadow-xs ring-1 ring-red-300"
                                          : isOut
                                          ? "border-slate-200 bg-slate-100/80 opacity-70"
                                          : "border-slate-200 bg-slate-50"
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <Flex align="center" gap={4}>
                                          <Text strong style={{ fontSize: "12px", display: "block" }} className="truncate">
                                            {v.variantTitle}
                                          </Text>
                                          {isCriticalOne && (
                                            <Tag color="error" style={{ fontSize: "9px", margin: 0, fontWeight: 900, borderRadius: 4, padding: "0 4px" }}>
                                              🚨 1 Left!
                                            </Tag>
                                          )}
                                          {isOut && (
                                            <Tag color="default" style={{ fontSize: "9px", margin: 0, fontWeight: 800, borderRadius: 4, padding: "0 4px" }}>
                                              Out
                                            </Tag>
                                          )}
                                        </Flex>
                                        {v.variantSku && (
                                          <Text type="secondary" style={{ fontSize: "10px", display: "block" }}>
                                            SKU: {v.variantSku}
                                          </Text>
                                        )}
                                      </div>

                                      {/* Inline Quantity Stepper */}
                                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shrink-0">
                                        <Button
                                          size="small"
                                          type="text"
                                          disabled={isVarUpdating}
                                          onClick={() => {
                                            const val = Math.max(0, currentVarVal - 1);
                                            setEditingStockMap((prev) => ({ ...prev, [editKeyVar]: val }));
                                          }}
                                          style={{ width: 24, height: 24, padding: 0, fontWeight: 900 }}
                                        >
                                          -
                                        </Button>
                                        <input
                                          type="number"
                                          value={currentVarVal}
                                          disabled={isVarUpdating}
                                          onChange={(e) => {
                                            const val = Math.max(0, Number(e.target.value) || 0);
                                            setEditingStockMap((prev) => ({ ...prev, [editKeyVar]: val }));
                                          }}
                                          style={{ width: 36, textAlign: "center", fontSize: 12, fontWeight: 800, border: "none", outline: "none" }}
                                        />
                                        <Button
                                          size="small"
                                          type="text"
                                          disabled={isVarUpdating}
                                          onClick={() => {
                                            const val = currentVarVal + 1;
                                            setEditingStockMap((prev) => ({ ...prev, [editKeyVar]: val }));
                                          }}
                                          style={{ width: 24, height: 24, padding: 0, fontWeight: 900 }}
                                        >
                                          +
                                        </Button>

                                        <Tooltip title="Save Stock">
                                          <Button
                                            size="small"
                                            type="primary"
                                            loading={isVarUpdating}
                                            icon={<SaveOutlined style={{ fontSize: 11 }} />}
                                            onClick={() => handleUpdateStock(prod._id, v._id, currentVarVal)}
                                            style={{ borderRadius: 0, height: 24, width: 24, padding: 0 }}
                                          />
                                        </Tooltip>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <Text type="secondary" style={{ fontSize: "12px", fontWeight: 700 }}>
                              ইনলাইন স্টক পরিমাণ আপডেট:
                            </Text>

                            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shrink-0">
                              <Button
                                size="small"
                                type="text"
                                disabled={isMainUpdating}
                                onClick={() => {
                                  const val = Math.max(0, currentMainVal - 1);
                                  setEditingStockMap((prev) => ({ ...prev, [editKeyMain]: val }));
                                }}
                                style={{ width: 28, height: 28, padding: 0, fontWeight: 900 }}
                              >
                                -
                              </Button>
                              <input
                                type="number"
                                value={currentMainVal}
                                disabled={isMainUpdating}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setEditingStockMap((prev) => ({ ...prev, [editKeyMain]: val }));
                                }}
                                style={{ width: 44, textAlign: "center", fontSize: 13, fontWeight: 800, border: "none", outline: "none" }}
                              />
                              <Button
                                size="small"
                                type="text"
                                disabled={isMainUpdating}
                                onClick={() => {
                                  const val = currentMainVal + 1;
                                  setEditingStockMap((prev) => ({ ...prev, [editKeyMain]: val }));
                                }}
                                style={{ width: 28, height: 28, padding: 0, fontWeight: 900 }}
                              >
                                +
                              </Button>

                              <Button
                                size="small"
                                type="primary"
                                loading={isMainUpdating}
                                icon={<SaveOutlined />}
                                onClick={() => handleUpdateStock(prod._id, null, currentMainVal)}
                                style={{ borderRadius: 0, height: 28, padding: "0 8px", fontWeight: 700 }}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
