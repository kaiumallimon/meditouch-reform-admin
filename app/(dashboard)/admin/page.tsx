"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { adminApi, pharmacyApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  ShieldCheck,
  Calendar,
  Video,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  UserPlus,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { CreateDoctorModal } from "@/components/doctors/create-doctor-modal";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [createDoctorOpen, setCreateDoctorOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, docsData, logsData] = await Promise.all([
        adminApi.getDashboardStats().catch(() => null),
        adminApi.listDoctors({ verification_status: "PENDING", limit: 5 }).catch(() => ({ items: [] })),
        adminApi.getAuditLogs(1, 10).catch(() => ({ items: [] })),
      ]);

      if (statsData) setStats(statsData);
      if (docsData) setPendingDoctors(docsData.items || []);
      if (logsData) setAuditLogs(logsData.items || []);
    } catch (err: any) {
      toast.error("Failed to load dashboard data", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleVerifyDoctor = async (doctorId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      setProcessingDocId(doctorId);
      await adminApi.verifyDoctor(doctorId, status);
      toast.success(`Doctor ${status === "VERIFIED" ? "Approved & Verified" : "Rejected"}`);
      await loadDashboardData();
    } catch (err: any) {
      toast.error("Verification failed", { description: err.message });
    } finally {
      setProcessingDocId(null);
    }
  };

  const handleSyncMedEasy = async () => {
    try {
      setSyncingCatalog(true);
      const res = await pharmacyApi.ingestMedEasy();
      toast.success("MedEasy Catalog Ingested", {
        description: `Successfully synchronized ${res.count} medicine records.`,
      });
      await loadDashboardData();
    } catch (err: any) {
      toast.error("Catalog ingestion failed", { description: err.message });
    } finally {
      setSyncingCatalog(false);
    }
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* 1. Hero Greeting Card */}
      <div className="relative overflow-hidden neo-card rounded-[22px] p-6 sm:p-8 bg-gradient-to-br from-white via-white to-[#5b15fc]/5">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Live Platform Status</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900 mt-1">
              {greeting}, Administrator
            </h1>
            <p className="mt-1 max-w-lg text-xs text-stone-500">
              Operations overview for MediTouch Telemedicine network and E-Pharmacy fulfillment.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            <button
              onClick={() => setCreateDoctorOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#5b15fc] text-white px-4 py-2 text-xs font-semibold shadow-xs hover:bg-[#4d0ee0] transition-all cursor-pointer"
            >
              <UserPlus className="size-3.5" />
              <span>Onboard Doctor</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-stone-600 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2">
              <Calendar className="size-3.5 text-[#5b15fc]" />
              <span>{dateStr}</span>
            </div>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={Users}
          label="Total Users"
          value={stats?.total_users ?? 0}
          color="text-[#5b15fc]"
          bgColor="bg-[#5b15fc]/10"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Active Doctors"
          value={stats?.active_doctors ?? 0}
          color="text-emerald-600"
          bgColor="bg-emerald-500/10"
          badge={`${stats?.total_doctors ?? 0} total`}
          badgeColor="text-emerald-700"
        />
        <MetricCard
          icon={Clock}
          label="Pending Review"
          value={stats?.pending_doctor_verifications ?? 0}
          color="text-amber-600"
          bgColor="bg-amber-500/10"
          badge={stats?.pending_doctor_verifications > 0 ? "Action req." : "All clear"}
          badgeColor={stats?.pending_doctor_verifications > 0 ? "text-amber-700 font-bold" : "text-stone-400"}
        />
        <MetricCard
          icon={Calendar}
          label="Appointments"
          value={stats?.total_appointments ?? 0}
          color="text-violet-600"
          bgColor="bg-violet-500/10"
        />
        <MetricCard
          icon={Video}
          label="Consultations"
          value={stats?.completed_consultations ?? 0}
          color="text-cyan-600"
          bgColor="bg-cyan-500/10"
          badge="Completed"
          badgeColor="text-cyan-700"
        />
        <MetricCard
          icon={Banknote}
          label="Revenue BDT"
          value={stats?.total_revenue_bdt ? formatCurrency(stats.total_revenue_bdt) : "৳0.00"}
          color="text-emerald-600"
          bgColor="bg-emerald-500/10"
          isRawString
        />
      </div>

      {/* 3. Operational Sections: Doctor Verification Queue & Quick Sync */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Doctor Verification Queue */}
        <div className="lg:col-span-2 neo-card rounded-[22px] p-6 bg-white">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200">
            <div>
              <h2 className="font-heading text-lg font-normal text-stone-900">Doctor Verification Queue</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Review BMDC registrations and medical credentials for onboarding doctors
              </p>
            </div>
            <span className="rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold px-2.5 py-1">
              {pendingDoctors.length} Pending
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="size-6 text-[#5b15fc]" />
            </div>
          ) : pendingDoctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-300 mb-2">
                <CheckCircle2 className="size-6" />
              </div>
              <p className="text-sm font-bold text-stone-900">No Pending Verifications</p>
              <p className="text-xs text-stone-500 mt-0.5">All practitioner registrations have been approved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDoctors.map((doc, idx) => (
                <div
                  key={doc.id || doc._id || doc.bmdc_reg_number || `pending-doc-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 transition-all hover:bg-stone-100"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="size-10 shrink-0 rounded-full border border-stone-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                      {doc.avatar_url ? (
                        <img src={doc.avatar_url} alt={doc.name} className="size-full object-cover" />
                      ) : (
                        <User className="size-5 text-stone-400" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-stone-900 truncate">{doc.name}</p>
                        <span className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-stone-700">
                          BMDC: {doc.bmdc_reg_number}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600">
                        {doc.specialties?.join(", ") || "General Physician"} • {doc.experience_years} yrs exp • ৳{doc.consultation_fee} fee
                      </p>
                    {doc.verification_documents && doc.verification_documents.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        {doc.verification_documents.map((d: any, idx: number) => (
                          <a
                            key={idx}
                            href={d.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5b15fc] hover:underline"
                          >
                            <span>{d.document_type}</span>
                            <ExternalLink className="size-3" />
                          </a>
                        ))}
                      </div>
                    )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={processingDocId === doc.id}
                      onClick={() => handleVerifyDoctor(doc.id, "REJECTED")}
                      className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs cursor-pointer transition-all"
                    >
                      <XCircle className="size-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      disabled={processingDocId === doc.id}
                      onClick={() => handleVerifyDoctor(doc.id, "VERIFIED")}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition-all"
                    >
                      {processingDocId === doc.id ? <Spinner className="size-3.5 text-white" /> : <CheckCircle2 className="size-3.5" />}
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* E-Pharmacy Ingestion Sync Action Card */}
        <div className="neo-card rounded-[22px] p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/20">
                <Sparkles className="size-4.5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-normal text-stone-900">MedEasy Sync</h2>
                <p className="text-[11px] text-stone-500">E-Pharmacy Catalog Automation</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Populate or update medicine inventory directly from the MedEasy Bangladesh verified pharmaceutical catalog.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-200 space-y-2">
            <button
              onClick={handleSyncMedEasy}
              disabled={syncingCatalog}
              className="w-full h-10 rounded-xl bg-[#5b15fc] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs hover:bg-[#4d0ee0] disabled:opacity-50 cursor-pointer transition-all"
            >
              {syncingCatalog ? (
                <>
                  <Spinner className="size-3.5 text-white" />
                  <span>Ingesting MedEasy...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="size-3.5" />
                  <span>Sync MedEasy Catalog</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-stone-400 text-center">
              Runs server-side idempotent scraper & catalog ingestion
            </p>
          </div>
        </div>
      </div>

      {/* 4. Live Audit Log Stream */}
      <div className="neo-card rounded-[22px] p-6 bg-white">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200">
          <div>
            <h2 className="font-heading text-lg font-normal text-stone-900">System Activity Stream</h2>
            <p className="text-xs text-stone-500 mt-0.5">Real-time audit log of admin and user transactions</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="text-xs font-bold text-[#5b15fc] hover:underline"
          >
            Refresh Stream
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner className="size-5 text-[#5b15fc]" />
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="text-center py-6 text-xs text-stone-400 italic">No audit records logged yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {auditLogs.map((log, idx) => (
              <div
                key={log.id || log._id || `${log.action}-${log.created_at || idx}-${idx}`}
                className="flex items-center justify-between py-2.5 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                    <Activity className="size-3.5 text-[#5b15fc]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {log.action}
                      <span className="ml-2 font-normal text-stone-500">
                        on {log.target_type} ({log.target_id || "-"})
                      </span>
                    </p>
                    <p className="text-[10px] text-stone-400">
                      User: {log.user_id || "System"} • IP: {log.ip_address || "Internal"}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-stone-400 shrink-0 pl-2">
                  {formatDate(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Doctor Modal Dialog */}
      <CreateDoctorModal
        isOpen={createDoctorOpen}
        onClose={() => setCreateDoctorOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  badge,
  badgeColor,
  isRawString = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  badge?: string;
  badgeColor?: string;
  isRawString?: boolean;
}) {
  return (
    <div className="neo-card rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md bg-white">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${bgColor} shrink-0 border border-stone-200/60`}>
          <Icon className={`size-5 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold tracking-tight text-stone-900 truncate">
            {typeof value === "number" ? value.toLocaleString() : value}
            {badge && (
              <span className={`ml-1.5 text-[10px] font-medium ${badgeColor ?? "text-stone-400"}`}>
                ({badge})
              </span>
            )}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}
