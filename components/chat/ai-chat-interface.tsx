"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getAccessToken, getSession } from "@/lib/auth";
import {
  Bot,
  User,
  Send,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Pill,
  Shield,
  Loader2,
  Database,
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { toast } from "sonner";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";

interface MedicineCard {
  id?: string;
  brand: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  unit_price?: number;
  pack_size?: string;
  in_stock?: boolean;
  stock_count?: number;
  requires_prescription?: boolean;
  image?: string;
  manufacturer?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: Array<{ tool: string; args: any; status?: string }>;
  medicineCards?: MedicineCard[];
  confirmationPrompt?: {
    token: string;
    prompt: string;
    details: any;
  };
  isStreaming?: boolean;
}

interface Session {
  id: string;
  title: string;
  session_type: string;
  updated_at: string;
}

export function AIChatInterface({
  defaultSessionType = "ADMIN",
  isDrawerMode = false,
}: {
  defaultSessionType?: "USER" | "ADMIN";
  isDrawerMode?: boolean;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentState, setAgentState] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("USER");
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    const session = getSession();
    if (session?.role) {
      setUserRole(session.role);
    }
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    }
  }, [activeSessionId]);

  const fetchSessions = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSessions(data.data);
        if (data.data.length > 0 && !activeSessionId) {
          setActiveSessionId(data.data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const loaded: Message[] = data.data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolCalls: m.tool_calls,
        }));
        setMessages(loaded);
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  };

  const createNewSession = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/chat/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Conversation",
          session_type: defaultSessionType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions([data.data, ...sessions]);
        setActiveSessionId(data.data.id);
        setMessages([]);
        setShowSessionsDrawer(false);
        toast.success("New chat session started");
      }
    } catch (e) {
      toast.error("Failed to create session");
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setSessions(remaining);
        if (activeSessionId === sessionId) {
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
          } else {
            setActiveSessionId(null);
            setMessages([]);
          }
        }
        toast.success("Session deleted");
      }
    } catch (e) {
      toast.error("Failed to delete session");
    }
  };

  const handleSendMessage = async (textToSend?: string, confirmationToken?: string) => {
    const query = textToSend || input.trim();
    if (!query && !confirmationToken) return;

    if (!confirmationToken) {
      setInput("");
    }

    const token = getAccessToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const userMsgId = `user_${Date.now()}`;
    if (query) {
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: query },
      ]);
    }

    const assistantMsgId = `assistant_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        isStreaming: true,
        toolCalls: [],
        medicineCards: [],
      },
    ]);

    setIsStreaming(true);
    setAgentState("Connecting...");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query || "CONFIRM_ACTION",
          session_id: activeSessionId,
          confirmation_token: confirmationToken,
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "message";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.replace("event: ", "").trim();
            continue;
          }

          if (trimmed.startsWith("data: ")) {
            const rawData = trimmed.replace("data: ", "").trim();
            try {
              const data = JSON.parse(rawData);

              if (currentEvent === "session") {
                if (data.session_id) {
                  setActiveSessionId(data.session_id);
                  fetchSessions();
                }
              } else if (currentEvent === "state") {
                setAgentState(data.state);
              } else if (currentEvent === "tool_call") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          toolCalls: [
                            ...(msg.toolCalls || []),
                            { tool: data.tool, args: data.arguments, status: "RUNNING" },
                          ],
                        }
                      : msg
                  )
                );
              } else if (currentEvent === "tool_result") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          toolCalls: (msg.toolCalls || []).map((tc) =>
                            tc.tool === data.tool ? { ...tc, status: data.status } : tc
                          ),
                        }
                      : msg
                  )
                );
              } else if (currentEvent === "medicine_cards") {
                if (Array.isArray(data.medicines)) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, medicineCards: data.medicines }
                        : msg
                    )
                  );
                }
              } else if (currentEvent === "confirmation_required") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          confirmationPrompt: {
                            token: data.token,
                            prompt: data.prompt,
                            details: data.details,
                          },
                        }
                      : msg
                  )
                );
              } else if (currentEvent === "token") {
                if (data.delta) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: msg.content + data.delta }
                        : msg
                    )
                  );
                }
              } else if (currentEvent === "done") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
                  )
                );
                setAgentState(null);
                setIsStreaming(false);
              }
            } catch (jsonErr) {}
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Streaming interrupted");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: msg.content + "\n\n⚠️ *Communication error with backend AI agent.*",
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setAgentState(null);
    }
  };

  const handleConfirmAction = (token: string, confirmed: boolean) => {
    if (confirmed) {
      handleSendMessage("Confirmed. Proceed with operation.", token);
    } else {
      toast.info("Action cancelled");
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          confirmationPrompt: undefined,
        }))
      );
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Session History Sliding Drawer (for compact floating side panel) */}
      {showSessionsDrawer && (
        <div className="absolute inset-0 z-30 flex flex-col bg-slate-900/98 p-4 backdrop-blur-xl animate-in slide-in-from-left duration-200 border-r border-slate-800">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <History className="h-4 w-4 text-teal-400" />
              <span>Conversations</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={createNewSession}
                className="flex items-center gap-1 rounded-lg bg-teal-500/20 px-2 py-1 text-[11px] font-medium text-teal-300 hover:bg-teal-500/30"
              >
                <Plus className="h-3 w-3" /> New
              </button>
              <button
                onClick={() => setShowSessionsDrawer(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {sessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No chat history</div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setShowSessionsDrawer(false);
                  }}
                  className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${
                    activeSessionId === s.id
                      ? "bg-teal-500/15 font-medium text-teal-300 border border-teal-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <div className="truncate pr-2">{s.title}</div>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Conversation Container with MessageScroller */}
      <div className="flex flex-1 flex-col justify-between overflow-hidden">
        {/* Top Mini Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-3.5 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSessionsDrawer(!showSessionsDrawer)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              title="View conversation history"
            >
              <History className="h-4 w-4 text-teal-400" />
            </button>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-semibold text-slate-200">MediTouch AI</span>
            </div>
            <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-mono text-teal-300 border border-teal-500/20">
              {userRole === "ADMIN" ? "ADMIN" : "PATIENT"}
            </span>
          </div>

          <button
            onClick={createNewSession}
            className="flex items-center gap-1 rounded-lg bg-teal-500/15 px-2 py-1 text-[11px] font-medium text-teal-300 hover:bg-teal-500/25 transition"
          >
            <Plus className="h-3 w-3" />
            <span>New</span>
          </button>
        </div>

        {/* MessageScroller Component */}
        <MessageScrollerProvider>
          <MessageScroller className="flex-1">
            <MessageScrollerViewport className="p-3.5">
              <MessageScrollerContent>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shadow-md">
                      <Bot className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">
                      MediTouch Intelligent Assistant
                    </h3>
                    <p className="mt-1 max-w-xs text-[11px] text-slate-400">
                      {userRole === "ADMIN"
                        ? "Execute admin commands, query CDN metrics, or search the complete medicine catalog."
                        : "Ask about medicines, live prices, stock, or clinical Over-The-Counter symptom guidance."}
                    </p>

                    <div className="mt-4 flex flex-col gap-2 w-full max-w-xs text-left">
                      <button
                        onClick={() => handleSendMessage("Search Napa Extra, check pricing, stock count, and adult dosage.")}
                        className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-[11px] text-slate-300 hover:border-teal-500/40 hover:bg-slate-900 transition"
                      >
                        💊 Check Napa Extra pricing & monograph
                      </button>
                      {userRole === "ADMIN" ? (
                        <button
                          onClick={() => handleSendMessage("Show me current Cloudinary CDN storage metrics and folder breakdown.")}
                          className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-[11px] text-slate-300 hover:border-teal-500/40 hover:bg-slate-900 transition"
                        >
                          ☁️ Query CDN Storage Breakdown
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendMessage("I have a mild headache and fever. What OTC medicine can I take?")}
                          className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-[11px] text-slate-300 hover:border-teal-500/40 hover:bg-slate-900 transition"
                        >
                          🩺 OTC Symptom Guidance
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.role === "user"}>
                      <div className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        {m.role === "assistant" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] space-y-2.5 rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            m.role === "user"
                              ? "bg-teal-600 text-white rounded-br-none shadow-md"
                              : "bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-bl-none shadow-sm"
                          }`}
                        >
                          {/* Tool Timeline Badges */}
                          {m.toolCalls && m.toolCalls.length > 0 && (
                            <div className="space-y-1 border-b border-slate-800 pb-2">
                              {m.toolCalls.map((tc, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1.5 rounded-md bg-slate-950/80 px-2 py-1 font-mono text-[10px] text-teal-300 border border-slate-800/60"
                                >
                                  <Database className="h-2.5 w-2.5 text-teal-400 shrink-0" />
                                  <span className="font-semibold">{tc.tool}</span>
                                  <span className="ml-auto">
                                    {tc.status === "RUNNING" ? (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-400" />
                                    ) : (
                                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Markdown text body */}
                          <div className="whitespace-pre-wrap font-sans text-xs">
                            {m.content}
                            {m.isStreaming && (
                              <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-teal-400" />
                            )}
                          </div>

                          {/* Visual Medicine Cards */}
                          {m.medicineCards && m.medicineCards.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 pt-1">
                              {m.medicineCards.map((med, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950 p-2.5"
                                >
                                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-900 border border-slate-800">
                                    {med.image ? (
                                      <Image src={med.image} alt={med.brand} fill className="object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-teal-400">
                                        <Pill className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-semibold text-slate-100 truncate text-[11px]">
                                        {med.brand}
                                      </h4>
                                      <span className="font-semibold text-teal-300 text-[11px]">
                                        ৳ {med.unit_price?.toFixed(2)}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 truncate">
                                      {med.generic_name} ({med.strength})
                                    </p>
                                    <div className="mt-1 flex items-center justify-between text-[9px]">
                                      <span className="rounded bg-teal-500/10 px-1 py-0.2 text-teal-300">
                                        {med.dosage_form || "Tablet"}
                                      </span>
                                      <span className={med.in_stock !== false ? "text-emerald-400" : "text-rose-400"}>
                                        {med.in_stock !== false ? `In Stock (${med.stock_count || 100})` : "Out of Stock"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 2-Step Confirmation Pill */}
                          {m.confirmationPrompt && (
                            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-amber-200">
                              <div className="flex items-center gap-1.5 font-medium text-[11px] text-amber-300">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                                <span>Action Confirmation</span>
                              </div>
                              <p className="mt-1 text-[10px] text-amber-100/90 leading-relaxed">
                                {m.confirmationPrompt.prompt}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => handleConfirmAction(m.confirmationPrompt!.token, true)}
                                  className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-slate-950 hover:bg-amber-400"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleConfirmAction(m.confirmationPrompt!.token, false)}
                                  className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {m.role === "user" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-teal-600/20 border border-teal-500/30 text-teal-300">
                            <User className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    </MessageScrollerItem>
                  ))
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        {/* State Status Bar */}
        {agentState && (
          <div className="flex items-center gap-1.5 border-t border-slate-900 bg-slate-950 px-4 py-1 text-[10px] text-teal-400 font-mono">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            <span>Agent: {agentState}</span>
          </div>
        )}

        {/* Prompt Input Area */}
        <div className="border-t border-slate-800/80 bg-slate-900/50 p-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 focus-within:border-teal-500/50"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={userRole === "ADMIN" ? "Ask or execute admin commands..." : "Search medicines or ask symptoms..."}
              disabled={isStreaming}
              className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500 text-slate-950 transition hover:bg-teal-400 disabled:opacity-40"
            >
              {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
