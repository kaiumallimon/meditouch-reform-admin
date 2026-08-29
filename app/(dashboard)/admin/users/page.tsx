"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { CreateUserModal } from "@/components/users/create-user-modal";
import { EditUserModal } from "@/components/users/edit-user-modal";
import { UserDetailModal } from "@/components/users/user-detail-modal";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  UserPlus,
  Table as TableIcon,
  LayoutGrid,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Eye,
  User,
  KeyRound,
  Shield,
  Send
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function UsersAdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<{
    total_users: number;
    active_users: number;
    total_patients: number;
    total_doctors: number;
    total_nurses: number;
    total_admins: number;
  } | null>(null);

  // Pagination states (Server-side)
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter & Search states
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // View Mode: Table (default) or Grid
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action / Modal states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);

  // Load current session
  useEffect(() => {
    const session = getSession();
    if (session) {
      setCurrentUser(session);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await adminApi.getUsersStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch user stats", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch users with server-side pagination
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: rowsPerPage,
      };

      if (roleFilter !== "ALL") params.role = roleFilter;
      if (statusFilter === "ACTIVE") params.is_active = true;
      if (statusFilter === "INACTIVE") params.is_active = false;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await adminApi.listUsers(params);
      setUsers(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(Math.ceil((res.total || 0) / rowsPerPage) || 1);
    } catch (err: any) {
      toast.error("Failed to load user accounts", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, roleFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle active status
  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (currentUser && (currentUser.id === userId || currentUser.phone === userId)) {
      toast.error("You cannot deactivate your own logged-in administrator account.");
      return;
    }
    try {
      setProcessingId(userId);
      await adminApi.updateUser(userId, { is_active: !currentStatus });
      toast.success(`User account ${!currentStatus ? "activated" : "deactivated"} successfully!`);
      await Promise.all([fetchUsers(), fetchStats()]);
      if (detailUser && detailUser.id === userId) {
        setDetailUser((prev: any) => ({ ...prev, is_active: !currentStatus }));
      }
    } catch (err: any) {
      toast.error("Failed to update status", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // Trigger Password Recovery
  const handleSendRecovery = async (userId: string) => {
    try {
      setProcessingId(userId);
      const res = await adminApi.sendPasswordRecovery(userId);
      toast.success("Password recovery email dispatched!", {
        description: `A new secure passphrase has been sent to ${res.email}.`,
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
    } catch (err: any) {
      toast.error("Failed to send password recovery", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // Confirm soft delete
  const handleSoftDelete = async () => {
    if (!deletingUser) return;
    if (currentUser && (currentUser.id === deletingUser.id || currentUser.phone === deletingUser.phone)) {
      toast.error("You cannot delete your own logged-in administrator account.");
      setDeletingUser(null);
      return;
    }
    try {
      setProcessingId(deletingUser.id);
      await adminApi.softDeleteUser(deletingUser.id);
      toast.success(`Account for ${deletingUser.name} soft deleted.`);
      setDeletingUser(null);
      if (detailUser && detailUser.id === deletingUser.id) {
        setDetailUser(null);
      }
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (err: any) {
      toast.error("Failed to delete user", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Exclude current logged in user from select-all for safety
      setSelectedIds(users.filter((u) => u.id !== currentUser?.id).map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const roleBadgeStyle = (role: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "bg-[#5b15fc]/10 text-[#5b15fc] border-[#5b15fc]/20";
      case "NURSE":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "DOCTOR":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PATIENT":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-normal text-stone-900">
            User Accounts & Security
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage system access, provision admin accounts, update credentials, and handle password recovery.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              fetchUsers();
              fetchStats();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setCreateUserOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#5b15fc] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4d0ee0] shadow-xs cursor-pointer transition-all"
          >
            <UserPlus className="size-4" />
            <span>Add User / Admin</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="neo-card rounded-2xl bg-white p-4 sm:p-5 flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#5b15fc]/10 text-[#5b15fc]">
            <Users className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Total Users</p>
            <p className="font-heading text-xl sm:text-2xl font-normal text-stone-900 mt-0.5">
              {statsLoading ? "..." : stats?.total_users || 0}
            </p>
            <p className="text-[11px] text-stone-500 truncate">Platform-wide profiles</p>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="neo-card rounded-2xl bg-white p-4 sm:p-5 flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Active Accounts</p>
            <p className="font-heading text-xl sm:text-2xl font-normal text-stone-900 mt-0.5">
              {statsLoading ? "..." : stats?.active_users || 0}
            </p>
            <p className="text-[11px] text-stone-500 truncate">Live authorized access</p>
          </div>
        </div>

        {/* Patients Count */}
        <div className="neo-card rounded-2xl bg-white p-4 sm:p-5 flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <User className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Patient Accounts</p>
            <p className="font-heading text-xl sm:text-2xl font-normal text-stone-900 mt-0.5">
              {statsLoading ? "..." : stats?.total_patients || 0}
            </p>
            <p className="text-[11px] text-stone-500 truncate">Registered care seekers</p>
          </div>
        </div>

        {/* Staff & Admins */}
        <div className="neo-card rounded-2xl bg-white p-4 sm:p-5 flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
            <Shield className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Admins & Staff</p>
            <p className="font-heading text-xl sm:text-2xl font-normal text-stone-900 mt-0.5">
              {statsLoading ? "..." : (stats?.total_admins || 0) + (stats?.total_nurses || 0)}
            </p>
            <p className="text-[11px] text-stone-500 truncate">
              {stats?.total_admins || 0} Admins • {stats?.total_nurses || 0} Nurses
            </p>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR CONTROLS */}
      <div className="neo-card rounded-[22px] bg-white p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name, phone, email, or role..."
              className="w-full h-10 rounded-xl border border-stone-200 bg-white pl-10 pr-4 text-xs font-semibold text-stone-800 shadow-xs outline-hidden placeholder:text-stone-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800 shadow-xs outline-hidden cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="NURSE">NURSE</option>
                <option value="DOCTOR">DOCTOR</option>
                <option value="PATIENT">PATIENT</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800 shadow-xs outline-hidden cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-stone-200 bg-stone-100 p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                title="Table View"
              >
                <TableIcon className="size-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Banner */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-[#5b15fc]/10 border border-[#5b15fc]/20 p-2.5 text-xs text-[#5b15fc] animate-in fade-in">
            <span className="font-semibold">{selectedIds.length} user(s) selected</span>
            <button
              onClick={() => setSelectedIds([])}
              className="font-bold underline hover:opacity-80 cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN DATA VIEW (TABLE OR GRID) */}
      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center neo-card rounded-[22px] bg-white p-8">
          <div className="text-center space-y-3">
            <Spinner className="size-8 text-[#5b15fc] mx-auto" />
            <p className="text-xs font-semibold text-stone-500">Loading user directory...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center neo-card rounded-[22px] bg-white p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-3">
            <Users className="size-7" />
          </div>
          <h3 className="font-heading text-lg font-normal text-stone-900">No User Accounts Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            {debouncedSearch || roleFilter !== "ALL" || statusFilter !== "ALL"
              ? "No accounts matched the selected search filters. Try clearing your search parameters."
              : "No user accounts are registered in the directory yet. Click above to add your first administrator or staff member."}
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="neo-card rounded-[22px] bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === users.filter((u) => u.id !== currentUser?.id).length && users.length > 1}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="size-4 rounded accent-[#5b15fc] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone (Login)</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  const isCurrentUser = currentUser
                    ? currentUser.id === user.id || currentUser.phone === user.phone || currentUser.email === user.email
                    : false;

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors ${
                        isCurrentUser
                          ? "bg-[#5b15fc]/5 border-l-4 border-l-[#5b15fc] hover:bg-[#5b15fc]/10"
                          : isSelected
                          ? "bg-stone-50"
                          : "hover:bg-stone-50/80"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          disabled={isCurrentUser}
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(user.id, e.target.checked)}
                          className="size-4 rounded accent-[#5b15fc] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isCurrentUser ? "Current logged in account cannot be selected for batch operations" : undefined}
                        />
                      </td>

                      {/* User Info & Avatar */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setDetailUser(user)}
                          className="flex items-center gap-3 min-w-0 cursor-pointer group"
                        >
                          <div className="size-9 shrink-0 rounded-full border border-stone-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} className="size-full object-cover" />
                            ) : (
                              <User className="size-5 text-stone-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-stone-900 truncate group-hover:text-[#5b15fc] transition-colors">
                                {user.name}
                              </p>
                              {isCurrentUser && (
                                <span className="rounded-full bg-[#5b15fc] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-xs">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-stone-400 truncate">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${roleBadgeStyle(user.role)}`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-mono font-semibold text-stone-800">
                        {user.phone}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-stone-600 truncate max-w-[180px]">
                        {user.email || <span className="text-stone-400 italic">None</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 px-2 py-0.5 text-[10px] font-bold">
                            <span className="size-1.5 rounded-full bg-stone-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-stone-500 text-[11px]">
                        {user.created_at ? formatDate(user.created_at) : "N/A"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* View Detail */}
                          <button
                            onClick={() => setDetailUser(user)}
                            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-[#5b15fc] transition-colors cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="size-4" />
                          </button>

                          {/* Send Password Recovery */}
                          {user.email && (
                            <button
                              disabled={processingId === user.id}
                              onClick={() => handleSendRecovery(user.id)}
                              className="rounded-lg p-1.5 text-stone-500 hover:bg-purple-50 hover:text-[#5b15fc] transition-colors cursor-pointer"
                              title="Send Password Recovery to Email"
                            >
                              <KeyRound className="size-4" />
                            </button>
                          )}

                          {/* Edit User */}
                          <button
                            onClick={() => setEditingUser(user)}
                            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="size-4" />
                          </button>

                          {/* Toggle Active */}
                          <button
                            disabled={processingId === user.id || isCurrentUser}
                            onClick={() => {
                              if (isCurrentUser) return;
                              handleToggleActive(user.id, user.is_active);
                            }}
                            className={`rounded-lg p-1.5 transition-colors ${
                              isCurrentUser
                                ? "text-stone-300 cursor-not-allowed opacity-40"
                                : user.is_active
                                ? "text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                : "text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                            }`}
                            title={isCurrentUser ? "You cannot deactivate your own logged-in account" : user.is_active ? "Deactivate Account" : "Activate Account"}
                          >
                            {user.is_active ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                          </button>

                          {/* Soft Delete */}
                          <button
                            disabled={isCurrentUser}
                            onClick={() => {
                              if (isCurrentUser) return;
                              setDeletingUser(user);
                            }}
                            className={`rounded-lg p-1.5 transition-colors ${
                              isCurrentUser
                                ? "text-stone-300 cursor-not-allowed opacity-40"
                                : "text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            }`}
                            title={isCurrentUser ? "You cannot delete your own logged-in account" : "Soft Delete User"}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((user) => {
            const isSelected = selectedIds.includes(user.id);
            const isCurrentUser = currentUser
              ? currentUser.id === user.id || currentUser.phone === user.phone || currentUser.email === user.email
              : false;

            return (
              <div
                key={user.id}
                className={`neo-card rounded-2xl bg-white p-5 space-y-4 transition-all hover:shadow-md ${
                  isCurrentUser
                    ? "border-[#5b15fc] ring-2 ring-[#5b15fc]/30 bg-gradient-to-b from-[#5b15fc]/5 to-white"
                    : isSelected
                    ? "border-stone-400 ring-1 ring-stone-300"
                    : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    onClick={() => setDetailUser(user)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group"
                  >
                    <div className="size-12 shrink-0 rounded-full border border-stone-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="size-full object-cover" />
                      ) : (
                        <User className="size-6 text-stone-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-heading text-base font-normal text-stone-900 truncate group-hover:text-[#5b15fc]">
                          {user.name}
                        </p>
                        {isCurrentUser && (
                          <span className="rounded-full bg-[#5b15fc] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-xs">
                            You
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border mt-1 ${roleBadgeStyle(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    disabled={isCurrentUser}
                    checked={isSelected}
                    onChange={(e) => handleSelectRow(user.id, e.target.checked)}
                    className="size-4 rounded accent-[#5b15fc] cursor-pointer mt-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isCurrentUser ? "Current logged in account cannot be selected for batch operations" : undefined}
                  />
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Phone:</span>
                    <span className="font-mono font-semibold text-stone-900">{user.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Email:</span>
                    <span className="font-semibold text-stone-800 truncate max-w-[170px]">
                      {user.email || "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Status:</span>
                    {user.is_active ? (
                      <span className="text-emerald-700 font-bold">Active</span>
                    ) : (
                      <span className="text-stone-500 font-bold">Inactive</span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
                  <button
                    onClick={() => setDetailUser(user)}
                    className="inline-flex items-center gap-1 text-[#5b15fc] font-semibold hover:underline cursor-pointer"
                  >
                    <Eye className="size-3.5" />
                    <span>View Profile</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {user.email && (
                      <button
                        onClick={() => handleSendRecovery(user.id)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-purple-50 hover:text-[#5b15fc] transition-colors cursor-pointer"
                        title="Send Password Recovery"
                      >
                        <KeyRound className="size-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingUser(user)}
                      className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-colors cursor-pointer"
                      title="Edit User"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      disabled={isCurrentUser}
                      onClick={() => {
                        if (isCurrentUser) return;
                        setDeletingUser(user);
                      }}
                      className={`rounded-lg p-1.5 transition-colors ${
                        isCurrentUser
                          ? "text-stone-300 cursor-not-allowed opacity-40"
                          : "text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      }`}
                      title={isCurrentUser ? "You cannot delete your own logged-in account" : "Soft Delete User"}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. SERVER-SIDE PAGINATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 neo-card rounded-[22px] bg-white p-4 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-stone-500">
            Showing <strong className="text-stone-900">{users.length > 0 ? (page - 1) * rowsPerPage + 1 : 0}</strong> -{" "}
            <strong className="text-stone-900">{Math.min(page * rowsPerPage, totalCount)}</strong> of{" "}
            <strong className="text-stone-900">{totalCount}</strong> users
          </span>

          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-stone-200">
            <span className="text-stone-400">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs font-semibold text-stone-800 shadow-xs outline-hidden cursor-pointer"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-stone-500 mr-2">
            Page <strong className="text-stone-900">{page}</strong> of <strong className="text-stone-900">{totalPages}</strong>
          </span>

          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-3.5" />
            <span>Previous</span>
          </button>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 6. MODALS */}
      {/* Create User Modal */}
      <CreateUserModal
        isOpen={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
        currentUserId={currentUser?.id}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        user={detailUser}
        isOpen={!!detailUser}
        onClose={() => setDetailUser(null)}
        onEdit={(u) => setEditingUser(u)}
        onDelete={(u) => setDeletingUser(u)}
        onToggleActive={handleToggleActive}
        onSendRecovery={handleSendRecovery}
        processingId={processingId}
        currentUserId={currentUser?.id}
      />

      {/* Soft Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md neo-card rounded-[24px] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-normal text-stone-900">Soft Delete User</h3>
                <p className="text-xs text-stone-500">Safety & Audit Preservation</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to soft delete the account for <strong>{deletingUser.name}</strong> ({deletingUser.role})?
              This will disable login credentials and hide the profile while preserving all past consultation and transaction audit history for system safety.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId === deletingUser.id}
                onClick={handleSoftDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs cursor-pointer transition-all"
              >
                {processingId === deletingUser.id ? <Spinner className="size-3.5 text-white" /> : <Trash2 className="size-3.5" />}
                <span>Confirm Soft Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
