"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { adminApi, mediaApi } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import {
  X,
  UserPlus,
  FileText,
  Trash2,
  CheckCircle2,
  UploadCloud,
  ExternalLink,
  ShieldCheck,
  Mail,
  KeyRound,
  Camera,
  User
} from "lucide-react";
import { toast } from "sonner";

interface CreateDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AttachedDoc {
  document_type: string;
  document_url: string;
  filename?: string;
  size_bytes?: number;
}

const COMMON_SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Gynecology & Obstetrics",
  "Pediatrics",
  "Dermatology",
  "Orthopedics",
  "Neurology",
  "Psychiatry",
  "ENT",
  "Ophthalmology"
];

const COMMON_QUALIFICATIONS = [
  "MBBS",
  "FCPS",
  "MD",
  "MS",
  "DGO",
  "MRCP",
  "FRCS"
];

export function CreateDoctorModal({ isOpen, onClose, onSuccess }: CreateDoctorModalProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [autoVerify, setAutoVerify] = useState(true);

  // Form states
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bmdcReg, setBmdcReg] = useState("");
  const [experienceYears, setExperienceYears] = useState("5");
  const [consultationFee, setConsultationFee] = useState("500");
  const [bio, setBio] = useState("");

  // Multi-select tags
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(["General Medicine"]);
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>(["MBBS"]);
  const [customQualification, setCustomQualification] = useState("");

  // Verification Documents (Uploaded to Cloudinary)
  const [docType, setDocType] = useState("BMDC_CERTIFICATE");
  const [documents, setDocuments] = useState<AttachedDoc[]>([]);

  if (!isOpen) return null;

  const toggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== spec));
    } else {
      setSelectedSpecialties([...selectedSpecialties, spec]);
    }
  };

  const addCustomSpecialty = () => {
    if (customSpecialty.trim() && !selectedSpecialties.includes(customSpecialty.trim())) {
      setSelectedSpecialties([...selectedSpecialties, customSpecialty.trim()]);
      setCustomSpecialty("");
    }
  };

  const toggleQualification = (qual: string) => {
    if (selectedQualifications.includes(qual)) {
      setSelectedQualifications(selectedQualifications.filter((q) => q !== qual));
    } else {
      setSelectedQualifications([...selectedQualifications, qual]);
    }
  };

  const addCustomQualification = () => {
    if (customQualification.trim() && !selectedQualifications.includes(customQualification.trim())) {
      setSelectedQualifications([...selectedQualifications, customQualification.trim()]);
      setCustomQualification("");
    }
  };

  // Direct avatar upload to Cloudinary CDN
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const res = await mediaApi.uploadAvatar(file);
      setAvatarUrl(res.secure_url);
      toast.success("Profile photo uploaded to Cloudinary CDN", {
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
    } catch (err: any) {
      toast.error("Avatar upload failed", { description: err.message });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  // Direct document upload to Cloudinary CDN
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(true);
      const res = await mediaApi.uploadDoctorDocument(file);
      
      const newDoc: AttachedDoc = {
        document_type: docType,
        document_url: res.secure_url,
        filename: file.name,
        size_bytes: res.bytes,
      };

      setDocuments((prev) => [...prev, newDoc]);
      toast.success("Document uploaded to Cloudinary CDN", {
        description: `${file.name} attached as ${docType.replace(/_/g, " ")}.`,
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
    } catch (err: any) {
      toast.error("Cloudinary upload failed", { description: err.message });
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarUrl) {
      toast.error("Please upload a doctor profile picture");
      return;
    }
    if (!name.trim() || !phone.trim() || !email.trim() || !bmdcReg.trim()) {
      toast.error("Please fill in all required fields (Name, Phone, Email, BMDC Number)");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        avatar_url: avatarUrl,
        bmdc_reg_number: bmdcReg.trim(),
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties : ["General Medicine"],
        qualifications: selectedQualifications.length > 0 ? selectedQualifications : ["MBBS"],
        experience_years: parseInt(experienceYears, 10) || 0,
        consultation_fee: parseFloat(consultationFee) || 0.0,
        bio: bio.trim() ? bio.trim() : undefined,
        verification_documents: documents.map((d) => ({
          document_type: d.document_type,
          document_url: d.document_url,
        })),
      };

      const created = await adminApi.createDoctor(payload);

      // If auto-verify is checked, immediately approve & activate
      if (autoVerify && created.id) {
        await adminApi.verifyDoctor(created.id, "VERIFIED");
      }

      toast.success("Doctor account created & credentials emailed!", {
        description: `Login passphrase sent to ${email.trim()}. Account is ${autoVerify ? "verified and activated" : "pending review"}.`,
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Failed to create doctor", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto neo-card rounded-[24px] p-6 sm:p-8 bg-white my-auto shadow-xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/20">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-normal text-stone-900">Onboard & Create Doctor</h2>
              <p className="text-xs text-stone-500">Upload profile photo and credentials for practitioner activation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Profile Picture Upload Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
            <div className="relative group size-20 shrink-0">
              <div className="size-20 rounded-full border-2 border-stone-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                {uploadingAvatar ? (
                  <Spinner className="size-6 text-[#5b15fc]" />
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Doctor preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-9 text-stone-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                title="Change Photo"
              >
                <Camera className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Doctor Profile Photo *
                </label>
                {avatarUrl && (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.2 border border-emerald-300">
                    Uploaded
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                Upload professional headshot (JPG, PNG, WEBP). Stored securely on Cloudinary CDN.
              </p>
              <div className="pt-1">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                  id="avatar-file-upload"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all"
                >
                  <Camera className="size-3.5 text-[#5b15fc]" />
                  <span>{avatarUrl ? "Change Photo" : "Upload Doctor Photo"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Doctor Full Name *</label>
              <input
                required
                placeholder="Dr. Tanvir Rahman"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 rounded-xl px-3.5 text-xs text-stone-900 neo-input outline-hidden"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Phone Number (Login ID) *</label>
              <input
                required
                placeholder="01711223344"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 rounded-xl px-3.5 text-xs font-mono text-stone-900 neo-input outline-hidden"
              />
            </div>
          </div>

          {/* Row 2: Email Address (Required for Credential Delivery) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Doctor Email Address *</label>
            <input
              required
              type="email"
              placeholder="dr.tanvir@meditouch.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 rounded-xl px-3.5 text-xs text-stone-900 neo-input outline-hidden"
            />
          </div>

          {/* Automatic Passphrase Informational Callout */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 flex items-start gap-3 shadow-xs">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/20 mt-0.5">
              <KeyRound className="size-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-stone-900">Automatic Passphrase Generation & SMTP Dispatch</p>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                The platform will automatically generate a secure, human-readable passphrase (e.g. <code className="font-mono font-bold text-[#5b15fc] bg-white px-1.5 py-0.5 rounded border border-stone-200">Summit-River-Beacon-482#</code>) and email it directly to the doctor with login instructions.
              </p>
            </div>
          </div>

          {/* Row 3: BMDC Reg & Experience & Consultation Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">BMDC Reg Number *</label>
              <input
                required
                placeholder="A-88741"
                value={bmdcReg}
                onChange={(e) => setBmdcReg(e.target.value)}
                className="w-full h-10 rounded-xl px-3.5 text-xs font-mono text-stone-900 neo-input outline-hidden"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Experience (Years)</label>
              <input
                type="number"
                min="0"
                placeholder="5"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full h-10 rounded-xl px-3.5 text-xs text-stone-900 neo-input outline-hidden"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Consultation Fee (BDT)</label>
              <input
                type="number"
                min="0"
                placeholder="500"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="w-full h-10 rounded-xl px-3.5 text-xs text-stone-900 neo-input outline-hidden"
              />
            </div>
          </div>

          {/* Specialties Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Specialties (Select all that apply)</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SPECIALTIES.map((spec) => (
                <button
                  type="button"
                  key={spec}
                  onClick={() => toggleSpecialty(spec)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    selectedSpecialties.includes(spec)
                      ? "bg-[#5b15fc] text-white shadow-xs"
                      : "border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                placeholder="Add other specialty..."
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                className="flex-1 h-8 rounded-lg px-3 text-xs text-stone-900 neo-input outline-hidden"
              />
              <button
                type="button"
                onClick={addCustomSpecialty}
                className="h-8 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Qualifications Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Qualifications & Degrees</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_QUALIFICATIONS.map((qual) => (
                <button
                  type="button"
                  key={qual}
                  onClick={() => toggleQualification(qual)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    selectedQualifications.includes(qual)
                      ? "bg-[#5b15fc] text-white shadow-xs"
                      : "border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {qual}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                placeholder="Add other qualification (e.g. Diploma in Cardiology)..."
                value={customQualification}
                onChange={(e) => setCustomQualification(e.target.value)}
                className="flex-1 h-8 rounded-lg px-3 text-xs text-stone-900 neo-input outline-hidden"
              />
              <button
                type="button"
                onClick={addCustomQualification}
                className="h-8 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Bio / Summary */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Doctor Bio / Professional Summary</label>
            <textarea
              rows={2}
              placeholder="Experienced clinician specializing in rural family healthcare, preventative screenings, and maternal care."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl p-3 text-xs text-stone-900 neo-input outline-hidden"
            />
          </div>

          {/* Verification Documents: Cloudinary CDN Direct Upload */}
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Upload Verification Documents (Cloudinary CDN)</label>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Upload BMDC Certificate, NID card, or Medical Degrees directly to Cloudinary storage.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 shadow-xs outline-hidden cursor-pointer"
              >
                <option value="BMDC_CERTIFICATE">BMDC Certificate</option>
                <option value="NATIONAL_ID">National ID (NID)</option>
                <option value="MEDICAL_DEGREE">Medical Degree</option>
                <option value="OTHER">Other Certificate</option>
              </select>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploadingDoc}
                className="hidden"
                id="doc-file-upload"
              />

              <button
                type="button"
                disabled={uploadingDoc}
                onClick={() => fileInputRef.current?.click()}
                className="h-9 rounded-xl border border-dashed border-[#5b15fc] bg-white px-4 text-xs font-semibold text-[#5b15fc] hover:bg-[#5b15fc]/5 flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {uploadingDoc ? (
                  <>
                    <Spinner className="size-3.5 text-[#5b15fc]" />
                    <span>Uploading to Cloudinary CDN...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-4 text-[#5b15fc]" />
                    <span>Choose Document File (PDF, PNG, JPG)</span>
                  </>
                )}
              </button>
            </div>

            {/* Uploaded Documents List */}
            {documents.length > 0 ? (
              <div className="space-y-2 pt-1">
                {documents.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-2.5 px-3 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc]">
                        <FileText className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-stone-900 truncate">{d.filename || d.document_type}</p>
                          <span className="rounded border border-stone-200 bg-stone-50 px-1 text-[9px] font-mono font-bold">
                            {d.document_type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <a
                          href={d.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-[#5b15fc] hover:underline truncate"
                        >
                          <span className="truncate">{d.document_url}</span>
                          <ExternalLink className="size-2.5 shrink-0" />
                        </a>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDocument(i)}
                      className="text-rose-600 hover:opacity-80 p-1 shrink-0 cursor-pointer"
                      title="Remove Document"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-stone-400 italic text-center py-1">
                No documents uploaded yet.
              </p>
            )}
          </div>

          {/* Auto-verify Switch */}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/80 p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <p className="text-xs font-bold text-stone-900">Auto-Approve & Activate Now</p>
              </div>
              <p className="text-[11px] text-stone-500">
                Instantly mark doctor status as VERIFIED and ACTIVE upon creation.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoVerify}
              onChange={(e) => setAutoVerify(e.target.checked)}
              className="size-4 rounded accent-[#5b15fc] cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingDoc || uploadingAvatar}
              className="rounded-xl bg-[#5b15fc] text-white px-4 py-2 text-xs font-semibold shadow-xs hover:bg-[#4d0ee0] disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
            >
              {loading ? <Spinner className="size-3.5 text-white" /> : <CheckCircle2 className="size-4" />}
              <span>Create Doctor & Send Credentials</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
