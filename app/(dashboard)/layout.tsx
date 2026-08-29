"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isStaff } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard-header";
import { Sidebar } from "@/components/sidebar";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated() || !isStaff()) {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F4EE]">
        <div className="flex flex-col items-center gap-3 neo-card rounded-2xl p-6">
          <Spinner className="size-8 text-[#5b15fc]" />
          <p className="text-xs font-bold uppercase tracking-wider text-stone-800">Authenticating Admin Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#F7F4EE] p-3">
      {/* Top Navigation Header */}
      <DashboardHeader />

      {/* Main Workspace Canvas */}
      <div className="flex flex-1 gap-3 overflow-hidden pt-3">
        {/* Left Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Central Card Canvas */}
        <main className="flex-1 overflow-y-auto neo-card rounded-[22px] bg-white p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
