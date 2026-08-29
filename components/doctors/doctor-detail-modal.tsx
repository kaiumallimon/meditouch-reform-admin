"use client";

import * as React from "react";
import { useState } from "react";
import {
  X,
  User,
  ShieldCheck,
  Award,
  Clock,
  Coins,
  Phone,
  Mail,
  FileText,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  Activity,
  Calendar,
  Building,
  Download,
  Copy,
  Eye
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { downloadFileWithExtension, getDocumentPreviewUrl } from "@/lib/download";
import { toast } from "sonner";

interface DoctorDetailModalProps {
  doctor: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (doctor: any) => void;
  onDelete: (doctor: any) => void;
  onVerify: (doctorId: string, status: "VERIFIED" | "REJECTED") => void;
  onToggleActive: (doctorId: string, currentStatus: boolean) => void;
  processingId: string | null;
}

export function DoctorDetailModal({
  doctor,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onVerify,
  onToggleActive,
  processingId,
}: DoctorDetailModalProps) {
  const [previewDoc, setPreviewDoc] = useState<{ type: string; url: string } | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !doctor) return null;

  const handleDownload = async (url: string, type: string) => {
    try {
      setDownloading(true);
      const filename = `${doctor.name}_${type}`.replace(/\s+/g, "_");
      await downloadFileWithExtension(url, filename);
      toast.success("Document downloaded", {
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
    } catch (e: any) {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const copyDocUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Document URL copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto neo-card rounded-[24px] bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        {/* Modal Top Nav */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <Activity className="size-4 text-[#5b15fc]" />
            <span>Practitioner Comprehensive Profile</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Doctor Hero Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 rounded-2xl border border-stone-200 bg-stone-50/70 p-5">
          <div className="size-20 sm:size-24 shrink-0 rounded-full border-2 border-stone-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
            {doctor.avatar_url ? (
              <img src={doctor.avatar_url} alt={doctor.name} className="size-full object-cover" />
            ) : (
              <User className="size-10 text-stone-400" />
            )}
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-heading text-2xl font-normal text-stone-900 truncate">
                  {doctor.name}
                </h2>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  BMDC Registration: <strong className="text-stone-800">{doctor.bmdc_reg_number}</strong>
                </p>
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                    doctor.verification_status === "VERIFIED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : doctor.verification_status === "REJECTED"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {doctor.verification_status}
                </span>
                {doctor.is_active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-semibold border border-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Active In Network
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-200 text-stone-600 px-2.5 py-1 text-xs font-semibold">
                    <span className="size-1.5 rounded-full bg-stone-400" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Specialties & Degrees Chips */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              {doctor.specialties?.map((spec: string, i: number) => (
                <span
                  key={i}
                  className="rounded-lg bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/20 px-2.5 py-0.5 text-xs font-semibold"
                >
                  {spec}
                </span>
              ))}
              {doctor.qualifications?.map((qual: string, i: number) => (
                <span
                  key={i}
                  className="rounded-lg border border-stone-300 bg-white text-stone-700 px-2 py-0.5 text-xs font-semibold font-mono"
                >
                  {qual}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4-Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Coins className="size-3.5 text-[#5b15fc]" />
              Consultation Fee
            </span>
            <p className="font-heading text-lg font-normal text-stone-900">৳{doctor.consultation_fee}</p>
            <p className="text-[10px] text-stone-400">BDT per session</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Clock className="size-3.5 text-[#5b15fc]" />
              Clinical Experience
            </span>
            <p className="font-heading text-lg font-normal text-stone-900">{doctor.experience_years} Years</p>
            <p className="text-[10px] text-stone-400">Post-graduation practice</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Star className="size-3.5 text-amber-500 fill-amber-500" />
              Patient Rating
            </span>
            <p className="font-heading text-lg font-normal text-stone-900">{doctor.rating || 5.0} / 5.0</p>
            <p className="text-[10px] text-stone-400">{doctor.total_reviews || 0} verified reviews</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Calendar className="size-3.5 text-[#5b15fc]" />
              Total Consultations
            </span>
            <p className="font-heading text-lg font-normal text-stone-900">{doctor.total_consultations || 0}</p>
            <p className="text-[10px] text-stone-400">Completed visits</p>
          </div>
        </div>

        {/* Contact & Bio Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Details */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Account & Contact Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Phone className="size-3.5 text-stone-400" />
                  Phone (Login ID)
                </span>
                <span className="font-mono font-bold text-stone-900">{doctor.phone}</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Mail className="size-3.5 text-stone-400" />
                  Email Address
                </span>
                <span className="font-semibold text-stone-900 truncate max-w-[200px]">
                  {doctor.email || "Not specified"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Building className="size-3.5 text-stone-400" />
                  Internal Doctor ID
                </span>
                <span className="font-mono text-[11px] text-stone-400 truncate max-w-[180px]">{doctor.id}</span>
              </div>
            </div>
          </div>

          {/* Professional Bio */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Professional Biography
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              {doctor.bio || "No professional summary provided."}
            </p>
          </div>
        </div>

        {/* Verification Documents Section (Cloudinary CDN) */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Uploaded Verification Credentials (Cloudinary CDN)
              </h3>
              <p className="text-[11px] text-stone-500">
                Official BMDC licenses, NID identity cards, and academic certificates.
              </p>
            </div>
          </div>

          {doctor.verification_documents && doctor.verification_documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {doctor.verification_documents.map((doc: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc]">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {doc.document_type?.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono truncate max-w-[160px]">
                        {doc.document_url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({ type: doc.document_type, url: doc.document_url })}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5b15fc] hover:bg-[#5b15fc]/10 transition-colors cursor-pointer shadow-xs"
                    >
                      <Eye className="size-3" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(doc.document_url, doc.document_type)}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Download document file"
                    >
                      <Download className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-xs text-stone-400 italic">
              No verification credentials attached to this profile.
            </p>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onDelete(doctor);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs cursor-pointer transition-all"
            >
              <Trash2 className="size-3.5" />
              <span>Soft Delete</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(doctor);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all"
            >
              <Edit2 className="size-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {doctor.verification_status === "PENDING" ? (
              <>
                <button
                  disabled={processingId === doctor.id}
                  onClick={() => onVerify(doctor.id, "REJECTED")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs cursor-pointer transition-all"
                >
                  <XCircle className="size-4" />
                  <span>Reject Practitioner</span>
                </button>
                <button
                  disabled={processingId === doctor.id}
                  onClick={() => onVerify(doctor.id, "VERIFIED")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition-all"
                >
                  {processingId === doctor.id ? <Spinner className="size-4 text-white" /> : <CheckCircle2 className="size-4" />}
                  <span>Approve & Verify</span>
                </button>
              </>
            ) : (
              <button
                disabled={processingId === doctor.id}
                onClick={() => onToggleActive(doctor.id, doctor.is_active)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold shadow-xs cursor-pointer transition-all ${
                  doctor.is_active
                    ? "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    : "bg-[#5b15fc] text-white hover:bg-[#4d0ee0]"
                }`}
              >
                {doctor.is_active ? "Deactivate Doctor" : "Activate Doctor"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl neo-card rounded-[24px] bg-white p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="min-w-0 pr-4">
                <h4 className="font-heading text-base font-normal text-stone-900 truncate">
                  {previewDoc.type.replace(/_/g, " ")}
                </h4>
                <p className="text-[11px] font-mono text-stone-500 truncate">{previewDoc.url}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Document / Image Viewer Body */}
            <div className="flex-1 min-h-[380px] max-h-[500px] overflow-hidden rounded-xl border border-stone-200 bg-stone-100 flex items-center justify-center p-2">
              <img
                src={getDocumentPreviewUrl(previewDoc.url)}
                alt={previewDoc.type}
                className="size-full max-h-[480px] object-contain rounded-xl shadow-xs"
              />
            </div>

            {/* Lightbox Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-3 text-xs">
              <button
                type="button"
                onClick={() => copyDocUrl(previewDoc.url)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                <Copy className="size-3.5" />
                <span>Copy Link</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => handleDownload(previewDoc.url, previewDoc.type)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#5b15fc] bg-white px-4 py-2 font-semibold text-[#5b15fc] hover:bg-[#5b15fc]/5 shadow-xs cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>Download Document</span>
                </button>
                <a
                  href={getDocumentPreviewUrl(previewDoc.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#5b15fc] px-4 py-2 font-semibold text-white hover:bg-[#4d0ee0] shadow-xs"
                >
                  <span>Open Full Link</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
