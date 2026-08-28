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
  Pill,
  ShoppingBag,
  Calendar,
  Video,
  ShieldCheck,
  LayoutDashboard,
  Settings
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";

const QUICK_SEARCH_ITEMS = [
  { name: "Dashboard Overview", href: "/admin", icon: LayoutDashboard, group: "General" },
  { name: "Doctor Directory & Verification", href: "/admin/doctors", icon: Stethoscope, group: "Telemedicine" },
  { name: "Appointments Calendar", href: "/admin/appointments", icon: Calendar, group: "Telemedicine" },
  { name: "Live Video Consultations", href: "/admin/consultations", icon: Video, group: "Telemedicine" },
  { name: "Medicine Catalog (E-Pharmacy)", href: "/admin/pharmacy", icon: Pill, group: "E-Pharmacy" },
  { name: "Pharmacy Order Fulfillment", href: "/admin/orders", icon: ShoppingBag, group: "E-Pharmacy" },
  { name: "System Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck, group: "System" },
  { name: "System Settings", href: "/admin/settings", icon: Settings, group: "System" },
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
      <header className="flex h-14 items-center justify-between neo-card rounded-2xl px-4 z-20">
        {/* Brand & Home */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image
              src="/logo.svg"
              alt="MediTouch"
              width={120}
              height={32}
              className="h-7 w-auto object-contain"
              priority
            />
            <span className="rounded-full bg-[#5b15fc]/10 border border-[#5b15fc]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5b15fc]">
              Admin Portal
            </span>
          </Link>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 transition-all cursor-pointer shadow-xs"
          >
            <Search className="size-3.5 text-stone-400" />
            <span className="hidden md:inline font-medium">Quick search...</span>
            <kbd className="pointer-events-none hidden select-none rounded border border-stone-200 bg-white px-1.5 text-[10px] font-mono font-semibold text-stone-500 md:inline">
              ⌘K
            </kbd>
          </button>

          <button className="flex size-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-all cursor-pointer shadow-xs">
            <Bell className="size-4" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex size-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 md:hidden transition-all cursor-pointer shadow-xs"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </header>

      {/* ⌘K Search Command Palette Dialog */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 backdrop-blur-xs p-4 pt-20">
          <div className="w-full max-w-lg neo-card rounded-[22px] p-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2 flex-1">
                <Search className="size-4 text-stone-400" />
                <input
                  autoFocus
                  placeholder="Search modules, doctors, orders, medicines..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-stone-900 outline-hidden placeholder:text-stone-400"
                />
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        setSearchOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-[#5b15fc]/10 hover:text-[#5b15fc] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-stone-400">{item.group}</span>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-stone-400">
                  No matching modules found for &quot;{query}&quot;
                </div>
              )}
            </div>

            <div className="mt-3 border-t border-stone-200 pt-2 flex items-center justify-between text-[11px] text-stone-400">
              <span>Press <kbd className="font-mono bg-stone-100 border border-stone-200 px-1 rounded">ESC</kbd> to close</span>
              <span>MediTouch Command Center</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex bg-stone-900/40 backdrop-blur-xs md:hidden">
          <div className="w-72 bg-[#F7F4EE] p-3 h-full overflow-y-auto neo-card rounded-r-[22px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">Navigation</span>
              <button onClick={() => setMobileNavOpen(false)} className="p-1 rounded-lg hover:bg-stone-200">
                <X className="size-4 text-stone-600" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
