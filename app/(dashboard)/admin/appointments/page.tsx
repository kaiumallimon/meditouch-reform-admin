"use client";

import * as React from "react";
import { Calendar } from "lucide-react";

export default function AppointmentsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
          Telemedicine Appointments
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Monitor scheduled, active, and completed doctor-patient video consultations across rural healthcare centers.
        </p>
      </div>

      <div className="neo-card rounded-[22px] p-12 text-center bg-white">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/20 mx-auto mb-3">
          <Calendar className="size-7" />
        </div>
        <h3 className="font-heading text-lg font-normal text-stone-900">Active Telemedicine Queue</h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
          Appointments booked by rural patients automatically generate secure ZEGOCLOUD video room tokens and bKash digital payment escrows.
        </p>
      </div>
    </div>
  );
}
