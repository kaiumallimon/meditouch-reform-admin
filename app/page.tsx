"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isAdmin } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated() && isAdmin()) {
      router.replace("/admin");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Redirecting to MediTouch...</p>
      </div>
    </div>
  );
}
