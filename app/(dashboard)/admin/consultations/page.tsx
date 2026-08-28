"use client";

import * as React from "react";
import { Video } from "lucide-react";

export default function ConsultationsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
          Video Consultations (ZEGOCLOUD)
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Real-time video session health, HMAC dynamic token issuance, and live prescription records.
        </p>
      </div>

      <div className="neo-card rounded-[22px] p-12 text-center bg-white">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/20 mx-auto mb-3">
          <Video className="size-7" />
        </div>
        <h3 className="font-heading text-lg font-normal text-stone-900">ZEGOCLOUD Gateway Engine</h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
          Dynamic room access tokens are encrypted using HMAC-SHA256 signature algorithm and automatically revoked upon consultation termination.
        </p>
      </div>
    </div>
  );
}
