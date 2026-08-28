"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isAdmin } from "@/lib/auth";
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
    if (!isAuthenticated() || !isAdmin()) {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Authenticating MediTouch Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background p-3">
      {/* Header */}
      <DashboardHeader />

      {/* Main Workspace */}
      <div className="flex flex-1 gap-3 overflow-hidden pt-3">
        {/* Left Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Central Card Canvas */}
        <main className="flex-1 overflow-y-auto rounded-4xl border border-border bg-card shadow-xs">
          <div className="px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

