"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { adminApi, mediaApi } from "@/lib/api";
import {
  X,
  Edit2,
  Shield,
  Phone,
  Mail,
  User,
  Upload,
  CheckCircle2,
  Check
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface EditUserModalProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId?: string | null;
}

export function EditUserModal({ user, isOpen, onClose, onSuccess, currentUserId }: EditUserModalProps) {
  const isCurrentUser = currentUserId ? user?.id === currentUserId : false;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setRole(user.role || "USER");
      setAvatarUrl(user.avatar_url || "");
      setIsActive(user.is_active ?? true);
    }
  }, [user]);

  if (!isOpen || !user) return null;

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
      toast.success("Profile photo updated on Cloudinary CDN", {
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
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and Phone are required");
      return;
    }

    try {
      setLoading(true);
      await adminApi.updateUser(user.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase() || undefined,
        role: role,
        avatar_url: avatarUrl || undefined,
        is_active: isActive,
      });

      toast.success("User account updated successfully!", {
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Update failed", { description: err.message });
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
              <Edit2 className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-normal text-stone-900">Modify User Account</h3>
              <p className="text-xs text-stone-500 font-mono">User ID: {user.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
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
              <p className="text-[11px] text-stone-500">Update photo on Cloudinary CDN</p>
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
                <option value="ADMIN">ADMIN (Administrator)</option>
                <option value="NURSE">NURSE (Healthcare Staff)</option>
                <option value="DOCTOR">DOCTOR (Service Practitioner)</option>
                <option value="USER">USER (General User)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mahfuzur Rahman"
                className="w-full h-10 rounded-xl border border-stone-200 bg-white px-3.5 text-xs font-semibold text-stone-800 shadow-xs outline-hidden"
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
                  className="w-full h-10 rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 text-xs font-mono font-semibold text-stone-800 shadow-xs outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full h-10 rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 text-xs font-semibold text-stone-800 shadow-xs outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
            <div>
              <p className="text-xs font-bold text-stone-800">Account Active State</p>
              <p className="text-[11px] text-stone-500">
                {isCurrentUser
                  ? "You cannot deactivate your own logged-in administrator account"
                  : "Deactivating disables user login across all devices"}
              </p>
            </div>
            <input
              type="checkbox"
              disabled={isCurrentUser}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded accent-[#5b15fc] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={isCurrentUser ? "You cannot deactivate your own account" : undefined}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 sm:py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5b15fc] px-5 py-2.5 sm:py-2 text-xs font-semibold text-white hover:bg-[#4d0ee0] shadow-xs cursor-pointer transition-all disabled:opacity-50 text-center"
            >
              {loading ? <Spinner className="size-4 text-white" /> : <Check className="size-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

