"use client";

import * as React from "react";
import { createContext, useContext, useState } from "react";
import { Check, AlertTriangle, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionnaireContextType {
  selectedValue: string | null;
  setSelectedValue: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const QuestionnaireContext = createContext<QuestionnaireContextType | null>(null);

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);
  if (!context) {
    throw new Error("useQuestionnaire must be used within a Questionnaire");
  }
  return context;
}

export interface QuestionnaireProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Questionnaire({
  defaultValue,
  onConfirm,
  onCancel,
  className,
  children,
  ...props
}: QuestionnaireProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(defaultValue || "confirm");

  return (
    <QuestionnaireContext.Provider
      value={{
        selectedValue,
        setSelectedValue,
        onSubmit: onConfirm,
        onCancel,
      }}
    >
      <div
        className={cn(
          "rounded-2xl border-2 border-stone-800 bg-white p-4 shadow-[4px_4px_0px_#000000] text-stone-900",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </QuestionnaireContext.Provider>
  );
}

export function QuestionnaireHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start gap-2.5 pb-2.5 border-b border-stone-100", className)} {...props}>
      {children}
    </div>
  );
}

export function QuestionnaireTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4 className={cn("text-xs font-bold uppercase tracking-wider text-stone-900", className)} {...props}>
      {children}
    </h4>
  );
}

export function QuestionnaireDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-stone-600 leading-relaxed mt-1", className)} {...props}>
      {children}
    </p>
  );
}

export function QuestionnaireItem({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("py-2.5 space-y-2.5", className)} {...props}>
      {children}
    </div>
  );
}

export function QuestionnaireChoices({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid grid-cols-1 gap-2", className)} {...props}>
      {children}
    </div>
  );
}

export interface QuestionnaireChoiceProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  title: string;
  description?: string;
  isDestructive?: boolean;
}

export function QuestionnaireChoice({
  value,
  title,
  description,
  isDestructive = false,
  className,
  ...props
}: QuestionnaireChoiceProps) {
  const { selectedValue, setSelectedValue } = useQuestionnaire();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => setSelectedValue(value)}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all",
        isSelected
          ? isDestructive
            ? "border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-500/20"
            : "border-[#5b15fc] bg-[#5b15fc]/5 text-stone-900 ring-2 ring-[#5b15fc]/20"
          : "border-stone-200 bg-stone-50/60 text-stone-700 hover:bg-stone-100/80 hover:border-stone-300",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border mt-0.5 transition-colors",
          isSelected
            ? isDestructive
              ? "border-rose-600 bg-rose-600 text-white"
              : "border-[#5b15fc] bg-[#5b15fc] text-white"
            : "border-stone-300 bg-white"
        )}
      >
        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold leading-tight">{title}</div>
        {description && (
          <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">{description}</div>
        )}
      </div>
    </button>
  );
}

export function QuestionnaireActions({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-end gap-2 pt-3 border-t border-stone-100", className)} {...props}>
      {children}
    </div>
  );
}

export interface QuestionnaireSubmitProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  isDestructive?: boolean;
}

export function QuestionnaireSubmit({
  label = "Confirm & Apply",
  isDestructive = false,
  className,
  ...props
}: QuestionnaireSubmitProps) {
  const { onSubmit, selectedValue } = useQuestionnaire();

  return (
    <button
      type="button"
      onClick={onSubmit}
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all",
        isDestructive
          ? "bg-rose-600 hover:bg-rose-700 active:scale-95"
          : "bg-[#5b15fc] hover:bg-[#4a0fd4] active:scale-95",
        className
      )}
      {...props}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

export interface QuestionnaireCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function QuestionnaireCancel({
  label = "Cancel",
  className,
  ...props
}: QuestionnaireCancelProps) {
  const { onCancel } = useQuestionnaire();

  return (
    <button
      type="button"
      onClick={onCancel}
      className={cn(
        "flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all",
        className
      )}
      {...props}
    >
      <X className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}
