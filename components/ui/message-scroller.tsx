"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageScrollerContextType {
  isAtBottom: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  hasNewContent: boolean;
  setHasNewContent: React.Dispatch<React.SetStateAction<boolean>>;
}

const MessageScrollerContext = createContext<MessageScrollerContextType | null>(null);

export function useMessageScroller() {
  const context = useContext(MessageScrollerContext);
  if (!context) {
    throw new Error("useMessageScroller must be used within a MessageScrollerProvider");
  }
  return context;
}

export interface MessageScrollerProviderProps {
  children: React.ReactNode;
}

export function MessageScrollerProvider({ children }: MessageScrollerProviderProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewContent, setHasNewContent] = useState(false);

  const checkIfAtBottom = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return true;
    const threshold = 40; // 40px tolerance
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceToBottom <= threshold;
  }, []);

  const onScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    if (atBottom) {
      setHasNewContent(false);
    }
  }, [checkIfAtBottom]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
    setIsAtBottom(true);
    setHasNewContent(false);
  }, []);

  return (
    <MessageScrollerContext.Provider
      value={{
        isAtBottom,
        scrollToBottom,
        viewportRef,
        onScroll,
        hasNewContent,
        setHasNewContent,
      }}
    >
      {children}
    </MessageScrollerContext.Provider>
  );
}

export interface MessageScrollerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MessageScroller({ className, children, ...props }: MessageScrollerProps) {
  return (
    <div className={cn("relative flex h-full w-full flex-col overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

export interface MessageScrollerViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  autoScrollOnNewContent?: boolean;
}

export function MessageScrollerViewport({
  className,
  children,
  autoScrollOnNewContent = true,
  ...props
}: MessageScrollerViewportProps) {
  const { viewportRef, onScroll, isAtBottom, scrollToBottom, setHasNewContent } = useMessageScroller();
  const prevScrollHeightRef = useRef<number>(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      if (isAtBottom && autoScrollOnNewContent) {
        scrollToBottom("instant" as ScrollBehavior);
      } else if (!isAtBottom && el.scrollHeight > prevScrollHeightRef.current) {
        setHasNewContent(true);
      }
      prevScrollHeightRef.current = el.scrollHeight;
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [isAtBottom, autoScrollOnNewContent, scrollToBottom, setHasNewContent, viewportRef]);

  return (
    <div
      ref={viewportRef}
      onScroll={onScroll}
      className={cn("flex-1 overflow-y-auto overflow-x-hidden scroll-smooth", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface MessageScrollerContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MessageScrollerContent({ className, children, ...props }: MessageScrollerContentProps) {
  return (
    <div className={cn("flex min-h-full flex-col justify-end p-4 space-y-4", className)} {...props}>
      {children}
    </div>
  );
}

export interface MessageScrollerItemProps extends React.HTMLAttributes<HTMLDivElement> {
  messageId?: string;
  scrollAnchor?: boolean;
}

export function MessageScrollerItem({
  className,
  children,
  scrollAnchor = false,
  messageId,
  ...props
}: MessageScrollerItemProps) {
  const itemRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={itemRef}
      data-message-id={messageId}
      data-scroll-anchor={scrollAnchor}
      className={cn("w-full transition-opacity duration-200", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface MessageScrollerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function MessageScrollerButton({ className, ...props }: MessageScrollerButtonProps) {
  const { isAtBottom, scrollToBottom, hasNewContent } = useMessageScroller();

  if (isAtBottom) return null;

  return (
    <button
      type="button"
      onClick={() => scrollToBottom("smooth")}
      className={cn(
        "absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-teal-300 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-slate-800 active:scale-95",
        className
      )}
      {...props}
    >
      <ArrowDown className="h-3.5 w-3.5" />
      <span>Latest</span>
      {hasNewContent && (
        <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
      )}
    </button>
  );
}
