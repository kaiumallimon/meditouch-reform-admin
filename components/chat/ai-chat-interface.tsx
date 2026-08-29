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
  AlertTriangle,
  CheckCircle2,
  Pill,
  Shield,
  Loader2,
  Database,
  History,
  ChevronLeft,
  X,
  Stethoscope,
  Cloud,
  FileText,
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
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";

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
}: {
  defaultSessionType?: "USER" | "ADMIN";
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
    setAgentState("Thinking...");

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
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#FAF8F5] text-stone-900 font-sans">
      {/* Session History Sliding Drawer */}
      {showSessionsDrawer && (
        <div className="absolute inset-0 z-30 flex flex-col bg-white p-4 shadow-xl border-r border-stone-200 animate-in slide-in-from-left duration-200">
          <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
              <History className="h-4 w-4 text-[#5b15fc]" />
              <span>Conversation History</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={createNewSession}
                className="flex items-center gap-1 rounded-xl bg-[#5b15fc]/10 px-2.5 py-1.5 text-xs font-semibold text-[#5b15fc] hover:bg-[#5b15fc]/20 transition"
              >
                <Plus className="h-3 w-3" /> New
              </button>
              <button
                onClick={() => setShowSessionsDrawer(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {sessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                No past conversations. Start a new chat!
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setShowSessionsDrawer(false);
                  }}
                  className={`group flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                    activeSessionId === s.id
                      ? "bg-[#5b15fc]/10 font-semibold text-[#5b15fc] border border-[#5b15fc]/30"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-transparent"
                  }`}
                >
                  <div className="truncate pr-2">{s.title}</div>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-stone-400 hover:text-rose-500"
                    title="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-stone-200/80 bg-white px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSessionsDrawer(!showSessionsDrawer)}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition"
            title="View chat history"
          >
            <History className="h-3.5 w-3.5 text-[#5b15fc]" />
            <span className="hidden sm:inline">History</span>
          </button>
          <div className="flex items-center gap-1.5 pl-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-800">
              {userRole === "ADMIN" ? "Admin Command Mode" : "Clinical Assistant"}
            </span>
          </div>
        </div>

        <button
          onClick={createNewSession}
          className="flex items-center gap-1 rounded-lg bg-[#5b15fc] px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-[#4a0fd4] transition"
        >
          <Plus className="h-3 w-3" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Main Conversation Container with MessageScroller */}
      <MessageScrollerProvider>
        <MessageScroller className="flex-1">
          <MessageScrollerViewport className="p-4">
            <MessageScrollerContent>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5b15fc]/10 text-[#5b15fc] shadow-xs border border-[#5b15fc]/20">
                    <Bot className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">
                    How can MediTouch AI assist you?
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-stone-500 leading-relaxed">
                    {userRole === "ADMIN"
                      ? "Execute platform management commands, look up Cloudinary CDN metrics, or search the complete catalog."
                      : "Search medicines, check live inventory & pricing, or ask for Over-The-Counter symptom guidance."}
                  </p>

                  <div className="mt-5 flex flex-col gap-2 w-full max-w-xs text-left">
                    <button
                      onClick={() => handleSendMessage("Search Napa Extra, check pricing, stock count, and adult dosage.")}
                      className="neo-button flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-stone-800 hover:border-[#5b15fc]/50 hover:bg-stone-50 transition"
                    >
                      <Pill className="h-4 w-4 text-[#5b15fc] shrink-0" />
                      <span className="font-medium">Check Napa Extra pricing & stock</span>
                    </button>
                    {userRole === "ADMIN" ? (
                      <button
                        onClick={() => handleSendMessage("Show me current Cloudinary CDN storage metrics and folder breakdown.")}
                        className="neo-button flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-stone-800 hover:border-[#5b15fc]/50 hover:bg-stone-50 transition"
                      >
                        <Cloud className="h-4 w-4 text-sky-600 shrink-0" />
                        <span className="font-medium">Query CDN Storage Breakdown</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendMessage("I have a mild headache and fever. What OTC medicine can I take?")}
                        className="neo-button flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-stone-800 hover:border-[#5b15fc]/50 hover:bg-stone-50 transition"
                      >
                        <Stethoscope className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">OTC Symptom Guidance</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.role === "user"}>
                    <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] space-y-2.5 rounded-2xl px-3.5 py-3 text-xs leading-relaxed ${
                          m.role === "user"
                            ? "bg-[#5b15fc] text-white rounded-br-xs shadow-sm font-medium"
                            : "bg-white text-stone-800 border border-stone-200/90 rounded-bl-xs shadow-xs"
                        }`}
                      >
                        {/* Tool Timeline Badges */}
                        {m.toolCalls && m.toolCalls.length > 0 && (
                          <div className="space-y-1 border-b border-stone-100 pb-2">
                            {m.toolCalls.map((tc, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1 font-mono text-[11px] text-stone-700 border border-stone-200"
                              >
                                <Database className="h-3 w-3 text-[#5b15fc] shrink-0" />
                                <span className="font-semibold">{tc.tool}</span>
                                <span className="ml-auto flex items-center">
                                  {tc.status === "RUNNING" ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Message Body */}
                        {m.role === "assistant" ? (
                          <MarkdownRenderer content={m.content} isStreaming={m.isStreaming} />
                        ) : (
                          <div className="whitespace-pre-wrap text-xs font-medium">{m.content}</div>
                        )}

                        {/* Interactive Medicine Cards */}
                        {m.medicineCards && m.medicineCards.length > 0 && (
                          <div className="grid grid-cols-1 gap-2 pt-1">
                            {m.medicineCards.map((med, idx) => (
                              <div
                                key={idx}
                                className="neo-card flex items-start gap-2.5 rounded-xl p-2.5 bg-white border border-stone-200"
                              >
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-50 border border-stone-200">
                                  {med.image ? (
                                    <Image src={med.image} alt={med.brand} fill className="object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[#5b15fc]">
                                      <Pill className="h-5 w-5" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-stone-900 truncate text-xs">
                                      {med.brand}
                                    </h4>
                                    <span className="font-bold text-[#5b15fc] text-xs">
                                      ৳ {med.unit_price?.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-stone-500 truncate">
                                    {med.generic_name} ({med.strength})
                                  </p>
                                  <div className="mt-1 flex items-center justify-between text-[10px]">
                                    <span className="rounded bg-stone-100 px-1.5 py-0.5 font-medium text-stone-600">
                                      {med.dosage_form || "Tablet"}
                                    </span>
                                    <span
                                      className={`font-semibold ${
                                        med.in_stock !== false ? "text-emerald-600" : "text-rose-600"
                                      }`}
                                    >
                                      {med.in_stock !== false ? `In Stock (${med.stock_count || 100})` : "Out of Stock"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 2-Step Confirmation Alert Pill */}
                        {m.confirmationPrompt && (
                          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                              <span>Action Confirmation Required</span>
                            </div>
                            <p className="mt-1 text-[11px] text-amber-800/90 leading-relaxed">
                              {m.confirmationPrompt.prompt}
                            </p>
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                onClick={() => handleConfirmAction(m.confirmationPrompt!.token, true)}
                                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 shadow-xs transition"
                              >
                                Confirm Action
                              </button>
                              <button
                                onClick={() => handleConfirmAction(m.confirmationPrompt!.token, false)}
                                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </MessageScrollerItem>
                ))
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      {/* State Progress Banner */}
      {agentState && (
        <div className="flex items-center gap-1.5 border-t border-stone-200 bg-white px-4 py-1.5 text-[11px] font-mono text-[#5b15fc]">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Status: {agentState}</span>
        </div>
      )}

      {/* Prompt Input Box */}
      <div className="border-t border-stone-200 bg-white p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 rounded-xl border border-stone-200 bg-[#FAF8F5] px-3 py-2 focus-within:border-[#5b15fc] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5b15fc]/15 transition"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              userRole === "ADMIN"
                ? "Enter admin command or ask questions..."
                : "Search medicines, check pricing, symptoms..."
            }
            disabled={isStreaming}
            className="flex-1 bg-transparent text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5b15fc] text-white shadow-xs hover:bg-[#4a0fd4] transition disabled:opacity-40"
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
