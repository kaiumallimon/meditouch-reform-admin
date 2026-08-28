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
  Eye,
  EyeOff,
  ShieldCheck
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [autoVerify, setAutoVerify] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  // Direct file upload to Cloudinary CDN
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
    if (!name.trim() || !phone.trim() || !password.trim() || !bmdcReg.trim()) {
      toast.error("Please fill in all required fields (Name, Phone, Password, BMDC Number)");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() ? email.trim() : undefined,
        password: password.trim(),
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

      toast.success("Doctor account created successfully!", {
        description: `${created.name} (BMDC: ${created.bmdc_reg_number}) is ${autoVerify ? "verified and activated" : "pending review"}.`,
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
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto neo-card rounded-[24px] p-6 sm:p-8 bg-white my-auto shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/20">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-normal text-stone-900">Onboard & Create Doctor</h2>
              <p className="text-xs text-stone-500">Add practitioner credentials to the Telemedicine network with Cloudinary CDN storage</p>
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

          {/* Row 2: Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="dr.tanvir@meditouch.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 rounded-xl px-3.5 text-xs text-stone-900 neo-input outline-hidden"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">Initial Password *</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="DoctorSecret123!"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded-xl pl-3.5 pr-10 text-xs font-mono text-stone-900 neo-input outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </button>
              </div>
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
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    selectedSpecialties.includes(spec)
                      ? "bg-[#5b15fc] text-white shadow-[1px_1px_0px_0px_#1C1917]"
                      : "border border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100"
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
              <button type="button" onClick={addCustomSpecialty} className="h-8 rounded-lg border border-stone-800 bg-white px-3 text-xs font-bold neo-button">
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
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    selectedQualifications.includes(qual)
                      ? "bg-[#5b15fc] text-white shadow-[1px_1px_0px_0px_#1C1917]"
                      : "border border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100"
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
              <button type="button" onClick={addCustomQualification} className="h-8 rounded-lg border border-stone-800 bg-white px-3 text-xs font-bold neo-button">
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
          <div className="space-y-3 rounded-2xl border border-stone-300 bg-stone-50 p-4">
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
                className="h-9 rounded-xl border border-stone-800 bg-white px-3 text-xs font-bold text-stone-800 neo-input outline-hidden"
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
                className="h-9 rounded-xl border border-dashed border-[#5b15fc] bg-white px-4 text-xs font-bold text-[#5b15fc] hover:bg-[#5b15fc]/5 flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
          <div className="flex items-center justify-between rounded-xl border border-stone-300 bg-stone-50 p-4">
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
              className="rounded-xl border border-stone-800 bg-white px-4 py-2 text-xs font-bold text-stone-800 neo-button hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingDoc}
              className="rounded-xl bg-[#5b15fc] text-white px-4 py-2 text-xs font-bold neo-button shadow-[2px_2px_0px_0px_#1C1917] hover:bg-[#4d0ee0] disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Spinner className="size-3.5 text-white" /> : <CheckCircle2 className="size-4" />}
              <span>Create Doctor Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
