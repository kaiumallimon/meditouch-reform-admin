"use client";

import React from "react";
import { Sparkles, Database, Stethoscope, Search, ShieldCheck } from "lucide-react";

interface ThinkingIndicatorProps {
  stateText?: string | null;
}

export function ThinkingIndicator({ stateText }: ThinkingIndicatorProps) {
  const label = stateText || "Thinking...";

  // Pick an icon based on current state
  const getIcon = () => {
    const s = label.toLowerCase();
    if (s.includes("search") || s.includes("medicine") || s.includes("query")) {
      return <Search className="h-3.5 w-3.5 text-[#5b15fc] animate-pulse" />;
    }
    if (s.includes("database") || s.includes("execut") || s.includes("tool")) {
      return <Database className="h-3.5 w-3.5 text-[#5b15fc] animate-pulse" />;
    }
    if (s.includes("symptom") || s.includes("doctor") || s.includes("clinic")) {
      return <Stethoscope className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />;
    }
    return <Sparkles className="h-3.5 w-3.5 text-[#5b15fc] animate-spin" style={{ animationDuration: "3s" }} />;
  };

  return (
    <div className="flex flex-col gap-2 py-1 animate-in fade-in duration-300">
      {/* Dynamic Thinking Capsule */}
      <div className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/70 to-emerald-50/50 border border-purple-200/70 px-3.5 py-2 shadow-xs backdrop-blur-xs">
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-white shadow-xs border border-purple-100">
          {getIcon()}
        </div>

        <span className="text-xs font-semibold text-stone-800 tracking-wide">
          {label}
        </span>

        {/* 3 Bouncing Gradient Glow Dots */}
        <div className="flex items-center gap-1 pl-1">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#5b15fc] animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "900ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#7c3aed] animate-bounce"
            style={{ animationDelay: "180ms", animationDuration: "900ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: "360ms", animationDuration: "900ms" }}
          />
        </div>
      </div>

      {/* Shimmer Skeleton Lines */}
      <div className="space-y-1.5 pl-1 max-w-[220px]">
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 animate-pulse" />
        <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 animate-pulse delay-75" />
      </div>
    </div>
  );
}
