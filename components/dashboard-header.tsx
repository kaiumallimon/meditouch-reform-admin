"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Search,
  X,
  Stethoscope,
  UserCheck,
  Calendar,
  Pill,
  ShoppingBag,
  Activity,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";

const QUICK_SEARCH_ITEMS = [
  { name: "Dashboard Overview", href: "/admin", icon: Stethoscope, group: "Overview" },
  { name: "Doctor Verification Queue", href: "/admin/doctors", icon: UserCheck, group: "Telemedicine" },
  { name: "Appointments List", href: "/admin/appointments", icon: Calendar, group: "Telemedicine" },
  { name: "Medicine Inventory Catalog", href: "/admin/pharmacy", icon: Pill, group: "E-Pharmacy" },
  { name: "Pharmacy Orders", href: "/admin/orders", icon: ShoppingBag, group: "E-Pharmacy" },
  { name: "System Audit Logs", href: "/admin/audit-logs", icon: Activity, group: "System" },
];

export function DashboardHeader() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      setMobileNavOpen(false);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const filteredItems = QUICK_SEARCH_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.group.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <header className="flex h-14 items-center justify-between rounded-4xl border border-border bg-card px-4 shadow-xs">
        {/* Brand & Home */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="MediTouch"
              width={120}
              height={32}
              className="h-7 w-auto object-contain"
              priority
            />
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              Admin Portal
            </span>
          </Link>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-4xl px-3 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-3.5" />
            <span className="hidden md:inline text-xs">Search modules & pages...</span>
            <kbd className="pointer-events-none hidden select-none rounded-4xl border border-border bg-muted px-1.5 text-[10px] font-medium md:inline">
              ⌘K
            </kbd>
          </Button>

          <Button variant="ghost" size="icon" className="size-9 rounded-4xl text-muted-foreground">
            <Bell className="size-4" />
          </Button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex size-9 items-center justify-center rounded-4xl border border-border text-foreground transition-colors hover:bg-muted md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute top-0 right-0 flex h-full w-64 flex-col border-l border-border bg-card p-3 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3">
              <span className="font-heading text-sm font-semibold">MediTouch Admin</span>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="flex size-8 items-center justify-center rounded-4xl text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ⌘K Command Dialog */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-4xl border border-border bg-card p-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules, doctors, orders..."
                className="flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded-4xl p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
              {filteredItems.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No matching admin modules found.
                </p>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href);
                      setSearchOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-4xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="size-4 text-primary" />
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{item.group}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

