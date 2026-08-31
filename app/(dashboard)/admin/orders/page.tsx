"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { ordersApi, OrderData } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  RefreshCw,
  Truck,
  CheckCircle2,
  Clock,
  PackageCheck,
  User,
  MapPin,
  Phone,
  AlertCircle,
  XCircle,
  Eye,
  Radio,
  Sparkles,
  Check,
  ChevronRight,
  FileText
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.listAllOrders({
        page: 1,
        limit: 100,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setOrders(data.items || []);
    } catch (err: any) {
      toast.error("Failed to load pharmacy orders", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  // Real-time SSE Stream Connection
  useEffect(() => {
    const streamUrl = ordersApi.getOrdersStreamUrl();
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsLiveConnected(true);
      setStreamError(null);
    };

    es.addEventListener("connected", () => {
      setIsLiveConnected(true);
    });

    es.addEventListener("order_created", (event: MessageEvent) => {
      try {
        const newOrder: OrderData = JSON.parse(event.data);
        toast.success(`⚡ New Order Received: #${newOrder.order_number}`, {
          description: `${newOrder.user_name || "Customer"} - ${formatCurrency(newOrder.total_amount)}`,
          duration: 6000,
        });
        setOrders((prev) => {
          // If status filter allows it or is ALL, prepend to list
          if (statusFilter === "ALL" || statusFilter === newOrder.status) {
            return [newOrder, ...prev.filter((o) => o.id !== newOrder.id)];
          }
          return prev;
        });
      } catch (err) {
        console.error("Error parsing order_created event:", err);
      }
    });

    es.addEventListener("order_updated", (event: MessageEvent) => {
      try {
        const updatedOrder: OrderData = JSON.parse(event.data);
        toast.info(`Order #${updatedOrder.order_number} status updated to ${updatedOrder.status}`);
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
        setSelectedOrder((prev) => (prev?.id === updatedOrder.id ? updatedOrder : prev));
      } catch (err) {
        console.error("Error parsing order_updated event:", err);
      }
    });

    es.addEventListener("order_cancelled", (event: MessageEvent) => {
      try {
        const cancelledOrder: OrderData = JSON.parse(event.data);
        toast.warning(`Order #${cancelledOrder.order_number} has been CANCELLED`);
        setOrders((prev) =>
          prev.map((o) => (o.id === cancelledOrder.id ? cancelledOrder : o))
        );
        setSelectedOrder((prev) => (prev?.id === cancelledOrder.id ? cancelledOrder : prev));
      } catch (err) {
        console.error("Error parsing order_cancelled event:", err);
      }
    });

    es.onerror = () => {
      setIsLiveConnected(false);
      setStreamError("Reconnecting to order stream...");
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const updated = await ordersApi.updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      toast.error("Status update failed", { description: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order and restore product stock?")) return;
    try {
      setUpdatingId(orderId);
      const updated = await ordersApi.cancelOrder(orderId, "Cancelled by Admin");
      toast.success("Order cancelled and inventory stock restored successfully");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      toast.error("Failed to cancel order", { description: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
              Orders & Real-Time Fulfillment
            </h1>
            {isLiveConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-semibold text-emerald-700 shadow-xs animate-pulse">
                <span className="size-2 rounded-full bg-emerald-500"></span>
                Live Real-Time
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-xs font-semibold text-amber-700 shadow-xs">
                <span className="size-2 rounded-full bg-amber-500"></span>
                Connecting Stream...
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Live orders stream with zero-polling updates, atomic stock reservations, and dispatch controls.
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-stone-200 bg-stone-100/70 p-1.5 w-fit">
        {["ALL", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === status
                ? "bg-[#5b15fc] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="neo-card rounded-[22px] p-6 bg-white shadow-sm border border-stone-200">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-8 text-[#5b15fc]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 border border-stone-200 mb-3">
              <ShoppingBag className="size-7" />
            </div>
            <p className="text-sm font-bold text-stone-900">No Orders Found</p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              There are currently no orders in this fulfillment state. New orders placed from the mobile app will automatically appear in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-stone-50/40 p-4 transition-all hover:bg-stone-50 hover:border-stone-300"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-heading text-base font-bold text-stone-900">
                      Order #{order.order_number}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        order.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : order.status === "SHIPPED"
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : order.status === "PROCESSING"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : order.status === "CANCELLED"
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-blue-100 text-blue-800 border-blue-300"
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {order.created_at ? formatDate(order.created_at) : ""}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-stone-600">
                    <span className="flex items-center gap-1.5">
                      <User className="size-3.5 text-stone-400" />
                      <strong className="text-stone-900">{order.user_name || order.delivery_address?.recipient_name || "User"}</strong>
                      <span className="text-stone-500">({order.delivery_address?.recipient_phone || order.user_phone})</span>
                    </span>
                    <span className="flex items-center gap-1 text-stone-600">
                      <MapPin className="size-3.5 text-stone-400" />
                      <span>{order.delivery_address?.street_address}, {order.delivery_address?.district || order.delivery_address?.division || "Dhaka"}</span>
                    </span>
                    <span>
                      <strong className="text-stone-900">Total:</strong>{" "}
                      <span className="font-bold text-[#5b15fc]">{formatCurrency(order.total_amount)}</span>
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 truncate">
                    <span className="font-semibold text-stone-700">Items: </span>
                    {order.items?.map((item) => `${item.name} (${item.quantity}x)`).join(", ")}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer"
                  >
                    <Eye className="size-3.5 text-stone-500" />
                    <span>View Details</span>
                  </button>

                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="h-8.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-800 shadow-xs outline-hidden cursor-pointer hover:border-stone-300"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-heading text-xl font-bold text-stone-900">
                    Order #{selectedOrder.order_number}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      selectedOrder.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : selectedOrder.status === "SHIPPED"
                        ? "bg-purple-100 text-purple-800 border-purple-300"
                        : selectedOrder.status === "PROCESSING"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : selectedOrder.status === "CANCELLED"
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-blue-100 text-blue-800 border-blue-300"
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Placed on {selectedOrder.created_at ? formatDate(selectedOrder.created_at) : "N/A"}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-all cursor-pointer"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 py-4">
              {/* Delivery Address Card */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider">
                  <MapPin className="size-4 text-[#5b15fc]" />
                  <span>Delivery Address</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 pt-1">
                  <div>
                    <p className="font-semibold text-stone-900">
                      {selectedOrder.delivery_address?.recipient_name || selectedOrder.user_name}
                    </p>
                    <p className="text-stone-500">
                      {selectedOrder.delivery_address?.recipient_phone || selectedOrder.user_phone}
                    </p>
                  </div>
                  <div>
                    <p>{selectedOrder.delivery_address?.street_address}</p>
                    <p className="text-stone-500">
                      {selectedOrder.delivery_address?.upazila_or_thana || ""}{" "}
                      {selectedOrder.delivery_address?.district || selectedOrder.delivery_address?.division || ""}
                    </p>
                  </div>
                </div>
                {selectedOrder.customer_notes && (
                  <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200/70 p-2.5 text-xs text-amber-900">
                    <strong>Customer Note:</strong> {selectedOrder.customer_notes}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Ordered Medications ({selectedOrder.items?.length || 0})
                </h4>
                <div className="rounded-2xl border border-stone-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/70 text-stone-600 font-bold border-b border-stone-200">
                      <tr>
                        <th className="p-3">Medicine</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {selectedOrder.items?.map((it, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/50">
                          <td className="p-3">
                            <p className="font-bold text-stone-900">{it.name}</p>
                            <p className="text-[11px] text-stone-400">{it.strength || it.brand}</p>
                          </td>
                          <td className="p-3 text-center font-bold">{it.quantity}</td>
                          <td className="p-3 text-right">{formatCurrency(it.unit_price)}</td>
                          <td className="p-3 text-right font-bold text-stone-900">
                            {formatCurrency(it.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">{formatCurrency(selectedOrder.delivery_fee)}</span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-bold text-stone-900">
                  <span>Total Amount</span>
                  <span className="text-[#5b15fc] font-bold">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Tracking History Timeline */}
              {selectedOrder.tracking_history?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Fulfillment Timeline
                  </h4>
                  <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50/30 p-4">
                    {selectedOrder.tracking_history.map((tr, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <div className="mt-1 size-2 rounded-full bg-[#5b15fc] shrink-0"></div>
                        <div className="flex-1">
                          <p className="font-bold text-stone-900">{tr.status}</p>
                          <p className="text-stone-500 text-[11px]">{tr.note}</p>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {formatDate(tr.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
              {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "DELIVERED" ? (
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  disabled={updatingId === selectedOrder.id}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                >
                  Cancel & Restore Stock
                </button>
              ) : <div></div>}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

