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
      </aside>
    </>
  );
}
