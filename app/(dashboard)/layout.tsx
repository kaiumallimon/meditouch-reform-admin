"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated, isStaff, isDeveloper } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard-header";
import { Sidebar } from "@/components/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { FloatingAIAssistant } from "@/components/chat/floating-ai-assistant";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated() || !isStaff()) {
      router.push("/login");
      return;
    }

    if (isDeveloper() && pathname !== "/admin/docs") {
      router.replace("/admin/docs");
      return;
    }

    setAuthorized(true);
  }, [router, pathname]);

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F4EE]">
        <div className="flex flex-col items-center gap-3 neo-card rounded-2xl p-6">
          <Spinner className="size-8 text-[#5b15fc]" />
          <p className="text-xs font-bold uppercase tracking-wider text-stone-800">
            {isDeveloper() ? "Authenticating Developer Workspace..." : "Authenticating Admin Workspace..."}
          </p>
        </div>
      </div>
    );
  }

  const isDocsPage = pathname === "/admin/docs" || isDeveloper();

  return (
    <div className="flex h-screen flex-col bg-[#F7F4EE] p-3">
      {/* Top Navigation Header */}
      <DashboardHeader />

      {/* Main Workspace Canvas */}
      <div className="flex flex-1 gap-3 overflow-hidden pt-3">
        {/* Left Sidebar - Hidden on docs page or for Developer */}
        {!isDocsPage && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}

        {/* Central Card Canvas */}
        <main className={`flex-1 overflow-hidden neo-card rounded-[22px] bg-white ${isDocsPage ? "p-0 flex flex-col" : "p-6 sm:p-8 overflow-y-auto"}`}>
          {children}
        </main>
      </div>

      {/* Floating AI Assistant on the Side */}
      <FloatingAIAssistant />
    </div>
  );
}
