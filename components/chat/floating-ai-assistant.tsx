"use client";

import React, { useState } from "react";
import { Bot, Sparkles, X, Maximize2, Minimize2 } from "lucide-react";
import { AIChatInterface } from "@/components/chat/ai-chat-interface";
import { getSession } from "@/lib/auth";

export function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const session = getSession();
  const userRole = session?.role || "USER";

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 rounded-full border-2 border-stone-800 bg-[#5b15fc] px-4 py-3 text-white shadow-[4px_4px_0px_#000000] transition-all hover:scale-105 hover:bg-[#4a0fd4] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000]"
          aria-label="Open MediTouch AI Assistant"
        >
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white">
            <Bot className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
          </div>
          <div className="text-left pr-0.5">
            <div className="flex items-center gap-1 text-xs font-bold tracking-wide text-white">
              <span>MediTouch AI</span>
              <Sparkles className="h-3 w-3 text-amber-300" />
            </div>
            <p className="text-[10px] text-white/80 font-medium">
              {userRole === "ADMIN" ? "Admin Assistant" : "Health Assistant"}
            </p>
          </div>
        </button>
      )}

      {/* Floating Side Drawer Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border-2 border-stone-800 bg-white shadow-[6px_6px_0px_rgba(0,0,0,0.15)] transition-all duration-300 animate-in slide-in-from-right ${
            isExpanded
              ? "inset-x-3 bottom-3 top-14 sm:inset-auto sm:right-4 sm:bottom-4 sm:top-14 sm:w-[640px] sm:h-[calc(100vh-5rem)]"
              : "inset-x-2 bottom-2 top-14 sm:inset-auto sm:right-4 sm:bottom-4 sm:top-auto sm:w-[440px] sm:h-[620px] md:h-[660px]"
          }`}
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between border-b-2 border-stone-800 bg-[#5b15fc] px-4 py-2.5 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  MediTouch AI Assistant
                </h3>
                <span className="text-[10px] text-white/80 font-medium">
                  {userRole === "ADMIN" ? "Admin Command Console" : "Clinical Assistant"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-lg p-1.5 hover:bg-white/20 hover:text-white transition"
                title={isExpanded ? "Collapse width" : "Expand width"}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/20 hover:text-white transition"
                title="Close AI Assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Embedded Chat Canvas */}
          <div className="flex-1 overflow-hidden">
            <AIChatInterface
              defaultSessionType={userRole === "ADMIN" ? "ADMIN" : "USER"}
            />
          </div>
        </div>
      )}
    </>
  );
}
