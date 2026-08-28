"use client";

import * as React from "react";
import { useState } from "react";
import { Calendar, RefreshCw, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AppointmentsAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Telemedicine Appointments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor scheduled, active, and completed doctor-patient video consultations across rural hubs.
        </p>
      </div>

      <div className="rounded-4xl border border-border bg-card p-12 text-center shadow-xs">
        <Calendar className="size-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="font-heading text-base font-semibold text-foreground">Active Telemedicine Sessions</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          Appointments booked by rural patients automatically trigger ZEGOCLOUD video room token generation and bKash escrow settlement.
        </p>
      </div>
    </div>
  );
}

