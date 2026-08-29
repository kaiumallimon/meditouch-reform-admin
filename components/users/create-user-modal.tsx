"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { adminApi, mediaApi } from "@/lib/api";
import {
  X,
  UserPlus,
  Shield,
  Phone,
  Mail,
  User,
  Upload,
  CheckCircle2,
  Lock,
  Sparkles,
  Info
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.error(`Profile picture cannot exceed 500 KB (selected file is ${(file.size / 1024).toFixed(0)} KB).`);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }

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
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast.error("Please fill in all required fields (Name, Phone, Email)");
      return;
    }

    try {
      setLoading(true);
      await adminApi.createUser({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        role: role,
        password: password.trim() ? password.trim() : undefined,
        avatar_url: avatarUrl || undefined,
        is_active: isActive,
      });

      toast.success(`${role} account created successfully!`, {
        description: `Credentials and access link have been dispatched to ${email}.`,
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("User creation failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto neo-card rounded-[24px] bg-white p-6 sm:p-7 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#5b15fc]/10 text-[#5b15fc]">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-normal text-stone-900">Provision User Account</h3>
              <p className="text-xs text-stone-500">Create new administrator, nurse, or staff credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Email Notification Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50/80 p-3.5 text-xs text-stone-600">
          <Info className="size-4 text-[#5b15fc] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Upon creation, a <strong>secure auto-generated passphrase</strong> and direct portal login link will be automatically dispatched to their registered Gmail address via SMTP.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
            <div className="relative size-16 shrink-0 rounded-full border-2 border-stone-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
              ) : (
                <User className="size-8 text-stone-400" />
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Spinner className="size-5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <p className="text-xs font-bold text-stone-800">Profile Picture (Max 500 KB)</p>
              <p className="text-[11px] text-stone-500">Upload clean PNG or JPG image for user avatar</p>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                <Upload className="size-3.5" />
                <span>{avatarUrl ? "Change Photo" : "Upload Photo"}</span>
              </button>
            </div>
          </div>

          {/* Role & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Account Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-800 shadow-xs outline-hidden cursor-pointer"
              >
                <option value="ADMIN">ADMIN (System Administrator)</option>
                <option value="NURSE">NURSE (Healthcare Staff)</option>
                <option value="DOCTOR">DOCTOR (Service Practitioner)</option>
                <option value="USER">USER (General User)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mahfuzur Rahman"
                className="w-full h-10 rounded-xl border border-stone-200 bg-white px-3.5 text-xs font-semibold text-stone-800 shadow-xs outline-hidden placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Phone Number (Login ID) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01711223344"
                  className="w-full h-10 rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 text-xs font-mono font-semibold text-stone-800 shadow-xs outline-hidden placeholder:text-stone-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Gmail / Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full h-10 rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 text-xs font-semibold text-stone-800 shadow-xs outline-hidden placeholder:text-stone-400"
                />
              </div>
            </div>
          </div>

          {/* Password (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Manual Password (Optional)
              </label>
              <span className="text-[11px] text-stone-400">Leave blank for auto-passphrase</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate & email via SMTP"
                className="w-full h-10 rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 text-xs font-mono text-stone-800 shadow-xs outline-hidden placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
            <div>
              <p className="text-xs font-bold text-stone-800">Account Active Status</p>
              <p className="text-[11px] text-stone-500">Allow user immediate login and access permissions</p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded accent-[#5b15fc] cursor-pointer"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#5b15fc] px-5 py-2 text-xs font-semibold text-white hover:bg-[#4d0ee0] shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? <Spinner className="size-4 text-white" /> : <Sparkles className="size-4" />}
              <span>Create & Dispatch Credentials</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

