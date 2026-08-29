"use client";

import React, { useState } from "react";
import { Bot, Sparkles, X, Maximize2, Minimize2, ChevronRight } from "lucide-react";
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
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 rounded-full border border-teal-500/40 bg-slate-950/90 px-4 py-3 text-slate-100 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-teal-400 hover:shadow-teal-500/20 active:scale-95"
          aria-label="Open MediTouch AI Assistant"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 shadow-inner">
            <Bot className="h-4.5 w-4.5 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
          </div>
          <div className="text-left pr-1">
            <div className="flex items-center gap-1 text-xs font-semibold tracking-wide text-slate-100">
              <span>MediTouch AI</span>
              <Sparkles className="h-3 w-3 text-teal-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {userRole === "ADMIN" ? "Executive Assistant" : "Clinical Assistant"}
            </p>
          </div>
        </button>
      )}

      {/* Floating Side Drawer Panel */}
      {isOpen && (
        <div
          className={`fixed top-3 bottom-3 right-3 z-50 flex flex-col rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-in slide-in-from-right ${
            isExpanded ? "w-[620px]" : "w-[440px] max-w-[calc(100vw-1.5rem)]"
          }`}
        >
          {/* Top Panel Control Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2 bg-slate-900/80 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                MediTouch AI Assistant
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-slate-200 transition"
                title={isExpanded ? "Collapse width" : "Expand width"}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-rose-400 transition"
                title="Close AI Assistant"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Main Embedded Chat Canvas with MessageScroller */}
          <div className="flex-1 overflow-hidden">
            <AIChatInterface
              defaultSessionType={userRole === "ADMIN" ? "ADMIN" : "USER"}
              isDrawerMode={true}
            />
          </div>
        </div>
      )}
    </>
  );
}
