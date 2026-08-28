"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Activity, RefreshCw, Search, ShieldCheck } from "lucide-react";
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
          <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
            System Audit Logs & Security Trails
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Immutable audit records of doctor approvals, consultations, transactions, and admin operations.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
        <input
          placeholder="Filter by action (e.g. DOCTOR_VERIFIED), target, user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-xl pl-9 pr-4 text-xs font-medium text-stone-900 neo-input outline-hidden placeholder:text-stone-400"
        />
      </div>

      {/* Table Container */}
      <div className="neo-card rounded-[22px] p-6 bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-8 text-[#5b15fc]" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 border border-stone-200 mb-2">
              <Activity className="size-6" />
            </div>
            <p className="text-sm font-bold text-stone-900">No Audit Logs Found</p>
            <p className="text-xs text-stone-500 mt-1">No system events matched the search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="pb-3 pr-4">Action & Operation</th>
                  <th className="pb-3 px-4">Target Entity</th>
                  <th className="pb-3 px-4">User ID / Trigger</th>
                  <th className="pb-3 px-4">Client IP</th>
                  <th className="pb-3 pl-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/20 px-2 py-0.5 text-[10px] font-mono font-bold">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-800 font-medium">
                      {log.target_type}{" "}
                      {log.target_id && (
                        <span className="font-mono text-stone-400 text-[10px]">({log.target_id})</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                      {log.user_id || "System"}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                      {log.ip_address || "Internal"}
                    </td>
                    <td className="py-3.5 pl-4 text-right font-mono text-stone-400 text-[10px]">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
