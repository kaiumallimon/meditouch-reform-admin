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
  Stethoscope,
  ShieldCheck
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
      <aside className="flex h-full w-60 flex-col rounded-4xl border border-border bg-card shadow-xs">
        {/* Profile Card */}
        <div className="border-b border-border/60 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium leading-none">
                  {fullName}
                </p>
                <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                  Admin
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {user?.email || "Super Administrator"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {/* Main */}
          <div className="space-y-0.5">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-4xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="h-px bg-border/60" />

          {/* Telemedicine */}
          <div>
            <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Telemedicine
            </div>
            <div className="space-y-0.5">
              {telemedicineNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-4xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* E-Pharmacy */}
          <div>
            <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              E-Pharmacy
            </div>
            <div className="space-y-0.5">
              {pharmacyNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-4xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* System */}
          <div>
            <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              System
            </div>
            <div className="space-y-0.5">
              {systemNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-4xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer with Sign Out */}
        <div className="border-t border-border/60 p-3">
          <button
            onClick={() => setOpenSignOutModal(true)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-4xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Sign Out Modal Dialog */}
      {openSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-4xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h2 className="font-heading text-base font-semibold text-card-foreground">
              Sign out of MediTouch Admin
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Are you sure you want to end your current administrator session?
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setOpenSignOutModal(false)}
                className="inline-flex items-center justify-center rounded-4xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center justify-center rounded-4xl bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-destructive/90"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

