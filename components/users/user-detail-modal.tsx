"use client";

import * as React from "react";
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
  Clock,
  Send
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";

interface UserDetailModalProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
  onToggleActive: (userId: string, currentStatus: boolean) => void;
  onSendRecovery: (userId: string) => void;
  processingId: string | null;
  currentUserId?: string | null;
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
  currentUserId,
}: UserDetailModalProps) {
  if (!isOpen || !user) return null;

  const isCurrentUser = currentUserId ? user.id === currentUserId : false;

  const roleColors: Record<string, string> = {
    ADMIN: "bg-[#5b15fc]/10 text-[#5b15fc] border-[#5b15fc]/20",
    NURSE: "bg-teal-50 text-teal-700 border-teal-200",
    DOCTOR: "bg-blue-50 text-blue-700 border-blue-200",
    USER: "bg-amber-50 text-amber-700 border-amber-200",
  };

  const currentRole = (user.role || "USER").toUpperCase();
  const roleBadgeClass = roleColors[currentRole] || roleColors.USER;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto neo-card rounded-[24px] bg-white p-5 sm:p-6 md:p-7 shadow-2xl space-y-5 sm:space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3.5 sm:pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <Shield className="size-4 text-[#5b15fc] shrink-0" />
            <span className="truncate">Account Security & Profile Details</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Hero Card */}
        <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-4 rounded-2xl border p-4 sm:p-5 ${
          isCurrentUser
            ? "border-[#5b15fc]/40 bg-[#5b15fc]/5 ring-1 ring-[#5b15fc]/30"
            : "border-stone-200 bg-stone-50/70"
        }`}>
          <div className="size-16 sm:size-20 shrink-0 rounded-full border-2 border-stone-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="size-full object-cover" />
            ) : (
              <User className="size-8 sm:size-10 text-stone-400" />
            )}
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left min-w-0 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-heading text-xl sm:text-2xl font-normal text-stone-900 break-words">
                    {user.name}
                  </h2>
                  {isCurrentUser && (
                    <span className="rounded-full bg-[#5b15fc] text-white px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-xs whitespace-nowrap shrink-0">
                      You (Logged In)
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-stone-500 mt-1 break-all">ID: {user.id}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border whitespace-nowrap ${roleBadgeClass}`}>
                  {user.role}
                </span>
                {user.is_active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-semibold border border-emerald-300 whitespace-nowrap">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-200 text-stone-600 px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
                    <span className="size-1.5 rounded-full bg-stone-400" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 text-xs">
          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Phone className="size-3.5 text-stone-500 shrink-0" />
              Phone (Login Identifier)
            </span>
            <p className="font-mono font-bold text-stone-900 text-sm break-all">{user.phone}</p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Mail className="size-3.5 text-stone-500 shrink-0" />
              Registered Email
            </span>
            <p className="font-semibold text-stone-900 text-sm break-all">
              {user.email || <span className="text-stone-400 italic">No email attached</span>}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Calendar className="size-3.5 text-stone-500 shrink-0" />
              Account Created At
            </span>
            <p className="font-semibold text-stone-900">
              {user.created_at ? formatDate(user.created_at) : "N/A"}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
              <Clock className="size-3.5 text-stone-500 shrink-0" />
              Last Profile Update
            </span>
            <p className="font-semibold text-stone-900">
              {user.updated_at ? formatDate(user.updated_at) : "N/A"}
            </p>
          </div>
        </div>

        {/* Password Recovery Card */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc] shrink-0">
                <KeyRound className="size-4" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Administrative Password Recovery
              </h4>
            </div>

            <button
              disabled={processingId === user.id || !user.email}
              onClick={() => onSendRecovery(user.id)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#5b15fc] bg-white px-3.5 py-2 text-xs font-semibold text-[#5b15fc] hover:bg-[#5b15fc]/5 shadow-xs cursor-pointer transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
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
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-200 pt-4">
          <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              disabled={isCurrentUser}
              onClick={() => {
                if (isCurrentUser) return;
                onClose();
                onDelete(user);
              }}
              title={isCurrentUser ? "You cannot delete your own logged-in administrator account" : "Soft Delete Account"}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 sm:py-2 text-xs font-semibold shadow-xs transition-all whitespace-nowrap ${
                isCurrentUser
                  ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed opacity-60"
                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
              }`}
            >
              <Trash2 className="size-3.5 shrink-0" />
              <span>Soft Delete Account</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all whitespace-nowrap"
            >
              <Edit2 className="size-3.5 shrink-0" />
              <span>Edit Account</span>
            </button>
          </div>

          <button
            disabled={processingId === user.id || isCurrentUser}
            onClick={() => {
              if (isCurrentUser) return;
              onToggleActive(user.id, user.is_active);
            }}
            title={isCurrentUser ? "You cannot deactivate your own logged-in administrator account" : user.is_active ? "Deactivate Account" : "Activate Account"}
            className={`w-full sm:w-auto rounded-xl px-4 py-2.5 sm:py-2 text-xs font-semibold shadow-xs transition-all whitespace-nowrap text-center ${
              isCurrentUser
                ? "border border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed opacity-60"
                : user.is_active
                ? "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 cursor-pointer"
                : "bg-[#5b15fc] text-white hover:bg-[#4d0ee0] cursor-pointer"
            }`}
          >
            {isCurrentUser ? "Logged In (Active)" : user.is_active ? "Deactivate Account" : "Activate Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
