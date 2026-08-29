import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parseDate(dateStr: string | Date | undefined | null): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;

  let str = String(dateStr).trim();
  // If ISO string without timezone indicator, treat as UTC
  if (str.includes("T") && !str.endsWith("Z") && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str += "Z";
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateStr: string | Date | undefined | null): string {
  const d = parseDate(dateStr);
  if (!d) return "-";
  try {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateStr);
  }
}

export function formatRelativeTime(dateStr: string | Date | undefined | null): string {
  const d = parseDate(dateStr);
  if (!d) return "-";

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  if (diffSec < 90) return "1m ago";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d);
}

export function formatTime(dateStr: string | Date | undefined | null): string {
  const d = parseDate(dateStr);
  if (!d) return "-";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}


