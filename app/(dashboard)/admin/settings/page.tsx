"use client";

import * as React from "react";
import { Settings, ShieldCheck, Database, CreditCard, Cloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          System & Integration Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Infrastructure configurations, platform fees, and external service health.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-4xl border border-border bg-card p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="size-5 text-primary" />
              <h3 className="font-heading font-semibold text-foreground">Database Engine</h3>
            </div>
            <Badge variant="success">Online</Badge>
          </div>
          <p className="text-xs text-muted-foreground">MongoDB Atlas Cluster (Multi-region replica set)</p>
        </div>

        <div className="rounded-4xl border border-border bg-card p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CreditCard className="size-5 text-pink-500" />
              <h3 className="font-heading font-semibold text-foreground">bKash Payment Gateway</h3>
            </div>
            <Badge variant="success">Sandbox Verified</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Tokenized API v1.2.0-beta with auto-idempotency</p>
        </div>

        <div className="rounded-4xl border border-border bg-card p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cloud className="size-5 text-blue-500" />
              <h3 className="font-heading font-semibold text-foreground">Cloudinary CDN</h3>
            </div>
            <Badge variant="success">Configured</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Prescriptions, Doctor verification credentials & avatars</p>
        </div>

        <div className="rounded-4xl border border-border bg-card p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-emerald-500" />
              <h3 className="font-heading font-semibold text-foreground">Telemedicine Platform Fee</h3>
            </div>
            <Badge variant="outline">10.0%</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Default commission rate deducted from doctor consultation fees</p>
        </div>
      </div>
    </div>
  );
}

