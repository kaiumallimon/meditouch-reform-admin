"use client";

import * as React from "react";
import { Video, ShieldCheck, Stethoscope } from "lucide-react";

export default function ConsultationsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Video Consultations (ZEGOCLOUD)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time video session health, room token generation metrics, and prescription issuance logs.
        </p>
      </div>

      <div className="rounded-4xl border border-border bg-card p-12 text-center shadow-xs">
        <Video className="size-12 text-cyan-500/40 mx-auto mb-3" />
        <h3 className="font-heading text-base font-semibold text-foreground">ZEGOCLOUD Gateway Engine</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          Real-time room access tokens are dynamically verified with HMAC authentication and expired after call conclusion.
        </p>
      </div>
    </div>
  );
}

