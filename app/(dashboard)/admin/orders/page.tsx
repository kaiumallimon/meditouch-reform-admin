"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ordersApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  RefreshCw,
  Truck,
  CheckCircle2,
  Clock,
  PackageCheck,
  User
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.listAllOrders(1, 50, statusFilter !== "ALL" ? statusFilter : undefined);
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

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      await ordersApi.updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      await loadOrders();
    } catch (err: any) {
      toast.error("Status update failed", { description: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
            Pharmacy Orders & Fulfillment
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Dispatch, track delivery status, and manage e-pharmacy medication orders.
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-white px-3 py-2 text-xs font-bold text-stone-800 neo-button hover:bg-stone-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-100 p-1 w-fit shadow-[2px_2px_0px_0px_#1C1917]">
        {["ALL", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === status
                ? "bg-[#5b15fc] text-white shadow-[1px_1px_0px_0px_#1C1917]"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="neo-card rounded-[22px] p-6 bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-8 text-[#5b15fc]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 border border-stone-200 mb-2">
              <ShoppingBag className="size-6" />
            </div>
            <p className="text-sm font-bold text-stone-900">No Orders Found</p>
            <p className="text-xs text-stone-500 mt-1">There are currently no orders in this fulfillment state.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4 transition-all hover:bg-stone-50 hover:border-stone-400"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-base font-normal text-stone-900">
                      Order #{order.order_number}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        order.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : order.status === "SHIPPED"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : order.status === "PROCESSING"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : order.status === "CANCELLED"
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-stone-100 text-stone-800 border-stone-300"
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {order.created_at ? formatDate(order.created_at) : ""}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                    <span className="flex items-center gap-1">
                      <User className="size-3.5 text-stone-400" />
                      <strong className="text-stone-900">{order.user_name || "Patient"}</strong> ({order.user_phone})
                    </span>
                    <span>
                      <strong className="text-stone-900">Items:</strong>{" "}
                      {order.items?.map((item: any) => `${item.name} x${item.quantity}`).join(", ") || "Medications"}
                    </span>
                    <span>
                      <strong className="text-stone-900">Total:</strong>{" "}
                      <span className="font-bold text-[#5b15fc]">{formatCurrency(order.total_amount)}</span>
                    </span>
                  </div>
                </div>

                {/* Fulfillment Status Selector */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="h-8 rounded-xl border border-stone-800 bg-white px-3 text-xs font-bold text-stone-800 neo-input outline-hidden"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED (IN TRANSIT)</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
