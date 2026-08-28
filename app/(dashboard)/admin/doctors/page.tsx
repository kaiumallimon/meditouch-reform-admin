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
      toast.success(`Doctor ${status === "VERIFIED" ? "verified & activated" : "rejected"}`);
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
          <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
            Doctor Verification & Directory
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Review BMDC registrations, medical credentials, and manage practitioner activation status.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateDoctorOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#5b15fc] text-white px-4 py-2 text-xs font-semibold shadow-xs hover:bg-[#4d0ee0] transition-all cursor-pointer"
          >
            <UserPlus className="size-3.5" />
            <span>Onboard New Doctor</span>
          </button>
          <button
            onClick={fetchDoctors}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-100/70 p-1">
          {["ALL", "PENDING", "VERIFIED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab
                  ? "bg-[#5b15fc] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {tab === "ALL" ? "All Doctors" : tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
          <input
            placeholder="Search by name, BMDC reg, or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full sm:w-80 rounded-xl pl-9 pr-4 text-xs font-medium text-stone-900 neo-input outline-hidden placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Doctor Cards List */}
      <div className="neo-card rounded-[22px] p-6 bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-8 text-[#5b15fc]" />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 border border-stone-200 mb-2">
              <UserCheck className="size-6" />
            </div>
            <p className="text-sm font-bold text-stone-900">No Doctors Found</p>
            <p className="text-xs text-stone-500 mt-1">Try adjusting your search criteria or verification status filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4 transition-all hover:bg-stone-50 hover:border-stone-400"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-base font-normal text-stone-900">{doc.name}</h3>
                    <span className="rounded border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-stone-700">
                      BMDC: {doc.bmdc_reg_number}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        doc.verification_status === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : doc.verification_status === "REJECTED"
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}
                    >
                      {doc.verification_status}
                    </span>
                    {doc.is_active && (
                      <span className="rounded-full bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/30 px-2 py-0.5 text-[10px] font-bold uppercase">
                        Active In Network
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                    <span>
                      <strong className="text-stone-900">Specialties:</strong> {doc.specialties?.join(", ") || "General Medicine"}
                    </span>
                    <span>
                      <strong className="text-stone-900">Degrees:</strong> {doc.qualifications?.join(", ") || "MBBS"}
                    </span>
                    <span>
                      <strong className="text-stone-900">Experience:</strong> {doc.experience_years} years
                    </span>
                    <span>
                      <strong className="text-stone-900">Fee:</strong> ৳{doc.consultation_fee} BDT
                    </span>
                  </div>

                  {/* Attached Verification Documents */}
                  {doc.verification_documents && doc.verification_documents.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Attached Documents:</span>
                      {doc.verification_documents.map((d: any, idx: number) => (
                        <a
                          key={idx}
                          href={d.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-bold text-[#5b15fc] hover:bg-[#5b15fc]/10 shadow-[1px_1px_0px_0px_#1C1917]"
                        >
                          <FileText className="size-3 text-[#5b15fc]" />
                          <span>{d.document_type}</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                  {doc.verification_status === "PENDING" ? (
                    <>
                      <button
                        disabled={processingId === doc.id}
                        onClick={() => handleVerify(doc.id, "REJECTED")}
                        className="flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 neo-button"
                      >
                        <XCircle className="size-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        disabled={processingId === doc.id}
                        onClick={() => handleVerify(doc.id, "VERIFIED")}
                        className="flex items-center gap-1 rounded-xl border border-stone-900 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 neo-button shadow-[2px_2px_0px_0px_#1C1917]"
                      >
                        {processingId === doc.id ? <Spinner className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                        <span>Approve & Verify</span>
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={processingId === doc.id}
                      onClick={() => handleToggleActive(doc.id, doc.is_active)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold neo-button border border-stone-800 ${
                        doc.is_active
                          ? "bg-white text-stone-800 hover:bg-stone-100"
                          : "bg-[#5b15fc] text-white shadow-[2px_2px_0px_0px_#1C1917] hover:bg-[#4d0ee0]"
                      }`}
                    >
                      {doc.is_active ? "Deactivate Doctor" : "Activate Doctor"}
                    </button>
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
