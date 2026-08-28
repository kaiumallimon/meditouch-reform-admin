"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { adminApi, mediaApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  X,
  UserPlus,
  Stethoscope,
  ShieldCheck,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  UploadCloud,
  ExternalLink,
  Eye,
  EyeOff
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-4xl border border-border bg-card p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-4xl bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">Onboard & Create Doctor</h2>
              <p className="text-xs text-muted-foreground">Add practitioner credentials to the Telemedicine network with Cloudinary CDN storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-4xl p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Doctor Full Name *</Label>
              <Input
                required
                placeholder="Dr. Tanvir Rahman"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Phone Number (Login ID) *</Label>
              <Input
                required
                placeholder="01711223344"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 2: Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address (Optional)</Label>
              <Input
                type="email"
                placeholder="dr.tanvir@meditouch.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Initial Password *</Label>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="DoctorSecret123!"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-xs font-mono pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
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
              <Label className="text-xs font-semibold">BMDC Reg Number *</Label>
              <Input
                required
                placeholder="A-88741"
                value={bmdcReg}
                onChange={(e) => setBmdcReg(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Experience (Years)</Label>
              <Input
                type="number"
                min="0"
                placeholder="5"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Consultation Fee (BDT)</Label>
              <Input
                type="number"
                min="0"
                placeholder="500"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Specialties Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Specialties (Select all that apply)</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SPECIALTIES.map((spec) => (
                <button
                  type="button"
                  key={spec}
                  onClick={() => toggleSpecialty(spec)}
                  className={`rounded-4xl px-3 py-1 text-xs font-medium transition-all ${
                    selectedSpecialties.includes(spec)
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Add other specialty..."
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                className="h-8 text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomSpecialty} className="h-8 rounded-4xl text-xs">
                Add
              </Button>
            </div>
          </div>

          {/* Qualifications Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Qualifications & Degrees</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_QUALIFICATIONS.map((qual) => (
                <button
                  type="button"
                  key={qual}
                  onClick={() => toggleQualification(qual)}
                  className={`rounded-4xl px-3 py-1 text-xs font-medium transition-all ${
                    selectedQualifications.includes(qual)
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {qual}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Add other qualification (e.g. Diploma in Cardiology)..."
                value={customQualification}
                onChange={(e) => setCustomQualification(e.target.value)}
                className="h-8 text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomQualification} className="h-8 rounded-4xl text-xs">
                Add
              </Button>
            </div>
          </div>

          {/* Bio / Summary */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Doctor Bio / Professional Summary</Label>
            <textarea
              rows={2}
              placeholder="Experienced clinician specializing in rural family healthcare, preventative screenings, and maternal care."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-4xl border border-input bg-background p-3 text-xs outline-hidden focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Verification Documents: Cloudinary CDN Direct Upload */}
          <div className="space-y-3 rounded-4xl border border-border/80 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold text-foreground">Upload Verification Documents (Cloudinary CDN)</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Upload BMDC Certificate, NID card, or Medical Degrees directly to Cloudinary storage.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="h-9 rounded-4xl border border-input bg-card px-3 text-xs font-medium outline-hidden"
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingDoc}
                onClick={() => fileInputRef.current?.click()}
                className="h-9 rounded-4xl text-xs gap-2 border-dashed border-primary/50 hover:border-primary flex-1 justify-center"
              >
                {uploadingDoc ? (
                  <>
                    <Spinner className="size-3.5" />
                    Uploading to Cloudinary CDN...
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-4 text-primary" />
                    Choose Document File (PDF, PNG, JPG)
                  </>
                )}
              </Button>
            </div>

            {/* Uploaded Documents List */}
            {documents.length > 0 ? (
              <div className="space-y-2 pt-1">
                {documents.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-4xl border border-border bg-card p-2.5 px-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <FileText className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-foreground truncate">{d.filename || d.document_type}</p>
                          <Badge variant="outline" className="text-[9px]">
                            {d.document_type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <a
                          href={d.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline truncate"
                        >
                          <span className="truncate">{d.document_url}</span>
                          <ExternalLink className="size-2.5 shrink-0" />
                        </a>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDocument(i)}
                      className="text-destructive hover:opacity-80 p-1 shrink-0"
                      title="Remove Document"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground/70 italic text-center py-1">
                No documents uploaded yet.
              </p>
            )}
          </div>

          {/* Auto-verify Switch */}
          <div className="flex items-center justify-between rounded-4xl border border-border bg-muted/20 p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <p className="text-xs font-semibold text-foreground">Auto-Approve & Activate Now</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Instantly mark doctor status as VERIFIED and ACTIVE upon creation.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoVerify}
              onChange={(e) => setAutoVerify(e.target.checked)}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-4xl text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingDoc} className="rounded-4xl text-xs gap-2">
              {loading ? <Spinner className="size-3.5" /> : <CheckCircle2 className="size-4" />}
              Create Doctor Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
