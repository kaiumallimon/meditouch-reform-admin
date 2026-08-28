"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ordersApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Truck,
  CheckCircle2,
  Clock,
  PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Pharmacy Orders & Fulfillment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer orders, manage parcel packaging, and update delivery dispatch status.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading} className="gap-2 rounded-4xl">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 rounded-4xl border border-border bg-muted/40 p-1 w-fit">
        {["ALL", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`rounded-4xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === tab
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "ALL" ? "All Orders" : tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="rounded-4xl border border-border bg-card p-6 shadow-xs">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="size-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No Orders Found</p>
            <p className="text-xs text-muted-foreground mt-1">No orders match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {orders.map((order) => (
              <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground font-mono">#{order.order_number}</p>
                    <Badge
                      variant={
                        order.status === "DELIVERED"
                          ? "success"
                          : order.status === "SHIPPED"
                          ? "info"
                          : order.status === "PROCESSING"
                          ? "warning"
                          : "default"
                      }
                      className="text-[10px]"
                    >
                      {order.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">• {formatDate(order.created_at)}</span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Customer: <span className="font-semibold text-foreground">{order.user_name || "Patient"}</span> ({order.user_phone})
                  </p>

                  {order.items && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {order.items.map((item: any, i: number) => (
                        <span key={i} className="rounded-4xl bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(order.total_amount)}</p>
                    <p className="text-[10px] text-muted-foreground">bKash Verified</p>
                  </div>

                  {/* Quick status progression */}
                  {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="h-8 rounded-4xl border border-input bg-card px-2.5 text-xs font-medium text-foreground outline-hidden focus:ring-2 focus:ring-ring"
                    >
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

