"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Activity, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function AuditLogsAdminPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAuditLogs(1, 100);
      setLogs(data.items || []);
    } catch (err: any) {
      toast.error("Failed to load audit logs", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.target_type?.toLowerCase().includes(search.toLowerCase()) ||
    log.user_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            System Audit Logs & Security Trails
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable audit records of doctor approvals, consultations, transactions, and admin operations.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading} className="gap-2 rounded-4xl">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit logs by action (e.g. PAYMENT_COMPLETED, DOCTOR_VERIFIED) or User ID..."
          className="h-10 w-full rounded-4xl border border-input bg-card pl-9 pr-3 text-xs outline-hidden focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-4xl border border-border bg-card p-6 shadow-xs overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="size-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No Audit Logs Found</p>
            <p className="text-xs text-muted-foreground mt-1">Audit logs will automatically appear as operations are executed.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3">Action</th>
                <th className="pb-3">Target Entity</th>
                <th className="pb-3">Actor / User</th>
                <th className="pb-3">IP Address</th>
                <th className="pb-3">Details</th>
                <th className="pb-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLogs.map((log, index) => (
                <tr key={index} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-semibold text-foreground">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    <span className="font-medium text-foreground">{log.target_type}</span>
                    {log.target_id && <span className="text-[10px] text-muted-foreground block font-mono">{log.target_id}</span>}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-muted-foreground">
                    {log.user_id || "System"}
                  </td>
                  <td className="py-3 text-muted-foreground">{log.ip_address || "Internal"}</td>
                  <td className="py-3 text-[11px] text-muted-foreground max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : "-"}
                  </td>
                  <td className="py-3 text-right text-muted-foreground">{formatDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

