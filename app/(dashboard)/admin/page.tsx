"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { adminApi, pharmacyApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreateDoctorModal } from "@/components/doctors/create-doctor-modal";
import {
  Users,
  ShieldCheck,
  Clock,
  Calendar,
  Video,
  Banknote,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Stethoscope,
  Pill,
  ExternalLink,
  ArrowUpRight,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [createDoctorOpen, setCreateDoctorOpen] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const loadDashboardData = async () => {
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
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleVerifyDoctor = async (doctorId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      setProcessingDocId(doctorId);
      await adminApi.verifyDoctor(doctorId, status);
      toast.success(status === "VERIFIED" ? "Doctor Approved & Activated" : "Doctor Application Rejected");
      await loadDashboardData();
    } catch (err: any) {
      toast.error("Verification update failed", { description: err.message });
    } finally {
      setProcessingDocId(null);
    }
  };

  const handleSyncMedEasy = async () => {
    try {
      setSyncingCatalog(true);
      const res = await pharmacyApi.ingestMedEasy();
      toast.success("MedEasy Catalog Ingestion Complete", {
        description: `Successfully synchronized ${res.count} medicine records.`,
      });
      await loadDashboardData();
    } catch (err: any) {
      toast.error("Catalog ingestion failed", { description: err.message });
    } finally {
      setSyncingCatalog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Section (Aven exact gradient & layout) */}
      <div className="relative overflow-hidden rounded-4xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-xs">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                {greeting}, Administrator
              </h1>
            </div>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
              Real-time operations monitor for MediTouch Telemedicine & E-Pharmacy platform.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            <Button
              size="sm"
              onClick={() => setCreateDoctorOpen(true)}
              className="gap-2 rounded-4xl bg-primary text-primary-foreground font-semibold shadow-xs"
            >
              <UserPlus className="size-3.5" />
              Onboard Doctor
            </Button>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground rounded-4xl border border-border bg-card px-3 py-2">
              <Calendar className="size-3.5 text-primary" />
              <span>{dateStr}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
              className="gap-2 rounded-4xl"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={Users}
          label="Total Users"
          value={stats?.total_users ?? 0}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Active Doctors"
          value={stats?.active_doctors ?? 0}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
          badge={`${stats?.total_doctors ?? 0} total`}
          badgeColor="text-emerald-600"
        />
        <MetricCard
          icon={Clock}
          label="Pending Review"
          value={stats?.pending_doctor_verifications ?? 0}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
          badge={stats?.pending_doctor_verifications > 0 ? "Action req." : "All clear"}
          badgeColor={stats?.pending_doctor_verifications > 0 ? "text-amber-600 font-semibold" : "text-muted-foreground"}
        />
        <MetricCard
          icon={Calendar}
          label="Appointments"
          value={stats?.total_appointments ?? 0}
          color="text-violet-500"
          bgColor="bg-violet-500/10"
        />
        <MetricCard
          icon={Video}
          label="Consultations"
          value={stats?.completed_consultations ?? 0}
          color="text-cyan-500"
          bgColor="bg-cyan-500/10"
          badge="Completed"
          badgeColor="text-cyan-600"
        />
        <MetricCard
          icon={Banknote}
          label="Revenue BDT"
          value={stats?.total_revenue_bdt ? formatCurrency(stats.total_revenue_bdt) : "৳0.00"}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
          isRawString
        />
      </div>

      {/* 3. Operational Sections: Doctor Verification Queue & Quick Sync */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Doctor Verification Queue */}
        <div className="lg:col-span-2 rounded-4xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">Doctor Verification Queue</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review BMDC registration and credentials for onboarding doctors
              </p>
            </div>
            <Badge variant="warning" className="rounded-4xl px-2.5 py-1">
              {pendingDoctors.length} Pending
            </Badge>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="size-6 text-primary" />
            </div>
          ) : pendingDoctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-4xl bg-emerald-500/10 text-emerald-600 mb-2">
                <CheckCircle2 className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">No Pending Verifications</p>
              <p className="text-xs text-muted-foreground mt-1">All doctor registrations have been processed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-4xl border border-border/80 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        BMDC: {doc.bmdc_reg_number}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
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
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                          >
                            <FileText className="size-3" />
                            {d.document_type}
                            <ExternalLink className="size-2.5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={processingDocId === doc.id}
                      onClick={() => handleVerifyDoctor(doc.id, "REJECTED")}
                      className="h-8 rounded-4xl px-3 text-xs"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={processingDocId === doc.id}
                      onClick={() => handleVerifyDoctor(doc.id, "VERIFIED")}
                      className="h-8 rounded-4xl px-3 text-xs"
                    >
                      {processingDocId === doc.id ? <Spinner className="mr-1 size-3" /> : <CheckCircle2 className="mr-1 size-3.5" />}
                      Approve & Activate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Catalog Ingestion & Quick Actions */}
        <div className="rounded-4xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Catalog & Data Ingestion</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sync normalized medicine records from MedEasy data source into MongoDB.
            </p>
          </div>

          <div className="rounded-4xl border border-border/80 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-4xl bg-primary/10 text-primary">
                <Pill className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">MedEasy Catalog</p>
                <p className="text-xs text-muted-foreground">Generics, dosage, pricing & stock</p>
              </div>
            </div>

            <Button
              className="w-full h-9 rounded-4xl text-xs gap-2"
              disabled={syncingCatalog}
              onClick={handleSyncMedEasy}
            >
              {syncingCatalog ? <Spinner className="size-3.5" /> : <RefreshCw className="size-3.5" />}
              Synchronize Catalog Now
            </Button>
          </div>

          <div className="rounded-4xl border border-border/80 bg-gradient-to-br from-card to-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <ShieldCheck className="size-4 text-emerald-600" />
              Platform Status
            </div>
            <p className="text-xs text-muted-foreground">
              MongoDB, ZEGOCLOUD Video Gateway, bKash Sandbox, and Cloudinary CDN are online and operational.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Live Audit Logs Activity Stream */}
      <div className="rounded-4xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Recent Platform Activity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time audit trails of transactions, registrations, and status updates
            </p>
          </div>
          <Badge variant="outline" className="rounded-4xl text-xs">
            Live Stream
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No recent audit activity.</p>
        ) : (
          <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
            {auditLogs.map((log, index) => (
              <div key={index} className="flex items-center justify-between py-3 px-1 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-4xl bg-muted text-muted-foreground">
                    <Activity className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {log.action}
                      <span className="ml-2 font-normal text-muted-foreground">
                        on {log.target_type} ({log.target_id || "-"})
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      User: {log.user_id || "System"} • IP: {log.ip_address || "Internal"}
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0 pl-2">
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
    <div className="rounded-4xl border border-border bg-card p-4 transition-colors hover:bg-muted/30 shadow-xs">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-4xl ${bgColor} shrink-0`}>
          <Icon className={`size-5 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold tracking-tight text-foreground truncate">
            {typeof value === "number" ? value.toLocaleString() : value}
            {badge && (
              <span className={`ml-1.5 text-[11px] font-normal ${badgeColor ?? "text-muted-foreground"}`}>
                ({badge})
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

