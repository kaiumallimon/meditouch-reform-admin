"use client";

import * as React from "react";
import { useState } from "react";
import {
  X,
  User,
  Shield,
  Phone,
  Mail,
  Calendar,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Activity,
  ShieldAlert,
  Send
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface UserDetailModalProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
  onToggleActive: (userId: string, currentStatus: boolean) => void;
  onSendRecovery: (userId: string) => void;
  processingId: string | null;
}

export function UserDetailModal({
  user,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleActive,
  onSendRecovery,
  processingId,
}: UserDetailModalProps) {
  if (!isOpen || !user) return null;

  const roleColors: Record<string, string> = {
    ADMIN: "bg-[#5b15fc]/10 text-[#5b15fc] border-[#5b15fc]/20",
    NURSE: "bg-teal-50 text-teal-700 border-teal-200",
    DOCTOR: "bg-blue-50 text-blue-700 border-blue-200",
    PATIENT: "bg-amber-50 text-amber-700 border-amber-200",
    USER: "bg-stone-100 text-stone-700 border-stone-200",
  };

  const currentRole = (user.role || "USER").toUpperCase();
  const roleBadgeClass = roleColors[currentRole] || roleColors.USER;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto neo-card rounded-[24px] bg-white p-6 sm:p-7 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <Shield className="size-4 text-[#5b15fc]" />
            <span>Account Security & Profile Details</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Hero Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-5">
          <div className="size-20 shrink-0 rounded-full border-2 border-stone-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="size-full object-cover" />
            ) : (
              <User className="size-10 text-stone-400" />
            )}
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-heading text-2xl font-normal text-stone-900 truncate">
                  {user.name}
                </h2>
                <p className="text-xs font-mono text-stone-500 mt-0.5">ID: {user.id}</p>
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${roleBadgeClass}`}>
                  {user.role}
                </span>
                {user.is_active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-semibold border border-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-200 text-stone-600 px-2.5 py-1 text-xs font-semibold">
                    <span className="size-1.5 rounded-full bg-stone-400" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Phone className="size-3.5 text-stone-500" />
              Phone (Login Identifier)
            </span>
            <p className="font-mono font-bold text-stone-900 text-sm">{user.phone}</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Mail className="size-3.5 text-stone-500" />
              Registered Email
            </span>
            <p className="font-semibold text-stone-900 truncate text-sm">
              {user.email || "No email attached"}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Calendar className="size-3.5 text-stone-500" />
              Account Created At
            </span>
            <p className="font-semibold text-stone-900">
              {user.created_at ? formatDate(user.created_at) : "N/A"}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Clock className="size-3.5 text-stone-500" />
              Last Profile Update
            </span>
            <p className="font-semibold text-stone-900">
              {user.updated_at ? formatDate(user.updated_at) : "N/A"}
            </p>
          </div>
        </div>

        {/* Password Recovery Card */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc]">
                <KeyRound className="size-4" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Administrative Password Recovery
              </h4>
            </div>

            <button
              disabled={processingId === user.id || !user.email}
              onClick={() => onSendRecovery(user.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#5b15fc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#5b15fc] hover:bg-[#5b15fc]/5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {processingId === user.id ? (
                <Spinner className="size-3.5 text-[#5b15fc]" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>Dispatch Passphrase to Email</span>
            </button>
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            Regenerates a cryptographically secure readable passphrase and delivers it to {user.email || "user email"} via SMTP.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onDelete(user);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs cursor-pointer transition-all"
            >
              <Trash2 className="size-3.5" />
              <span>Soft Delete Account</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all"
            >
              <Edit2 className="size-3.5" />
              <span>Edit Account</span>
            </button>
          </div>

          <button
            disabled={processingId === user.id}
            onClick={() => onToggleActive(user.id, user.is_active)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold shadow-xs cursor-pointer transition-all ${
              user.is_active
                ? "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                : "bg-[#5b15fc] text-white hover:bg-[#4d0ee0]"
            }`}
          >
            {user.is_active ? "Deactivate Account" : "Activate Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
