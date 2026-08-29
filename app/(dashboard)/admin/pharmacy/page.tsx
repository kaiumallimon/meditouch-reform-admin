"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Pill,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  Sparkles,
  Settings2,
  FolderTree,
  Building2,
  Activity,
  Play,
  Square,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  FileCode2,
  ShieldCheck,
  Zap,
  Radio,
  Trash2,
  Minus,
  Check
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";
import {
  pharmacyApi,
  MedicineItem,
  PharmacyStats,
  CrawlerSettings,
  CrawlerStatus
} from "@/lib/api";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getPaginationRange(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function PharmacyAdminPage() {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [stats, setStats] = useState<PharmacyStats | null>(null);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedRx, setSelectedRx] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Real-Time SSE & Crawler State
  const [crawlerStatus, setCrawlerStatus] = useState<CrawlerStatus | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCrawlerLogs, setShowCrawlerLogs] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [latestAddedDrug, setLatestAddedDrug] = useState<string | null>(null);
  const [crawlerSettings, setCrawlerSettings] = useState<CrawlerSettings>({
    api_base_url: "https://api.medeasy.health",
    next_data_base_url: "https://medeasy.health",
    session_id: "uWWQE90f364vl5aK7aV00",
    category_slug: "otc-medicine",
    category_name: "OTC Medicine",
    rate_limit_delay_seconds: 0.3,
    max_pages: null
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [triggeringCrawler, setTriggeringCrawler] = useState(false);

  // Table Row Selection & Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "single" | "bulk";
    id?: string;
    name?: string;
    count?: number;
  }>({
    open: false,
    type: "single",
  });
  const [deleting, setDeleting] = useState(false);

  // 3-State selection calculations for current page
  const currentPageIds = useMemo(
    () => medicines.map((m) => m.id || m.slug || "").filter(Boolean),
    [medicines]
  );

  const allSelectedOnPage =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.includes(id));

  const someSelectedOnPage =
    currentPageIds.some((id) => selectedIds.includes(id));

  const isIndeterminate = someSelectedOnPage && !allSelectedOnPage;

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOnPage = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const promptDeleteSingle = (med: MedicineItem) => {
    setDeleteModal({
      open: true,
      type: "single",
      id: med.id || med.slug,
      name: med.medicine_name || med.brand,
    });
  };

  const promptDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      open: true,
      type: "bulk",
      count: selectedIds.length,
    });
  };

  const executeDelete = async () => {
    try {
      setDeleting(true);
      if (deleteModal.type === "single" && deleteModal.id) {
        await pharmacyApi.deleteMedicine(deleteModal.id);
        toast.success(`"${deleteModal.name || "Medicine"}" deleted successfully`);
        setSelectedIds((prev) => prev.filter((id) => id !== deleteModal.id));
      } else if (deleteModal.type === "bulk" && selectedIds.length > 0) {
        const res = await pharmacyApi.deleteMedicinesBulk(selectedIds);
        toast.success(`Successfully deleted ${res.deleted_count || selectedIds.length} medicines`);
        setSelectedIds([]);
      }
      setDeleteModal({ open: false, type: "single" });
      await loadMedicines();
      await loadStatsAndCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete medicine");
    } finally {
      setDeleting(false);
    }
  };

  const terminalBoxRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Stats & Categories
  const loadStatsAndCategories = async () => {
    try {
      setStatsLoading(true);
      const [statsData, catsData, settingsData] = await Promise.all([
        pharmacyApi.getStats().catch(() => null),
        pharmacyApi.getCategories().catch(() => []),
        pharmacyApi.getCrawlerSettings().catch(() => null),
      ]);
      if (statsData) setStats(statsData);
      if (catsData) setCategories(catsData);
      if (settingsData) setCrawlerSettings(settingsData);
    } catch (err: any) {
      console.error("Stats load error:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // 2. Fetch Medicines with pagination & filters
  const loadMedicines = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sort_by: sortBy,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== "ALL") params.category = selectedCategory;
      if (selectedRx === "RX") params.requires_prescription = true;
      if (selectedRx === "OTC") params.requires_prescription = false;

      const data = await pharmacyApi.listMedicines(params);
      setMedicines(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      toast.error("Failed to load medicine catalog", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 3. Setup Persistent SSE Real-Time Stream (Persistent background execution)
  useEffect(() => {
    loadStatsAndCategories();
    loadMedicines();

    let eventSource: EventSource | null = null;
    let retryTimer: any = null;

    const connectSSE = () => {
      try {
        const streamUrl = `${API_BASE_URL}/pharmacy/crawler/stream`;
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setSseConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            if (!e.data || e.data.startsWith(":")) return;
            const event = JSON.parse(e.data);
            const { type, data } = event;

            if (type === "INIT") {
              if (data?.job) {
                setCrawlerStatus(data.job);
              }
            } else if (type === "CRAWL_STARTED") {
              setCrawlerStatus((prev) => ({
                ...(prev || {
                  category_slug: data.category_slug || "otc-medicine",
                  current_page: data.start_page || 1,
                  total_pages: 0,
                  total_products_found: 0,
                  inserted_count: 0,
                  skipped_count: 0,
                  failed_count: 0,
                  logs: [],
                }),
                is_running: true,
                status: "RUNNING",
                category_slug: data.category_slug,
                current_page: data.start_page || 1,
              }));
              setShowCrawlerLogs(true);
            } else if (type === "PAGE_STARTED") {
              setCrawlerStatus((prev) =>
                prev
                  ? {
                      ...prev,
                      current_page: data.current_page,
                      total_pages: data.total_pages,
                      total_products_found: data.total_products_found,
                      inserted_count: data.inserted_count ?? prev.inserted_count,
                      skipped_count: data.skipped_count ?? prev.skipped_count,
                    }
                  : null
              );
            } else if (type === "MEDICINE_INSERTED") {
              const med = data.medicine;
              if (med) {
                setLatestAddedDrug(`${med.medicine_name || med.brand} ${med.strength || ""}`.trim());
                // Live prepend into UI catalog grid
                setMedicines((prev) => {
                  const exists = prev.some((m) => m.slug === med.slug || m.id === med.id);
                  if (exists) return prev;
                  return [med, ...prev];
                });
              }
              setCrawlerStatus((prev) =>
                prev
                  ? {
                      ...prev,
                      inserted_count: data.inserted_count,
                      skipped_count: data.skipped_count ?? prev.skipped_count,
                      current_page: data.current_page ?? prev.current_page,
                      total_pages: data.total_pages ?? prev.total_pages,
                    }
                  : null
              );
              setStats((prev) =>
                prev
                  ? {
                      ...prev,
                      total_medicines: prev.total_medicines + 1,
                      in_stock_medicines: prev.in_stock_medicines + 1,
                    }
                  : null
              );
            } else if (type === "MEDICINE_SKIPPED") {
              setCrawlerStatus((prev) =>
                prev
                  ? {
                      ...prev,
                      skipped_count: data.skipped_count,
                      inserted_count: data.inserted_count ?? prev.inserted_count,
                    }
                  : null
              );
            } else if (type === "LOG") {
              if (data?.log) {
                setCrawlerStatus((prev) => {
                  if (!prev) return null;
                  const newLogs = [...(prev.logs || []), data.log];
                  return {
                    ...prev,
                    logs: newLogs.slice(-100),
                  };
                });
              }
            } else if (type === "COMPLETED" || type === "STOPPED" || type === "FAILED") {
              setCrawlerStatus((prev) =>
                prev
                  ? {
                      ...prev,
                      is_running: false,
                      status: type,
                      inserted_count: data.inserted_count ?? prev.inserted_count,
                      skipped_count: data.skipped_count ?? prev.skipped_count,
                    }
                  : null
              );
              loadStatsAndCategories();
            }
          } catch (err) {
            // Keepalive comment ignore
          }
        };

        eventSource.onerror = () => {
          setSseConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          retryTimer = setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        console.error("SSE connection error:", err);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  // Filter debounce reload
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMedicines();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedRx, sortBy, page, limit]);

  // Scroll internal console box without moving page window
  useEffect(() => {
    if (showCrawlerLogs && terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [crawlerStatus?.logs, showCrawlerLogs]);

  // Handlers
  const handleStartCrawler = async () => {
    try {
      setTriggeringCrawler(true);
      const status = await pharmacyApi.startCrawler({
        category_slug: crawlerSettings.category_slug,
        start_page: 1,
      });
      setCrawlerStatus(status);
      setShowCrawlerLogs(true);
      toast.success("MedEasy Crawler Launched", {
        description: `Ingesting category '${crawlerSettings.category_slug}' with real-time SSE stream.`,
      });
    } catch (err: any) {
      toast.error("Crawler start failed", { description: err.message });
    } finally {
      setTriggeringCrawler(false);
    }
  };

  const handleStopCrawler = async () => {
    try {
      const status = await pharmacyApi.stopCrawler();
      setCrawlerStatus(status);
      toast.info("Crawler Stop Requested");
    } catch (err: any) {
      toast.error("Failed to stop crawler", { description: err.message });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const updated = await pharmacyApi.updateCrawlerSettings(crawlerSettings);
      setCrawlerSettings(updated);
      setShowSettingsModal(false);
      toast.success("Crawler Settings Saved", {
        description: "API base URLs and session configurations updated successfully.",
      });
    } catch (err: any) {
      toast.error("Failed to save crawler settings", { description: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
              Medicine Catalog & Discovery
            </h1>
            {sseConnected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SSE Stream
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Comprehensive pharmaceutical database synchronized in real-time with MedEasy Bangladesh catalog.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {crawlerStatus?.is_running ? (
            <button
              onClick={handleStopCrawler}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 shadow-xs cursor-pointer transition-all"
            >
              <Square className="size-3.5 fill-rose-700" />
              <span>Stop Crawl</span>
            </button>
          ) : (
            <button
              onClick={handleStartCrawler}
              disabled={triggeringCrawler}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5b15fc] text-white px-4 py-2 text-xs font-bold neo-button shadow-[2px_2px_0px_0px_#1C1917] hover:bg-[#4d0ee0] disabled:opacity-50 cursor-pointer transition-all"
            >
              {triggeringCrawler ? (
                <Spinner className="size-3.5 text-white" />
              ) : (
                <Play className="size-3.5 fill-white" />
              )}
              <span>Run MedEasy Crawler</span>
            </button>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer"
          >
            <Settings2 className="size-3.5 text-stone-500" />
            <span>Crawler Settings</span>
          </button>

          <button
            onClick={() => {
              loadMedicines();
              loadStatsAndCategories();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top 5 Stat Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="neo-card rounded-2xl bg-white p-4 space-y-2 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Total Catalog
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc]">
              <Pill className="size-4" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-20 rounded-lg mt-0.5" />
          ) : (
            <p className="font-heading text-2xl font-normal text-stone-900">
              {(stats?.total_medicines || totalCount).toLocaleString()}
            </p>
          )}
          <p className="text-[10px] text-stone-500 flex items-center gap-1 font-medium">
            <span className="size-1.5 rounded-full bg-[#5b15fc]" />
            Indexed Drugs
          </p>
        </div>

        <div className="neo-card rounded-2xl bg-white p-4 space-y-2 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              In Stock
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-20 rounded-lg mt-0.5" />
          ) : (
            <p className="font-heading text-2xl font-normal text-stone-900">
              {(stats?.in_stock_medicines || 0).toLocaleString()}
            </p>
          )}
          <p className="text-[10px] text-emerald-700 font-medium">Available for Order</p>
        </div>

        <div className="neo-card rounded-2xl bg-white p-4 space-y-2 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Categories
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <FolderTree className="size-4" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-16 rounded-lg mt-0.5" />
          ) : (
            <p className="font-heading text-2xl font-normal text-stone-900">
              {(stats?.total_categories || categories.length).toLocaleString()}
            </p>
          )}
          <p className="text-[10px] text-stone-500 font-medium">Dosage Form Classifications</p>
        </div>

        <div className="neo-card rounded-2xl bg-white p-4 space-y-2 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Manufacturers
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="size-4" />
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-7 w-16 rounded-lg mt-0.5" />
          ) : (
            <p className="font-heading text-2xl font-normal text-stone-900">
              {(stats?.total_manufacturers || 0).toLocaleString()}
            </p>
          )}
          <p className="text-[10px] text-stone-500 font-medium">Pharma Companies</p>
        </div>

        <div className="neo-card rounded-2xl bg-white p-4 space-y-2 border border-stone-200 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Crawler Engine
            </span>
            <div className={`flex size-7 items-center justify-center rounded-lg ${
              crawlerStatus?.is_running ? "bg-[#5b15fc] text-white animate-pulse" : "bg-purple-50 text-purple-700 border border-purple-200"
            }`}>
              <Activity className="size-4" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${
              crawlerStatus?.is_running ? "bg-[#5b15fc] animate-ping" : "bg-emerald-500"
            }`} />
            <p className="font-heading text-lg font-normal text-stone-900 capitalize truncate">
              {crawlerStatus?.is_running ? "Crawling Live" : (crawlerStatus?.status || "Idle")}
            </p>
          </div>
          <button
            onClick={() => setShowCrawlerLogs(!showCrawlerLogs)}
            className="text-[10px] text-[#5b15fc] font-bold hover:underline cursor-pointer block"
          >
            {showCrawlerLogs ? "Hide Console Logs" : "View Live Console Logs"}
          </button>
        </div>
      </div>

      {/* Real-Time Live SSE Stream Banner & Progress */}
      {crawlerStatus?.is_running && (
        <div className="rounded-2xl border border-[#5b15fc]/30 bg-[#5b15fc]/5 p-4 sm:p-5 space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#5b15fc] text-white shadow-xs">
                <Sparkles className="size-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">
                    Live Crawling Category:
                  </h3>
                  <span className="font-mono text-[#5b15fc] bg-[#5b15fc]/10 px-2 py-0.5 rounded-md text-xs font-bold">
                    {crawlerStatus.category_slug}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.2 text-[9px] font-bold">
                    <span className="size-1 rounded-full bg-emerald-600 animate-ping" />
                    Live SSE Stream
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Page {crawlerStatus.current_page} of {crawlerStatus.total_pages || "..."} • Scanned {crawlerStatus.total_products_found} medicines
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold shadow-xs">
                <span className="text-emerald-700 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="size-3.5" /> {crawlerStatus.inserted_count} Inserted
                </span>
                <span className="text-stone-400">|</span>
                <span className="text-amber-700 flex items-center gap-1 font-bold">
                  <Info className="size-3.5" /> {crawlerStatus.skipped_count} Skipped
                </span>
              </div>
              <button
                onClick={handleStopCrawler}
                className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer shadow-xs"
              >
                Stop
              </button>
            </div>
          </div>

          {/* Live Added Medicine Beacon */}
          {latestAddedDrug && (
            <div className="flex items-center gap-2 text-xs bg-white/80 rounded-xl px-3 py-1.5 border border-[#5b15fc]/20 text-stone-800 animate-in fade-in">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-stone-500 font-medium shrink-0">Just added to DB:</span>
              <span className="font-bold text-[#5b15fc] truncate">{latestAddedDrug}</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#5b15fc] h-full transition-all duration-500 rounded-full"
              style={{
                width: crawlerStatus.total_pages > 0
                  ? `${Math.min(100, Math.round((crawlerStatus.current_page / crawlerStatus.total_pages) * 100))}%`
                  : "20%"
              }}
            />
          </div>
        </div>
      )}

      {/* Live Console Logs Drawer */}
      {showCrawlerLogs && (
        <div className="rounded-2xl border border-stone-800 bg-stone-950 p-4 space-y-2 text-stone-200 font-mono text-xs shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="size-3.5" />
              <span>Real-Time SSE Crawler Terminal Output</span>
            </div>
            <button
              onClick={() => setShowCrawlerLogs(false)}
              className="text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <div
            ref={terminalBoxRef}
            className="max-h-60 overflow-y-auto space-y-1 text-[11px] pr-2 scrollbar-thin"
          >
            {crawlerStatus?.logs && crawlerStatus.logs.length > 0 ? (
              crawlerStatus.logs.map((log, idx) => (
                <p key={idx} className="leading-relaxed">
                  <span className="text-stone-500 mr-1">$</span>
                  <span className={log.includes("Inserted") ? "text-emerald-400 font-semibold" : log.includes("Skipped") ? "text-amber-400" : log.includes("Error") || log.includes("Failed") ? "text-rose-400 font-bold" : "text-stone-300"}>
                    {log}
                  </span>
                </p>
              ))
            ) : (
              <p className="text-stone-500 italic">No crawler logs recorded yet. Start crawler to stream real-time events.</p>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 neo-card rounded-2xl bg-white p-3.5 border border-stone-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
          <input
            placeholder="Search by brand name, generic formulation, manufacturer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl pl-9 pr-4 text-xs font-medium text-stone-900 neo-input outline-hidden placeholder:text-stone-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Rx Filter */}
          <select
            value={selectedRx}
            onChange={(e) => {
              setSelectedRx(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 cursor-pointer shadow-xs outline-hidden"
          >
            <option value="ALL">All Prescription Types</option>
            <option value="OTC">OTC Only (No Rx)</option>
            <option value="RX">Prescription Required (Rx)</option>
          </select>

          {/* Server-Side Sort Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 shadow-xs">
            <ArrowUpDown className="size-3.5 text-stone-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="h-10 text-xs font-semibold text-stone-700 bg-transparent cursor-pointer outline-hidden pr-1"
            >
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="created_desc">Recently Added (Newest)</option>
              <option value="created_asc">First Added (Oldest)</option>
              <option value="manufacturer_asc">Manufacturer: A to Z</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1 shadow-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-[#5b15fc] shadow-xs font-bold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-[#5b15fc] shadow-xs font-bold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
              title="Table View"
            >
              <TableIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs (Wrapped) */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        <button
          onClick={() => {
            setSelectedCategory("ALL");
            setPage(1);
          }}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "ALL"
              ? "bg-[#5b15fc] text-white shadow-xs"
              : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
          }`}
        >
          All Medicines ({totalCount})
        </button>
        {categories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedCategory(cat.category);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.category
                ? "bg-[#5b15fc] text-white shadow-xs"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {cat.category} ({cat.count})
          </button>
        ))}
      </div>

      {/* Main Catalog View (Grid or Table) */}
      {loading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`pharmacy-grid-skeleton-${i}`}
                className="neo-card rounded-2xl bg-white border border-stone-200 overflow-hidden flex flex-col justify-between shadow-xs"
              >
                <Skeleton className="aspect-4/3 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-4/5 rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-2.5 w-12 rounded" />
                      <Skeleton className="h-5 w-20 rounded" />
                    </div>
                    <div className="flex gap-1">
                      <Skeleton className="h-7 w-14 rounded-lg" />
                      <Skeleton className="size-7 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="neo-card rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  <tr>
                    <th className="py-3 px-4 w-11">
                      <Skeleton className="size-4 rounded" />
                    </th>
                    <th className="py-3 px-4">Product Name & Formulation</th>
                    <th className="py-3 px-4">Dosage / Strength</th>
                    <th className="py-3 px-4">Manufacturer</th>
                    <th className="py-3 px-4">Unit Pricing</th>
                    <th className="py-3 px-4">Rx Required</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`pharmacy-table-skeleton-${i}`} className="hover:bg-stone-50/40">
                      <td className="py-3 px-4 w-11">
                        <Skeleton className="size-4 rounded" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-11 rounded-xl shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-3.5 w-36 rounded" />
                            <Skeleton className="h-3 w-24 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        <Skeleton className="h-3.5 w-20 rounded" />
                        <Skeleton className="h-4 w-14 rounded-md" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-3.5 w-28 rounded" />
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-2.5 w-12 rounded" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-5 w-12 rounded-full" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Skeleton className="h-7 w-12 rounded-lg" />
                          <Skeleton className="size-7 rounded-lg" />
                          <Skeleton className="size-7 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : medicines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 neo-card rounded-2xl bg-white border border-stone-200 text-center p-6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 border border-stone-200 mb-3">
            <Pill className="size-7" />
          </div>
          <h3 className="text-base font-bold text-stone-900">No Medicines Found</h3>
          <p className="text-xs text-stone-500 max-w-md mt-1 mb-4">
            No pharmaceutical products match your current search or category filter. Launch the crawler to populate catalog with real-time SSE stream.
          </p>
          <button
            onClick={handleStartCrawler}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5b15fc] text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-[#4d0ee0] cursor-pointer"
          >
            <Sparkles className="size-4" />
            <span>Launch MedEasy Crawler</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {medicines.map((med) => (
            <div
              key={med.id || med.slug}
              className="neo-card rounded-2xl bg-white border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
            >
              {/* Top Full-Bleed Image Frame (Clickable to details) */}
              <Link
                href={`/admin/pharmacy/${med.slug || med.id}`}
                className="relative aspect-4/3 w-full bg-stone-100 flex items-center justify-center overflow-hidden border-b border-stone-100 cursor-pointer group/img block"
              >
                {med.medicine_image ? (
                  <img
                    src={med.medicine_image}
                    alt={med.medicine_name || med.brand}
                    className="size-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    onError={(e: any) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="size-full flex items-center justify-center bg-stone-50">
                    <Pill className="size-10 text-stone-300" />
                  </div>
                )}

                {/* Redesigned Category Badge on top-left */}
                <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-stone-800 border border-stone-200/90 shadow-xs tracking-wide">
                    <span className="size-1.5 rounded-full bg-[#5b15fc]" />
                    {med.dosage_form || med.category_name || "Tablet"}
                  </span>
                </div>

                {/* Redesigned Rx/OTC Badge on top-right */}
                <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                  {med.rx_required ? (
                    <span className="inline-flex items-center rounded-lg bg-rose-500/95 text-white backdrop-blur-md px-2 py-0.5 text-[10px] font-bold shadow-xs tracking-wider">
                      Rx
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-lg bg-emerald-600/95 text-white backdrop-blur-md px-2 py-0.5 text-[10px] font-bold shadow-xs tracking-wider">
                      OTC
                    </span>
                  )}
                </div>
              </Link>

              {/* Card Body Info */}
              <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <Link
                      href={`/admin/pharmacy/${med.slug || med.id}`}
                      className="font-heading text-base font-normal text-stone-900 hover:text-[#5b15fc] transition-colors line-clamp-1 cursor-pointer"
                    >
                      {med.medicine_name || med.brand}
                    </Link>
                    {med.strength && (
                      <span className="text-[11px] font-bold text-stone-500 shrink-0">
                        {med.strength}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 line-clamp-1 italic font-medium">
                    {med.generic_name}
                  </p>
                  <p className="text-[11px] text-stone-400 line-clamp-1">
                    {med.manufacturer_name || med.manufacturer}
                  </p>
                </div>

                {/* Price & Action */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-stone-400 font-medium">Price</p>
                    <p className="font-bold text-stone-900 text-sm">
                      {formatCurrency(med.unit_price || 0)}
                    </p>
                  </div>

                  <Link
                    href={`/admin/pharmacy/${med.slug || med.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-[#5b15fc] hover:text-white transition-all shadow-xs cursor-pointer"
                  >
                    <span>Details</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="neo-card rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="py-3 px-4 w-11">
                    <button
                      type="button"
                      onClick={toggleSelectAllOnPage}
                      title={allSelectedOnPage ? "Deselect all on page" : "Select all on page"}
                      className={cn(
                        "flex size-4 items-center justify-center rounded border transition-all cursor-pointer",
                        allSelectedOnPage
                          ? "bg-[#5b15fc] border-[#5b15fc] text-white shadow-2xs"
                          : isIndeterminate
                          ? "bg-[#5b15fc] border-[#5b15fc] text-white shadow-2xs"
                          : "bg-white border-stone-300 hover:border-stone-400"
                      )}
                    >
                      {allSelectedOnPage ? (
                        <Check className="size-3 stroke-[3]" />
                      ) : isIndeterminate ? (
                        <Minus className="size-3 stroke-[3]" />
                      ) : null}
                    </button>
                  </th>
                  <th className="py-3 px-4">Product Name & Formulation</th>
                  <th className="py-3 px-4">Dosage / Strength</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4">Unit Pricing</th>
                  <th className="py-3 px-4">Rx Required</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {medicines.map((med) => {
                  const medKey = med.id || med.slug || "";
                  const isSelected = selectedIds.includes(medKey);
                  return (
                    <tr
                      key={medKey}
                      className={cn(
                        "transition-colors",
                        isSelected ? "bg-[#5b15fc]/5 hover:bg-[#5b15fc]/10" : "hover:bg-stone-50/70"
                      )}
                    >
                      <td className="py-3 px-4 w-11">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(medKey)}
                          title={`Select ${med.medicine_name || med.brand}`}
                          className={cn(
                            "flex size-4 items-center justify-center rounded border transition-all cursor-pointer",
                            isSelected
                              ? "bg-[#5b15fc] border-[#5b15fc] text-white shadow-2xs"
                              : "bg-white border-stone-300 hover:border-stone-400"
                          )}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-11 shrink-0 rounded-xl bg-stone-50 border border-stone-200 overflow-hidden p-1 flex items-center justify-center">
                            {med.medicine_image ? (
                              <img
                                src={med.medicine_image}
                                alt={med.medicine_name || med.brand}
                                className="max-h-full max-w-full object-contain mix-blend-multiply"
                              />
                            ) : (
                              <Pill className="size-5 text-stone-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/pharmacy/${med.slug || med.id}`}
                              className="font-bold text-stone-900 text-xs hover:text-[#5b15fc] transition-colors truncate block cursor-pointer"
                            >
                              {med.medicine_name || med.brand}
                            </Link>
                            <p className="text-[11px] text-stone-500 truncate">{med.generic_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        <span className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-bold">
                          {med.dosage_form || med.category_name}
                        </span>{" "}
                        {med.strength}
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-medium">
                        {med.manufacturer_name || med.manufacturer}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {formatCurrency(med.unit_price || 0)}
                        {med.pack_size && (
                          <span className="text-[10px] font-normal text-stone-400 block">
                            {med.pack_size}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {med.rx_required ? (
                          <span className="inline-flex rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">
                            Rx Required
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                            OTC Free
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/pharmacy/${med.slug || med.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5b15fc] hover:bg-[#5b15fc] hover:text-white transition-all shadow-2xs cursor-pointer"
                          >
                            <span>View</span>
                            <ExternalLink className="size-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => promptDeleteSingle(med)}
                            title="Delete medicine"
                            className="inline-flex size-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-2xs cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Pagination Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 neo-card rounded-2xl bg-white p-4 border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-stone-500 font-medium">
            Showing <strong className="text-stone-900">{totalCount > 0 ? (page - 1) * limit + 1 : 0}</strong> - <strong className="text-stone-900">{Math.min(page * limit, totalCount)}</strong> of <strong className="text-stone-900">{totalCount}</strong> medicines
          </p>

          <div className="flex items-center gap-1.5 text-xs text-stone-600 border-l border-stone-200 pl-3">
            <span className="text-[11px] font-medium text-stone-400">Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-lg border border-stone-200 bg-stone-50 px-2 text-xs font-bold text-stone-800 cursor-pointer shadow-2xs outline-hidden"
            >
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
              <option value={96}>96 per page</option>
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 cursor-pointer shadow-2xs transition-all"
            >
              <ChevronLeft className="size-3.5" />
              <span>Previous</span>
            </button>

            {getPaginationRange(page, totalPages).map((pItem, idx) => {
              if (pItem === "...") {
                return (
                  <span key={idx} className="px-2 py-1 text-xs text-stone-400 font-bold select-none">
                    ...
                  </span>
                );
              }
              const pageNum = Number(pItem);
              const isActive = pageNum === page;
              return (
                <button
                  key={idx}
                  onClick={() => setPage(pageNum)}
                  className={`min-w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#5b15fc] text-white shadow-xs"
                      : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 cursor-pointer shadow-2xs transition-all"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Crawler Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl neo-card rounded-[24px] bg-white p-6 sm:p-7 shadow-2xl space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#5b15fc]/10 text-[#5b15fc]">
                  <Settings2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-normal text-stone-900">Crawler Configuration</h3>
                  <p className="text-xs text-stone-500">Customize external API endpoints, build session ID, and rates</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  API Base URL (Catalog Products & Images)
                </label>
                <input
                  type="url"
                  required
                  value={crawlerSettings.api_base_url}
                  onChange={(e) =>
                    setCrawlerSettings({ ...crawlerSettings, api_base_url: e.target.value })
                  }
                  placeholder="https://api.medeasy.health"
                  className="h-9 w-full rounded-xl px-3 text-xs font-medium neo-input outline-hidden"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Used for category endpoints and full image resolution.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Next.js Data Base URL (Medicine Details Endpoint)
                </label>
                <input
                  type="url"
                  required
                  value={crawlerSettings.next_data_base_url}
                  onChange={(e) =>
                    setCrawlerSettings({ ...crawlerSettings, next_data_base_url: e.target.value })
                  }
                  placeholder="https://medeasy.health"
                  className="h-9 w-full rounded-xl px-3 text-xs font-medium neo-input outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Next.js Build Session ID
                  </label>
                  <input
                    type="text"
                    required
                    value={crawlerSettings.session_id}
                    onChange={(e) =>
                      setCrawlerSettings({ ...crawlerSettings, session_id: e.target.value })
                    }
                    placeholder="uWWQE90f364vl5aK7aV00"
                    className="h-9 w-full rounded-xl px-3 text-xs font-mono font-bold neo-input outline-hidden text-[#5b15fc]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Session build hash for Next.js data routing.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Target Category Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={crawlerSettings.category_slug}
                    onChange={(e) =>
                      setCrawlerSettings({ ...crawlerSettings, category_slug: e.target.value })
                    }
                    placeholder="otc-medicine"
                    className="h-9 w-full rounded-xl px-3 text-xs font-mono neo-input outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Rate Limit Delay (Seconds)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={crawlerSettings.rate_limit_delay_seconds}
                    onChange={(e) =>
                      setCrawlerSettings({
                        ...crawlerSettings,
                        rate_limit_delay_seconds: parseFloat(e.target.value) || 0.3,
                      })
                    }
                    className="h-9 w-full rounded-xl px-3 text-xs font-medium neo-input outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Max Pages Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={crawlerSettings.max_pages || ""}
                    onChange={(e) =>
                      setCrawlerSettings({
                        ...crawlerSettings,
                        max_pages: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="All Available Pages"
                    className="h-9 w-full rounded-xl px-3 text-xs font-medium neo-input outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#5b15fc] px-4 py-2 text-xs font-bold text-white hover:bg-[#4d0ee0] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? <Spinner className="size-3.5 text-white" /> : <CheckCircle2 className="size-3.5" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bulk Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl bg-stone-900/95 text-white px-5 py-3 shadow-2xl backdrop-blur-md border border-stone-700 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#5b15fc] text-[10px] font-bold text-white">
              {selectedIds.length}
            </span>
            <span>selected</span>
          </div>

          <div className="h-4 w-px bg-stone-700" />

          <button
            type="button"
            onClick={toggleSelectAllOnPage}
            className="text-xs text-stone-300 hover:text-white font-medium cursor-pointer"
          >
            {allSelectedOnPage ? "Deselect page" : "Select all on page"}
          </button>

          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-stone-400 hover:text-white font-medium cursor-pointer"
          >
            Clear
          </button>

          <div className="h-4 w-px bg-stone-700" />

          <button
            type="button"
            onClick={promptDeleteBulk}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex size-10 items-center justify-center rounded-full bg-rose-100 shrink-0">
                <Trash2 className="size-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-stone-900">
                  {deleteModal.type === "bulk" ? "Delete Selected Medicines?" : "Delete Medicine?"}
                </h3>
                <p className="text-xs text-stone-500">
                  This action will remove the record from MongoDB catalog.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-3 text-xs text-stone-700">
              {deleteModal.type === "bulk" ? (
                <p>
                  Are you sure you want to permanently delete <strong>{deleteModal.count}</strong> selected medicine(s)?
                </p>
              ) : (
                <p>
                  Are you sure you want to permanently delete <strong>{deleteModal.name}</strong>?
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModal({ open: false, type: "single" })}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleting ? <Spinner className="size-3.5 text-white" /> : <Trash2 className="size-3.5" />}
                <span>{deleting ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
