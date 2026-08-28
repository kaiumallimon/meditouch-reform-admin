"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { adminApi } from "@/lib/api";
import { CreateDoctorModal } from "@/components/doctors/create-doctor-modal";
import { EditDoctorModal } from "@/components/doctors/edit-doctor-modal";
import { DoctorDetailModal } from "@/components/doctors/doctor-detail-modal";
import {
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  UserPlus,
  Table as TableIcon,
  LayoutGrid,
  Edit2,
  Trash2,
  Users,
  Clock,
  Coins,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Eye,
  User
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function DoctorsAdminPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Pagination states (Server-side)
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // View Mode: Table (default) or Grid
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action / Modal states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [createDoctorOpen, setCreateDoctorOpen] = useState(false);
  const [viewingDoctor, setViewingDoctor] = useState<any | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<any | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Independent Stat Cards
  const [stats, setStats] = useState({
    total: 0,
    verifiedActive: 0,
    pending: 0,
    avgFee: 0,
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Load independent stat cards
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await adminApi.getDashboardStats();
      const sample = await adminApi.listDoctors({ limit: 100 });
      const docList = sample.items || [];
      const fees = docList.map((d) => d.consultation_fee || 0).filter((f) => f > 0);
      const avg = fees.length > 0 ? Math.round(fees.reduce((a, b) => a + b, 0) / fees.length) : 500;

      setStats({
        total: data.total_doctors || 0,
        verifiedActive: data.active_doctors || 0,
        pending: data.pending_doctor_verifications || 0,
        avgFee: avg,
      });
    } catch (err: any) {
      console.error("Failed to load doctor stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch paginated doctor list
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: rowsPerPage,
      };
      if (statusFilter !== "ALL") {
        params.verification_status = statusFilter;
      }
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const res = await adminApi.listDoctors(params);
      setDoctors(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.total_pages || Math.ceil((res.total || 0) / rowsPerPage) || 1);
    } catch (err: any) {
      toast.error("Failed to load doctors", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [page, rowsPerPage, statusFilter, debouncedSearch]);

  // Status Actions
  const handleVerify = async (doctorId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      setProcessingId(doctorId);
      await adminApi.verifyDoctor(doctorId, status);
      toast.success(`Doctor ${status === "VERIFIED" ? "verified & activated" : "rejected"}`, {
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
      // If viewing modal is open for this doctor, update its state
      if (viewingDoctor && viewingDoctor.id === doctorId) {
        setViewingDoctor((prev: any) =>
          prev ? { ...prev, verification_status: status, is_active: status === "VERIFIED" } : null
        );
      }
      await Promise.all([fetchDoctors(), fetchStats()]);
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleActive = async (doctorId: string, currentStatus: boolean) => {
    try {
      setProcessingId(doctorId);
      await adminApi.updateDoctorStatus(doctorId, !currentStatus);
      toast.success(`Doctor ${!currentStatus ? "activated" : "deactivated"}`);
      if (viewingDoctor && viewingDoctor.id === doctorId) {
        setViewingDoctor((prev: any) => (prev ? { ...prev, is_active: !currentStatus } : null));
      }
      await Promise.all([fetchDoctors(), fetchStats()]);
    } catch (err: any) {
      toast.error("Status update failed", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // Soft Delete Action
  const handleConfirmDelete = async () => {
    if (!deletingDoctor) return;
    try {
      setDeletingLoading(true);
      await adminApi.deleteDoctor(deletingDoctor.id);
      toast.success(`Doctor Dr. ${deletingDoctor.name} removed`, {
        description: "Practitioner profile was soft-deleted and login deactivated.",
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
      setDeletingDoctor(null);
      if (viewingDoctor?.id === deletingDoctor.id) {
        setViewingDoctor(null);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== deletingDoctor.id));
      await Promise.all([fetchDoctors(), fetchStats()]);
    } catch (err: any) {
      toast.error("Failed to delete doctor", { description: err.message });
    } finally {
      setDeletingLoading(false);
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === doctors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(doctors.map((d) => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-normal text-stone-900">
            Doctor Directory & Practitioners
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage clinician credentials, profiles, consultation fees, and verification status.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              fetchDoctors();
              fetchStats();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-[#5b15fc]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setCreateDoctorOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5b15fc] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4d0ee0] shadow-xs cursor-pointer transition-all"
          >
            <UserPlus className="size-4" />
            <span>Onboard Doctor</span>
          </button>
        </div>
      </div>

      {/* 1. Independent Stat Cards Above Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Doctors */}
        <div className="neo-card rounded-2xl p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Practitioners
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#5b15fc]/10 text-[#5b15fc]">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-normal text-stone-900">
              {statsLoading ? "..." : stats.total}
            </span>
            <span className="text-xs text-stone-500">Registered</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Platform clinicians in database</p>
        </div>

        {/* Stat 2: Verified & Active */}
        <div className="neo-card rounded-2xl p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Active & Verified
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-normal text-emerald-700">
              {statsLoading ? "..." : stats.verifiedActive}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Available</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Live for patient video visits</p>
        </div>

        {/* Stat 3: Pending Verification */}
        <div className="neo-card rounded-2xl p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Pending Approval
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-normal text-amber-700">
              {statsLoading ? "..." : stats.pending}
            </span>
            <span className="text-xs text-amber-600 font-medium">In Queue</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Awaiting BMDC document check</p>
        </div>

        {/* Stat 4: Average Consultation Fee */}
        <div className="neo-card rounded-2xl p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Avg Consultation Fee
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Coins className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-normal text-stone-900">
              {statsLoading ? "..." : `৳${stats.avgFee}`}
            </span>
            <span className="text-xs text-stone-500">BDT</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Average per telemedicine visit</p>
        </div>
      </div>

      {/* 2. Main Content Card with Table / Grid View */}
      <div className="neo-card rounded-[24px] bg-white p-5 sm:p-6 shadow-xs space-y-5">
        {/* Controls: Search, Status Tabs, View Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by doctor name, BMDC, phone, or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 text-xs text-stone-900 neo-input outline-hidden placeholder:text-stone-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Tabs */}
            <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
              {(["ALL", "VERIFIED", "PENDING", "REJECTED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-white text-[#5b15fc] shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {st === "ALL" ? "All Doctors" : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* HeroUI Segmented View Switcher (Table vs Grid) */}
            <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-[#5b15fc] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="Table View"
              >
                <TableIcon className="size-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-[#5b15fc] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Rows Banner (if any) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-[#5b15fc]/20 bg-[#5b15fc]/5 px-4 py-2 text-xs text-[#5b15fc] animate-in fade-in">
            <span className="font-semibold">
              {selectedIds.length} of {doctors.length} doctor{selectedIds.length > 1 ? "s" : ""} selected on this page
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs font-bold underline hover:opacity-80 cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="size-8 text-[#5b15fc]" />
            <p className="text-xs text-stone-500 mt-2">Loading practitioner records...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-3 border border-stone-200">
              <UserCheck className="size-7" />
            </div>
            <p className="font-heading text-base font-normal text-stone-800">No Doctors Found</p>
            <p className="text-xs text-stone-500 max-w-sm mt-1">
              {debouncedSearch
                ? `No clinicians matched "${debouncedSearch}". Try another name or specialty.`
                : "No doctor accounts match the selected status filter."}
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* ========================================================================= */
          /* 3. TABLE VIEW (Default)                                                   */
          /* ========================================================================= */
          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={doctors.length > 0 && selectedIds.length === doctors.length}
                      onChange={handleSelectAll}
                      className="size-4 rounded accent-[#5b15fc] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3">Doctor & Contact</th>
                  <th className="px-4 py-3">BMDC Number</th>
                  <th className="px-4 py-3">Specialties & Degrees</th>
                  <th className="px-4 py-3">Fee / Exp</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Network</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {doctors.map((doc, idx) => {
                  const isSelected = selectedIds.includes(doc.id);
                  return (
                    <tr
                      key={doc.id || doc._id || doc.bmdc_reg_number || `doc-${idx}`}
                      className={`transition-colors hover:bg-stone-50/70 ${
                        isSelected ? "bg-[#5b15fc]/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(doc.id)}
                          className="size-4 rounded accent-[#5b15fc] cursor-pointer"
                        />
                      </td>

                      {/* Doctor & Avatar (Clickable to view detailed info) */}
                      <td className="px-4 py-3">
                        <div
                          onClick={() => setViewingDoctor(doc)}
                          className="flex items-center gap-3 cursor-pointer group/item"
                          title="View Comprehensive Profile"
                        >
                          <div className="size-9 shrink-0 rounded-full border border-stone-200 bg-stone-100 overflow-hidden flex items-center justify-center shadow-xs group-hover/item:border-[#5b15fc]">
                            {doc.avatar_url ? (
                              <img src={doc.avatar_url} alt={doc.name} className="size-full object-cover" />
                            ) : (
                              <User className="size-4 text-stone-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 truncate group-hover/item:text-[#5b15fc] transition-colors">
                              {doc.name}
                            </p>
                            <p className="text-[11px] text-stone-500 font-mono truncate">{doc.phone}</p>
                            {doc.email && (
                              <p className="text-[10px] text-stone-400 truncate">{doc.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* BMDC */}
                      <td className="px-4 py-3 font-mono font-semibold text-stone-700">
                        <span className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px]">
                          {doc.bmdc_reg_number}
                        </span>
                      </td>

                      {/* Specialties & Degrees */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-semibold text-stone-800 truncate">
                          {doc.specialties?.join(", ") || "General Medicine"}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {doc.qualifications?.join(", ") || "MBBS"}
                        </p>
                      </td>

                      {/* Fee & Experience */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#5b15fc]">৳{doc.consultation_fee}</p>
                        <p className="text-[11px] text-stone-500">{doc.experience_years} yrs exp</p>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            doc.verification_status === "VERIFIED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : doc.verification_status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {doc.verification_status}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-3">
                        {doc.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400">
                            <span className="size-1.5 rounded-full bg-stone-300" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Inspect / View Details Button */}
                          <button
                            onClick={() => setViewingDoctor(doc)}
                            className="rounded-lg p-1.5 text-stone-500 hover:bg-[#5b15fc]/10 hover:text-[#5b15fc] transition-colors cursor-pointer"
                            title="View Comprehensive Profile"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingDoctor(doc)}
                            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
                            title="Edit Doctor Profile"
                          >
                            <Edit2 className="size-3.5" />
                          </button>

                          {/* Quick Verify / Reject for Pending */}
                          {doc.verification_status === "PENDING" ? (
                            <>
                              <button
                                disabled={processingId === doc.id}
                                onClick={() => handleVerify(doc.id, "VERIFIED")}
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Approve Doctor"
                              >
                                {processingId === doc.id ? (
                                  <Spinner className="size-3.5" />
                                ) : (
                                  <CheckCircle2 className="size-3.5" />
                                )}
                              </button>
                              <button
                                disabled={processingId === doc.id}
                                onClick={() => handleVerify(doc.id, "REJECTED")}
                                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Reject Doctor"
                              >
                                <XCircle className="size-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={processingId === doc.id}
                              onClick={() => handleToggleActive(doc.id, doc.is_active)}
                              className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
                                doc.is_active
                                  ? "text-stone-500 hover:bg-stone-100"
                                  : "text-[#5b15fc] hover:bg-[#5b15fc]/10"
                              }`}
                              title={doc.is_active ? "Deactivate" : "Activate"}
                            >
                              {doc.is_active ? "Disable" : "Enable"}
                            </button>
                          )}

                          {/* Soft Delete Button */}
                          <button
                            onClick={() => setDeletingDoctor(doc)}
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Soft Delete Doctor"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================================= */
          /* 4. GRID VIEW                                                              */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {doctors.map((doc, idx) => (
              <div
                key={doc.id || doc._id || doc.bmdc_reg_number || `doc-grid-${idx}`}
                className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs transition-all hover:border-[#5b15fc]/30 hover:shadow-md"
              >
                <div>
                  {/* Top: Avatar & Badges (Clickable to view detailed modal) */}
                  <div
                    onClick={() => setViewingDoctor(doc)}
                    className="flex items-start justify-between gap-3 cursor-pointer group/card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-12 shrink-0 rounded-full border border-stone-200 bg-stone-100 overflow-hidden flex items-center justify-center shadow-xs group-hover/card:border-[#5b15fc]">
                        {doc.avatar_url ? (
                          <img src={doc.avatar_url} alt={doc.name} className="size-full object-cover" />
                        ) : (
                          <User className="size-6 text-stone-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading text-base font-normal text-stone-900 truncate group-hover/card:text-[#5b15fc] transition-colors">
                          {doc.name}
                        </h3>
                        <p className="text-[11px] text-stone-500 font-mono">BMDC: {doc.bmdc_reg_number}</p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        doc.verification_status === "VERIFIED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : doc.verification_status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {doc.verification_status}
                    </span>
                  </div>

                  {/* Info lines */}
                  <div className="mt-4 space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Specialty</span>
                      <span className="font-semibold text-stone-800 truncate max-w-[180px]">
                        {doc.specialties?.join(", ") || "General Medicine"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Qualifications</span>
                      <span className="font-semibold text-stone-800 truncate max-w-[180px]">
                        {doc.qualifications?.join(", ") || "MBBS"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Experience / Fee</span>
                      <span>
                        {doc.experience_years} yrs •{" "}
                        <strong className="text-[#5b15fc]">৳{doc.consultation_fee}</strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Phone</span>
                      <span className="font-mono text-stone-700">{doc.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    {doc.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400">
                        <span className="size-1.5 rounded-full bg-stone-300" />
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingDoctor(doc)}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
                    >
                      <Eye className="size-3.5 text-[#5b15fc]" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => setEditingDoctor(doc)}
                      className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingDoctor(doc)}
                      className="rounded-lg border border-rose-100 bg-rose-50/50 p-1.5 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Soft Delete Doctor"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. HERO UI SERVERSIDE PAGINATION                                          */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-stone-200 pt-4 text-xs text-stone-500">
          {/* Summary / Range Info */}
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-stone-900">
                {totalCount === 0 ? 0 : (page - 1) * rowsPerPage + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-stone-900">
                {Math.min(page * rowsPerPage, totalCount)}
              </strong>{" "}
              of <strong className="text-stone-900">{totalCount}</strong> doctors
            </span>
          </div>

          {/* Page Controls & Rows per Page */}
          <div className="flex items-center gap-4">
            {/* HeroUI-style Rows Per Page Select */}
            <div className="flex items-center gap-2">
              <span className="text-stone-400 text-[11px]">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1); // Reset to page 1 on page size change
                }}
                className="h-8 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-semibold text-stone-800 shadow-xs outline-hidden cursor-pointer hover:border-stone-300"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Numbered Pagination Buttons */}
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs cursor-pointer transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="size-4" />
              </button>

              {/* Display page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && page > 3) {
                  p = page - 2 + i;
                  if (p > totalPages) p = totalPages - (4 - i);
                }
                if (p <= 0 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      page === p
                        ? "bg-[#5b15fc] text-white shadow-xs"
                        : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 shadow-xs"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs cursor-pointer transition-all"
                title="Next Page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Onboard Doctor Modal */}
      <CreateDoctorModal
        isOpen={createDoctorOpen}
        onClose={() => setCreateDoctorOpen(false)}
        onSuccess={() => {
          fetchDoctors();
          fetchStats();
        }}
      />

      {/* Comprehensive Doctor Detail Modal */}
      <DoctorDetailModal
        doctor={viewingDoctor}
        isOpen={Boolean(viewingDoctor)}
        onClose={() => setViewingDoctor(null)}
        onEdit={(d) => {
          setViewingDoctor(null);
          setEditingDoctor(d);
        }}
        onDelete={(d) => {
          setViewingDoctor(null);
          setDeletingDoctor(d);
        }}
        onVerify={handleVerify}
        onToggleActive={handleToggleActive}
        processingId={processingId}
      />

      {/* Edit Doctor Modal */}
      <EditDoctorModal
        doctor={editingDoctor}
        isOpen={Boolean(editingDoctor)}
        onClose={() => setEditingDoctor(null)}
        onSuccess={() => {
          fetchDoctors();
          fetchStats();
        }}
      />

      {/* Soft Delete Confirmation Modal */}
      {deletingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md neo-card rounded-[24px] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-normal text-stone-900">Remove Doctor Profile</h3>
                <p className="text-xs text-stone-500">Soft delete practitioner record</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-stone-900">{deletingDoctor.name}</strong> (BMDC: <span className="font-mono font-bold">{deletingDoctor.bmdc_reg_number}</span>)?
            </p>
            <p className="text-[11px] text-stone-400 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              This will soft-delete the practitioner profile, deactivate doctor login, and hide them from the patient discovery network while preserving historical appointment and prescription records.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingLoading}
                onClick={() => setDeletingDoctor(null)}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deletingLoading ? <Spinner className="size-3.5 text-white" /> : <Trash2 className="size-3.5" />}
                <span>Confirm Soft Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
