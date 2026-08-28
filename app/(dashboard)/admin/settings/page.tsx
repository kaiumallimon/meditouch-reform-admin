"use client";

import * as React from "react";
import { Settings, ShieldCheck, Database, CreditCard, Cloud } from "lucide-react";

export default function SettingsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
          System & Integration Settings
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Infrastructure configurations, platform fees, and external service health.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="neo-card rounded-[22px] p-6 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="size-5 text-[#5b15fc]" />
              <h3 className="font-heading text-base font-normal text-stone-900">Database Engine</h3>
            </div>
            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase">
              Online
            </span>
          </div>
          <p className="text-xs text-stone-500">MongoDB Database (Motor async driver on mongodb://localhost:27017)</p>
        </div>

        <div className="neo-card rounded-[22px] p-6 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CreditCard className="size-5 text-pink-600" />
              <h3 className="font-heading text-base font-normal text-stone-900">bKash Payment Gateway</h3>
            </div>
            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase">
              Sandbox Tokenized
            </span>
          </div>
          <p className="text-xs text-stone-500">Tokenized API v1.2.0-beta with auto-idempotency</p>
        </div>

        <div className="neo-card rounded-[22px] p-6 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cloud className="size-5 text-blue-600" />
              <h3 className="font-heading text-base font-normal text-stone-900">Cloudinary CDN</h3>
            </div>
            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase">
              Configured
            </span>
          </div>
          <p className="text-xs text-stone-500">Prescriptions, Doctor verification credentials & media uploads</p>
        </div>

        <div className="neo-card rounded-[22px] p-6 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-emerald-600" />
              <h3 className="font-heading text-base font-normal text-stone-900">Telemedicine Platform Fee</h3>
            </div>
            <span className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-xs font-mono font-bold text-stone-800">
              10.0%
            </span>
          </div>
          <p className="text-xs text-stone-500">Default platform commission rate deducted from doctor consultation fees</p>
        </div>
      </div>
    </div>
  );
}
