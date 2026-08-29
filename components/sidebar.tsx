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
  AlertTriangle,
  Cloud,
  Users,
  Code2
} from "lucide-react";
import { toast } from "sonner";

const mainNavigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "User Accounts", href: "/admin/users", icon: Users },
];

const developerNavigation = [
  { name: "API Docs & SDKs", href: "/admin/docs", icon: Code2, badge: "SDK" },
];

const telemedicineNavigation = [
  { name: "Doctors", href: "/admin/doctors", icon: UserCheck },
  { name: "Appointments", href: "/admin/appointments", icon: Calendar },
  { name: "Consultations", href: "/admin/consultations", icon: Video },
];

const pharmacyNavigation = [
  { name: "Medicine Catalog", href: "/admin/pharmacy", icon: Pill },
  { name: "Orders & Delivery", href: "/admin/orders", icon: ShoppingBag },
];

const systemNavigation = [
  { name: "CDN Storage", href: "/admin/cdn", icon: Cloud },
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

  const isRouteActive = (itemHref: string) => {
    if (!pathname) return false;
    if (itemHref === "/admin") {
      return pathname === "/admin";
    }
    if (pathname === itemHref || pathname.startsWith(`${itemHref}/`)) {
      return true;
    }
    if (itemHref === "/admin/pharmacy" && (pathname === "/admin/epharmacy" || pathname.startsWith("/admin/epharmacy/"))) {
      return true;
    }
    return false;
  };

  return (
    <>
      <aside className="flex h-full w-60 flex-col neo-card rounded-[22px] bg-white">
        {/* Admin Profile Card */}
        <div className="border-b border-stone-200/80 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#5b15fc] text-xs font-bold text-white shadow-xs overflow-hidden ring-1 ring-stone-200">
                {(user as any)?.avatar_url ? (
                  <img src={(user as any).avatar_url} alt={fullName} className="size-full object-cover rounded-full" />
                ) : (
                  initials
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="truncate text-xs font-bold text-stone-900">
                  {fullName}
                </p>
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-1.5 py-0.2 text-[9px] font-bold text-[#5b15fc] font-mono">
                  ADMIN
                </span>
              </div>
              <p className="mt-0.5 truncate text-[10px] font-medium text-stone-500">
                {user?.email || "Platform Admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {user?.role === "DEVELOPER" ? (
            /* Developer Exclusive Navigation */
            <div>
              <div className="flex items-center justify-between px-3 mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Developer Portal
                </p>
                <span className="rounded bg-indigo-100/80 text-indigo-700 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                  API & SDK
                </span>
              </div>
              <nav className="space-y-1">
                {developerNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = isRouteActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center justify-between rounded-full px-3.5 py-2 text-xs transition-all group",
                        isActive
                          ? "bg-[#5b15fc] text-white font-semibold shadow-xs"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-tight",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:bg-indigo-100"
                        )}
                      >
                        {item.badge}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : (
            /* Administrator Full Navigation */
            <>
              {/* Main Section */}
              <nav className="space-y-1">
                {mainNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = isRouteActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-full px-3.5 py-2 text-xs transition-all",
                        isActive
                          ? "bg-[#5b15fc] text-white font-semibold shadow-xs"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Developer / API Section */}
              <div>
                <div className="flex items-center justify-between px-3 mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Developer Hub
                  </p>
                  <span className="rounded bg-indigo-100/80 text-indigo-700 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                    API & SDK
                  </span>
                </div>
                <nav className="space-y-1">
                  {developerNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center justify-between rounded-full px-3.5 py-2 text-xs transition-all group",
                          isActive
                            ? "bg-[#5b15fc] text-white font-semibold shadow-xs"
                            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-4 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-tight",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:bg-indigo-100"
                          )}
                        >
                          {item.badge}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Telemedicine Section */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Telemedicine
                </p>
                <nav className="space-y-1">
                  {telemedicineNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 rounded-full px-3.5 py-2 text-xs transition-all",
                          isActive
                            ? "bg-[#5b15fc] text-white font-semibold shadow-xs"
                            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium"
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
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  E-Pharmacy
                </p>
                <nav className="space-y-1">
                  {pharmacyNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 rounded-full px-3.5 py-2 text-xs transition-all",
                          isActive
                            ? "bg-[#5b15fc] text-white font-semibold shadow-xs"
                            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium"
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
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  System
                </p>
                <nav className="space-y-1">
                  {systemNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 rounded-full px-3.5 py-2 text-xs transition-all",
                          isActive
                            ? "bg-[#5b15fc] text-white font-semibold shadow-xs"
                            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </>
          )}
        </div>

        {/* Footer / Sign Out Button for Admin Sidebar */}
        <div className="border-t border-stone-200/80 p-3">
          <button
            onClick={() => setOpenSignOutModal(true)}
            className="flex w-full items-center gap-2.5 rounded-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      {openSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm neo-card rounded-[22px] p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-normal text-stone-900">Sign Out</h3>
                <p className="text-xs text-stone-500">Are you sure you want to end your session?</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setOpenSignOutModal(false)}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-full bg-rose-600 text-white px-4 py-2 text-xs font-semibold hover:bg-rose-700 shadow-xs cursor-pointer transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
