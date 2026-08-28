"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getSession, clearSession } from "@/lib/auth";
import {
  LayoutDashboard,
  UserCheck,
  Calendar,
  Video,
  Pill,
  ShoppingBag,
  Activity,
  Settings,
  LogOut,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

const mainNavigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
];

const telemedicineNavigation = [
  { name: "Doctor Verification", href: "/admin/doctors", icon: UserCheck },
  { name: "Appointments", href: "/admin/appointments", icon: Calendar },
  { name: "Consultations", href: "/admin/consultations", icon: Video },
];

const pharmacyNavigation = [
  { name: "Medicine Catalog", href: "/admin/pharmacy", icon: Pill },
  { name: "Orders & Delivery", href: "/admin/orders", icon: ShoppingBag },
];

const systemNavigation = [
  { name: "Audit Logs", href: "/admin/audit-logs", icon: Activity },
  { name: "System Settings", href: "/admin/settings", icon: Settings },
];

export interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSignOutModal, setOpenSignOutModal] = useState(false);
  const [user, setUser] = useState<{ name: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
    }
  }, []);

  const fullName = user?.name || "Admin User";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = () => {
    clearSession();
    toast.success("Signed out successfully");
    router.push("/login");
  };

  return (
    <>
      <aside className="flex h-full w-60 flex-col neo-card rounded-[22px] bg-white">
        {/* Profile Card */}
        <div className="border-b border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#5b15fc] text-sm font-bold text-white shadow-[2px_2px_0px_0px_#1C1917] border border-stone-900">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border border-stone-900 bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold text-stone-900">
                  {fullName}
                </p>
              </div>
              <p className="mt-0.5 truncate text-[10px] font-medium text-stone-500">
                {user?.email || "Platform Admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Main Section */}
          <nav className="space-y-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-all",
                    isActive
                      ? "bg-[#5b15fc] text-white font-semibold shadow-xs"
                      : "text-stone-700 hover:bg-stone-100/80 hover:text-stone-900 font-medium"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Telemedicine Section */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Telemedicine
            </p>
            <nav className="space-y-1">
              {telemedicineNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-all",
                      isActive
                        ? "bg-[#5b15fc] text-white font-bold neo-button shadow-[2px_2px_0px_0px_#1C1917]"
                        : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 font-medium"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* E-Pharmacy Section */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              E-Pharmacy
            </p>
            <nav className="space-y-1">
              {pharmacyNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-all",
                      isActive
                        ? "bg-[#5b15fc] text-white font-bold neo-button shadow-[2px_2px_0px_0px_#1C1917]"
                        : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 font-medium"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* System Section */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              System
            </p>
            <nav className="space-y-1">
              {systemNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-all",
                      isActive
                        ? "bg-[#5b15fc] text-white font-bold neo-button shadow-[2px_2px_0px_0px_#1C1917]"
                        : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 font-medium"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer / Sign Out Button */}
        <div className="border-t border-stone-200 p-3">
          <button
            onClick={() => setOpenSignOutModal(true)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      {openSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm neo-card rounded-[22px] p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-300">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-stone-900">Sign Out</h3>
                <p className="text-xs text-stone-500">Are you sure you want to end your session?</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setOpenSignOutModal(false)}
                className="rounded-xl border border-stone-800 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-50 neo-button"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-xl border border-stone-900 bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 neo-button shadow-[2px_2px_0px_0px_#1C1917]"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
