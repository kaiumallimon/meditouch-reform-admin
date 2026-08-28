"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { CreateDoctorModal } from "@/components/doctors/create-doctor-modal";
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
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function DoctorsAdminPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [createDoctorOpen, setCreateDoctorOpen] = useState(false);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (statusFilter !== "ALL") {
        params.verification_status = statusFilter;
      }
      const data = await adminApi.listDoctors(params);
      setDoctors(data.items || []);
    } catch (err: any) {
      toast.error("Failed to load doctors", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [statusFilter]);

  const handleVerify = async (doctorId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      setProcessingId(doctorId);
      await adminApi.verifyDoctor(doctorId, status);
      toast.success(status === "VERIFIED" ? "Doctor verified & activated" : "Doctor rejected");
      await fetchDoctors();
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleActive = async (doctorId: string, currentActive: boolean) => {
    try {
      setProcessingId(doctorId);
      await adminApi.updateDoctorStatus(doctorId, !currentActive);
      toast.success(`Doctor ${!currentActive ? "activated" : "deactivated"}`);
      await fetchDoctors();
    } catch (err: any) {
      toast.error("Status update failed", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase()) ||
    doc.bmdc_reg_number.toLowerCase().includes(search.toLowerCase()) ||
    doc.specialties?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Doctor Verification & Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review BMDC registrations, medical degrees, and manage doctor activation status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setCreateDoctorOpen(true)}
            className="gap-2 rounded-4xl bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <UserPlus className="size-3.5" />
            Onboard New Doctor
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDoctors} disabled={loading} className="gap-2 rounded-4xl">
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-4xl border border-border bg-muted/40 p-1">
          {["ALL", "PENDING", "VERIFIED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-4xl px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "ALL" ? "All Doctors" : tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, BMDC, or specialty..."
            className="h-9 w-full sm:w-72 rounded-4xl border border-input bg-card pl-9 pr-3 text-xs outline-hidden focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Doctor List */}
      <div className="rounded-4xl border border-border bg-card p-6 shadow-xs">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserCheck className="size-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No doctors found</p>
            <p className="text-xs text-muted-foreground mt-1">No doctor records match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{doc.name}</p>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      BMDC: {doc.bmdc_reg_number}
                    </Badge>
                    <Badge
                      variant={
                        doc.verification_status === "VERIFIED"
                          ? "success"
                          : doc.verification_status === "PENDING"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px]"
                    >
                      {doc.verification_status}
                    </Badge>
                    <Badge
                      variant={doc.is_active ? "success" : "secondary"}
                      className="text-[10px]"
                    >
                      {doc.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {doc.qualifications?.join(", ") || "MBBS"} • {doc.specialties?.join(", ") || "General Physician"} • {doc.experience_years} yrs experience • Fee: ৳{doc.consultation_fee}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                    <span>Phone: {doc.phone}</span>
                    {doc.email && <span>• Email: {doc.email}</span>}
                    <span>• Consultations: {doc.total_consultations || 0}</span>
                  </div>

                  {doc.verification_documents && doc.verification_documents.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {doc.verification_documents.map((d: any, i: number) => (
                        <a
                          key={i}
                          href={d.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-4xl border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-muted"
                        >
                          <FileText className="size-2.5" />
                          {d.document_type}
                          <ExternalLink className="size-2.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {doc.verification_status === "PENDING" ? (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={processingId === doc.id}
                        onClick={() => handleVerify(doc.id, "REJECTED")}
                        className="h-8 rounded-4xl px-3 text-xs"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={processingId === doc.id}
                        onClick={() => handleVerify(doc.id, "VERIFIED")}
                        className="h-8 rounded-4xl px-3 text-xs"
                      >
                        {processingId === doc.id ? <Spinner className="size-3 mr-1" /> : <CheckCircle2 className="size-3.5 mr-1" />}
                        Approve & Verify
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant={doc.is_active ? "outline" : "default"}
                      disabled={processingId === doc.id}
                      onClick={() => handleToggleActive(doc.id, doc.is_active)}
                      className="h-8 rounded-4xl px-3 text-xs"
                    >
                      {doc.is_active ? "Deactivate Doctor" : "Activate Doctor"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Doctor Modal */}
      <CreateDoctorModal
        isOpen={createDoctorOpen}
        onClose={() => setCreateDoctorOpen(false)}
        onSuccess={fetchDoctors}
      />
    </div>
  );
}

