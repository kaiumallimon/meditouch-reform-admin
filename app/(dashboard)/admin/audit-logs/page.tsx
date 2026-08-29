"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { formatDate, formatRelativeTime, formatTime } from "@/lib/utils";
import {
  Activity,
  RefreshCw,
  Search,
  ShieldCheck,
  Lock,
  Pill,
  Stethoscope,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Code2,
  X,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  UserCheck,
  AlertTriangle,
  FileText,
  Clock,
  Globe,
  Tag,
  Eye,
  Info
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface AuditLogItem {
  id: string;
  user_id?: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
  message?: string;
}

interface AuditStats {
  total_logs: number;
  auth_events: number;
  pharmacy_events: number;
  clinical_events: number;
  admin_events: number;
}

function getPaginationRange(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

function getActionColor(action: string) {
  const act = (action || "").toUpperCase();
  if (act.includes("DELETE") || act.includes("REJECT") || act.includes("CANCEL")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (act.includes("CREATE") || act.includes("REGISTER") || act.includes("VERIF") || act.includes("COMPLETED")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (act.includes("LOGIN") || act.includes("TOKEN") || act.includes("PASSWORD")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (act.includes("MEDICINE") || act.includes("CRAWLER") || act.includes("ORDER")) {
    return "bg-purple-50 text-[#5b15fc] border-[#5b15fc]/30";
  }
  return "bg-stone-100 text-stone-700 border-stone-200";
}

export default function AuditLogsAdminPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedTarget, setSelectedTarget] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("created_desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await adminApi.getAuditStats().catch(() => null);
      if (data) setStats(data);
    } catch {
      // Graceful fallback for initial connect
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sort_by: sortBy,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedTarget !== "ALL") params.target_type = selectedTarget;

      // Filter by category
      if (selectedCategory === "AUTH") {
        params.action = "USER_LOGIN";
      }

      const data = await adminApi.getAuditLogs(params);
      setLogs(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      toast.error("Failed to load audit logs", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedCategory, selectedTarget, sortBy]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
              System Audit Logs & Security Trails
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              <ShieldCheck className="size-3" />
              Immutable Trail
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Complete security, administrative, clinical, and database transaction records with actor attribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadLogs();
              loadStats();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 text-stone-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Events */}
        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Total Events</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc]">
              <Activity className="size-3.5" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-20 rounded-lg mt-1" />
          ) : (
            <p className="font-heading text-2xl font-bold text-stone-900">
              {stats?.total_logs?.toLocaleString() || totalCount.toLocaleString()}
            </p>
          )}
          <p className="text-[10px] text-stone-400 font-medium">Recorded across system</p>
        </div>

        {/* Security & Auth */}
        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Auth & Access</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Lock className="size-3.5" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-16 rounded-lg mt-1" />
          ) : (
            <p className="font-heading text-2xl font-bold text-stone-900">
              {stats?.auth_events?.toLocaleString() || 0}
            </p>
          )}
          <p className="text-[10px] text-stone-400 font-medium">Logins & tokens</p>
        </div>

        {/* Pharmacy & Catalog */}
        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Pharmacy & Drug</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#5b15fc]">
              <Pill className="size-3.5" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-16 rounded-lg mt-1" />
          ) : (
            <p className="font-heading text-2xl font-bold text-stone-900">
              {stats?.pharmacy_events?.toLocaleString() || 0}
            </p>
          )}
          <p className="text-[10px] text-stone-400 font-medium">Catalog changes</p>
        </div>

        {/* Clinical Operations */}
        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Clinical & Doctor</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Stethoscope className="size-3.5" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-16 rounded-lg mt-1" />
          ) : (
            <p className="font-heading text-2xl font-bold text-stone-900">
              {stats?.clinical_events?.toLocaleString() || 0}
            </p>
          )}
          <p className="text-[10px] text-stone-400 font-medium">Verifications & sessions</p>
        </div>

        {/* Administrative */}
        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200/90 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Admin Actions</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <SlidersHorizontal className="size-3.5" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-16 rounded-lg mt-1" />
          ) : (
            <p className="font-heading text-2xl font-bold text-stone-900">
              {stats?.admin_events?.toLocaleString() || 0}
            </p>
          )}
          <p className="text-[10px] text-stone-400 font-medium">Settings & user states</p>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by action, message, target ID, user ID, IP address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl pl-9 pr-8 text-xs font-medium neo-input outline-hidden placeholder:text-stone-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Target Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedTarget}
              onChange={(e) => {
                setSelectedTarget(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-stone-200 bg-stone-50/80 px-3 text-xs font-semibold text-stone-800 cursor-pointer shadow-2xs outline-hidden"
            >
              <option value="ALL">All Target Entities</option>
              <option value="user">User</option>
              <option value="doctor">Doctor</option>
              <option value="medicine">Medicine</option>
              <option value="crawler">Crawler</option>
              <option value="appointment">Appointment</option>
              <option value="order">Order</option>
              <option value="payment">Payment</option>
              <option value="settings">Settings</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-stone-200 bg-stone-50/80 px-3 text-xs font-semibold text-stone-800 cursor-pointer shadow-2xs outline-hidden"
            >
              <option value="created_desc">Newest First (Default)</option>
              <option value="created_asc">Oldest First</option>
              <option value="action_asc">Action (A → Z)</option>
              <option value="action_desc">Action (Z → A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="neo-card rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-44">Action Event</th>
                  <th className="py-3 px-4">What Happened</th>
                  <th className="py-3 px-4 w-36">Target Entity</th>
                  <th className="py-3 px-4 w-32">Actor / User</th>
                  <th className="py-3 px-4 w-32">Client IP</th>
                  <th className="py-3 px-4 w-36 text-right">Timestamp</th>
                  <th className="py-3 px-3 w-16 text-center">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`audit-skeleton-${i}`} className="hover:bg-stone-50/40">
                    <td className="py-3.5 px-3 text-center">
                      <Skeleton className="h-4 w-5 mx-auto rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-5 w-28 rounded-lg" />
                    </td>
                    <td className="py-3.5 px-4 space-y-1.5">
                      <Skeleton className="h-3.5 w-5/6 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="h-4 w-12 rounded" />
                        <Skeleton className="h-3.5 w-14 rounded" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-4 w-16 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-3.5 w-20 rounded" />
                    </td>
                    <td className="py-3.5 px-4 text-right space-y-1">
                      <Skeleton className="h-3.5 w-14 ml-auto rounded" />
                      <Skeleton className="h-3 w-12 ml-auto rounded" />
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Skeleton className="size-7 mx-auto rounded-lg" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center p-6 space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 border border-stone-200">
              <Activity className="size-7 text-stone-400" />
            </div>
            <div>
              <p className="text-base font-bold text-stone-900">No Audit Events Found</p>
              <p className="text-xs text-stone-500 max-w-sm mt-0.5">
                No system events matched the active filter parameters.
              </p>
            </div>
            {(search || selectedTarget !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedTarget("ALL");
                  setPage(1);
                }}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-44">Action Event</th>
                  <th className="py-3 px-4">What Happened</th>
                  <th className="py-3 px-4 w-36">Target Entity</th>
                  <th className="py-3 px-4 w-32">Actor / User</th>
                  <th className="py-3 px-4 w-32">Client IP</th>
                  <th className="py-3 px-4 w-36 text-right">Timestamp</th>
                  <th className="py-3 px-3 w-16 text-center">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log, idx) => {
                  const rowKey = log.id || `audit-log-${log.action}-${log.created_at}-${idx}`;
                  const actionBadgeColor = getActionColor(log.action);
                  return (
                    <tr
                      key={rowKey}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Index / Serial # */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-stone-400 font-medium">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      {/* Action Event Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block max-w-[150px] truncate rounded-lg border px-2 py-0.5 text-[10px] font-mono font-bold tracking-tight ${actionBadgeColor}`}
                          title={log.action}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* What Happened Message */}
                      <td className="py-3 px-4">
                        <p className="text-xs font-semibold text-stone-900 group-hover:text-[#5b15fc] transition-colors line-clamp-1">
                          {log.message || log.action.replace(/_/g, " ").toLowerCase()}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5 font-mono">
                            {JSON.stringify(log.details).slice(0, 75)}...
                          </p>
                        )}
                      </td>

                      {/* Target Entity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-bold text-stone-700 uppercase">
                            {log.target_type}
                          </span>
                          {log.target_id && (
                            <span
                              className="font-mono text-stone-500 text-[10px] truncate max-w-[80px]"
                              title={log.target_id}
                            >
                              {log.target_id}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actor / User ID */}
                      <td className="py-3 px-4">
                        {log.user_id ? (
                          <div className="flex items-center gap-1">
                            <span
                              className="font-mono text-[10px] font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded truncate max-w-[90px]"
                              title={log.user_id}
                            >
                              {log.user_id}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-stone-400 italic">
                            System
                          </span>
                        )}
                      </td>

                      {/* Client IP */}
                      <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                        {log.ip_address || <span className="text-stone-300">Internal</span>}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <p className="text-xs font-semibold text-stone-800">
                          {formatRelativeTime(log.created_at)}
                        </p>
                        <p className="text-[10px] font-mono text-stone-400">
                          {formatTime(log.created_at)}
                        </p>
                      </td>

                      {/* Action Payload Inspect */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-[#5b15fc] hover:border-[#5b15fc]/30 hover:bg-[#5b15fc]/5 transition-all shadow-2xs cursor-pointer"
                          title="View raw JSON payload"
                        >
                          <Eye className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 neo-card rounded-2xl bg-white p-4 border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-stone-500 font-medium">
            Showing <strong className="text-stone-900">{totalCount > 0 ? (page - 1) * limit + 1 : 0}</strong> - <strong className="text-stone-900">{Math.min(page * limit, totalCount)}</strong> of <strong className="text-stone-900">{totalCount}</strong> audit events
          </p>

          <div className="flex items-center gap-1.5 text-xs text-stone-600 border-l border-stone-200 pl-3">
            <span className="text-[11px] font-medium text-stone-400">Rows:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-lg border border-stone-200 bg-stone-50 px-2 text-xs font-bold text-stone-800 cursor-pointer shadow-2xs outline-hidden"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronLeft className="size-4" />
            </button>

            {getPaginationRange(page, totalPages).map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-stone-400">
                    ...
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === page;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`size-8 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    isActive
                      ? "bg-[#5b15fc] text-white shadow-xs"
                      : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Audit Event Payload Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#5b15fc]/10 text-[#5b15fc]">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-stone-900">
                    Audit Event Details
                  </h3>
                  <p className="text-[11px] text-stone-400 font-mono">
                    ID: {selectedLog.id || "N/A"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="size-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Summary Banner */}
            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-mono font-bold ${getActionColor(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  {formatDate(selectedLog.created_at)}
                </span>
              </div>
              <p className="text-sm font-bold text-stone-900">
                {selectedLog.message || selectedLog.action.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-stone-50/80 p-3 border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Target Type</span>
                <span className="font-bold text-stone-800 block mt-1 uppercase">{selectedLog.target_type}</span>
              </div>
              <div className="rounded-xl bg-stone-50/80 p-3 border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Target ID</span>
                <span className="font-mono text-stone-800 block mt-1 truncate" title={selectedLog.target_id || "None"}>
                  {selectedLog.target_id || "None"}
                </span>
              </div>
              <div className="rounded-xl bg-stone-50/80 p-3 border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Actor User</span>
                <span className="font-mono text-stone-800 block mt-1 truncate" title={selectedLog.user_id || "System"}>
                  {selectedLog.user_id || "System Automatic"}
                </span>
              </div>
              <div className="rounded-xl bg-stone-50/80 p-3 border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">IP Address</span>
                <span className="font-mono text-stone-800 block mt-1">
                  {selectedLog.ip_address || "Internal"}
                </span>
              </div>
            </div>

            {/* JSON Payload Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Code2 className="size-3.5 text-[#5b15fc]" />
                  Event Metadata & State Changes
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(selectedLog.details, null, 2), "modal-json")}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5b15fc] hover:underline cursor-pointer"
                >
                  {copiedId === "modal-json" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  <span>{copiedId === "modal-json" ? "Copied" : "Copy JSON"}</span>
                </button>
              </div>

              <div className="rounded-xl bg-stone-900 p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 shadow-inner">
                <pre>{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-stone-900 text-white px-4 py-2 text-xs font-semibold hover:bg-stone-800 cursor-pointer shadow-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
