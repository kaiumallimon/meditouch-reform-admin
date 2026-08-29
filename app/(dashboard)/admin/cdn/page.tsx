"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { mediaApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatDate, formatRelativeTime, formatTime } from "@/lib/utils";
import {
  Cloud,
  UploadCloud,
  Search,
  Filter,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Eye,
  FileText,
  Image as ImageIcon,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  Folder,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  X,
  AlertTriangle,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";

interface MediaAsset {
  id: string;
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  original_filename: string;
  folder: string;
  uploader_id?: string;
  created_at?: string;
}

interface CDNStats {
  total_assets: number;
  total_bytes: number;
  total_images: number;
  total_documents: number;
  storage_used_formatted: string;
  cloud_name: string;
  is_configured: boolean;
  folders: Array<{
    folder: string;
    count: number;
    bytes: number;
  }>;
}

const FOLDERS = [
  { label: "All Folders", value: "" },
  { label: "General Assets", value: "meditouch/general" },
  { label: "Doctor & User Profiles", value: "meditouch/profiles" },
  { label: "Doctor Credentials", value: "meditouch/doctors/documents" },
  { label: "Prescriptions", value: "meditouch/prescriptions" },
  { label: "Medicine Images", value: "meditouch/medicines" }
];

export default function AdminCDNPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [stats, setStats] = useState<CDNStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filter & Search states
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // View Mode: Grid (default) or Table
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Pagination states
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(24);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Interactive states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<MediaAsset | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Upload modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("meditouch/general");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await mediaApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to load CDN stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await mediaApi.listAssets({
        folder: selectedFolder || undefined,
        resource_type: selectedType || undefined,
        search: debouncedSearch || undefined,
        page,
        limit: rowsPerPage,
      });

      setAssets(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.total_pages || Math.ceil((res.total || 0) / rowsPerPage) || 1);
    } catch (err: any) {
      toast.error("Failed to load CDN assets", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [selectedFolder, selectedType, debouncedSearch, page, rowsPerPage]);

  const copyUrlToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("CDN URL copied to clipboard", {
      description: url,
      icon: <CheckCircle2 className="size-4 text-emerald-500" />,
    });
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return;
    try {
      setDeletingLoading(true);
      await mediaApi.deleteAsset(deletingAsset.id);
      toast.success("Asset deleted from Cloudinary CDN", {
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
      setDeletingAsset(null);
      await Promise.all([fetchAssets(), fetchStats()]);
    } catch (err: any) {
      toast.error("Failed to delete asset", { description: err.message });
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await mediaApi.uploadFile(file, uploadFolder);
      }
      toast.success(`${files.length} asset(s) uploaded to Cloudinary CDN!`, {
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
      setUploadModalOpen(false);
      await Promise.all([fetchAssets(), fetchStats()]);
    } catch (err: any) {
      toast.error("CDN upload failed", { description: err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-normal text-stone-900">
            Cloudinary CDN Storage & Media Manager
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Read, upload, inspect, copy direct URLs, and manage all cloud assets.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              fetchAssets();
              fetchStats();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all"
            title="Refresh CDN Storage"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-[#5b15fc]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5b15fc] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4d0ee0] shadow-xs cursor-pointer transition-all"
          >
            <UploadCloud className="size-4" />
            <span>Upload New Asset</span>
          </button>
        </div>
      </div>

      {/* 1. Independent Stat Cards Above */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Assets */}
        <div className="neo-card rounded-2xl p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total CDN Assets
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#5b15fc]/10 text-[#5b15fc]">
              <Cloud className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {statsLoading ? (
              <Skeleton className="h-7 w-16 rounded-lg mt-1" />
            ) : (
              <>
                <span className="font-heading text-2xl font-normal text-stone-900">
                  {stats?.total_assets || 0}
                </span>
                <span className="text-xs text-stone-500">Files</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Images, PDFs & doctor documents</p>
        </div>

        {/* Stat 2: Storage Used */}
        <div className="neo-card rounded-2xl p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Cloud Storage Used
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <HardDrive className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {statsLoading ? (
              <Skeleton className="h-7 w-20 rounded-lg mt-1" />
            ) : (
              <>
                <span className="font-heading text-2xl font-normal text-emerald-700">
                  {stats?.storage_used_formatted || "0 B"}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Active</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">High-availability CDN storage</p>
        </div>

        {/* Stat 3: Distribution (Images vs Docs) */}
        <div className="neo-card rounded-2xl p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Media Distribution
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Layers className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {statsLoading ? (
              <Skeleton className="h-7 w-32 rounded-lg mt-1" />
            ) : (
              <span className="font-heading text-xl font-normal text-stone-900">
                {`${stats?.total_images || 0} imgs • ${stats?.total_documents || 0} docs`}
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Prescriptions, BMDC certs & headshots</p>
        </div>

        {/* Stat 4: Cloud Status */}
        <div className="neo-card rounded-2xl p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              CDN Service Engine
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {statsLoading ? (
              <Skeleton className="h-7 w-28 rounded-lg mt-1" />
            ) : (
              <span className="font-heading text-lg font-normal text-stone-900 truncate">
                {stats?.cloud_name || "Cloudinary CDN"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">● SSL Encrypted & Edge-Cached</p>
        </div>
      </div>

      {/* 2. Main Content Card with Grid / Table Views */}
      <div className="neo-card rounded-[24px] bg-white p-5 sm:p-6 shadow-xs space-y-5">
        {/* Controls: Search, Folder Filter, Type Filter, View Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search assets by filename, folder, or public id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 text-xs text-stone-900 neo-input outline-hidden placeholder:text-stone-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Folder Select Dropdown */}
            <select
              value={selectedFolder}
              onChange={(e) => {
                setSelectedFolder(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-800 shadow-xs outline-hidden cursor-pointer hover:border-stone-300"
            >
              {FOLDERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Media Type Select */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-800 shadow-xs outline-hidden cursor-pointer hover:border-stone-300"
            >
              <option value="">All Resource Types</option>
              <option value="image">Images Only</option>
              <option value="raw">Documents / Raw</option>
            </select>

            {/* View Mode Switcher (Grid vs Table) */}
            <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-[#5b15fc] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-[#5b15fc] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="Table View"
              >
                <TableIcon className="size-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Grid / Table with Skeletons */}
        {loading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`cdn-grid-skeleton-${i}`}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs space-y-3"
                >
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <div className="flex items-center justify-between pt-1">
                      <Skeleton className="h-3 w-16 rounded" />
                      <Skeleton className="h-4 w-20 rounded-md" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-stone-100 pt-2.5">
                    <Skeleton className="h-7 w-20 rounded-lg" />
                    <div className="flex gap-1.5">
                      <Skeleton className="size-7 rounded-lg" />
                      <Skeleton className="size-7 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  <tr>
                    <th className="px-3 py-3 w-12 text-center">#</th>
                    <th className="px-4 py-3">Asset & Preview</th>
                    <th className="px-4 py-3">Folder</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`cdn-table-skeleton-${i}`} className="hover:bg-stone-50/40">
                      <td className="px-3 py-3 text-center">
                        <Skeleton className="h-4 w-5 mx-auto rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-10 rounded-lg shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-3.5 w-44 rounded" />
                            <Skeleton className="h-3 w-28 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-24 rounded-md" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-10 rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-14 rounded" />
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        <Skeleton className="h-3.5 w-16 rounded" />
                        <Skeleton className="h-3 w-12 rounded" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Skeleton className="h-7 w-14 rounded-lg" />
                          <Skeleton className="size-7 rounded-lg" />
                          <Skeleton className="size-7 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-3 border border-stone-200">
              <Cloud className="size-7" />
            </div>
            <p className="font-heading text-base font-normal text-stone-800">No CDN Assets Found</p>
            <p className="text-xs text-stone-500 max-w-sm mt-1">
              {debouncedSearch
                ? `No assets matched "${debouncedSearch}". Try another term.`
                : "No files uploaded to this folder yet. Click 'Upload New Asset' to add files."}
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#5b15fc] px-4 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer hover:bg-[#4d0ee0]"
            >
              <UploadCloud className="size-4" />
              <span>Upload First Asset</span>
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* ========================================================================= */
          /* 3. GRID VIEW (Default)                                                    */
          /* ========================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map((asset) => {
              const isImage =
                asset.resource_type === "image" ||
                ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(asset.format?.toLowerCase());

              return (
                <div
                  key={asset.id || asset.public_id}
                  className="group flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs transition-all hover:border-[#5b15fc]/40 hover:shadow-md"
                >
                  <div>
                    {/* Media Thumbnail Container */}
                    <div
                      onClick={() => setPreviewAsset(asset)}
                      className="relative aspect-video w-full overflow-hidden rounded-xl border border-stone-100 bg-stone-50 flex items-center justify-center cursor-pointer group-hover:opacity-95"
                    >
                      {isImage ? (
                        <img
                          src={asset.secure_url}
                          alt={asset.original_filename}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-stone-400 gap-1.5 p-3">
                          <FileText className="size-8 text-[#5b15fc]" />
                          <span className="text-[10px] font-mono uppercase font-bold text-stone-600">
                            {asset.format || "PDF"} Document
                          </span>
                        </div>
                      )}

                      {/* Format Badge */}
                      <span className="absolute top-2 left-2 rounded-md bg-stone-900/75 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase text-white backdrop-blur-xs">
                        {asset.format}
                      </span>

                      {/* Preview Overlay Icon */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Eye className="size-6 drop-shadow-md" />
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-bold text-stone-900 truncate" title={asset.original_filename}>
                        {asset.original_filename}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                        <span>{formatFileSize(asset.bytes)}</span>
                        {asset.created_at && (
                          <span className="text-[10px] text-stone-400">
                            {formatRelativeTime(asset.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="pt-0.5">
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] text-stone-600 truncate block max-w-full font-mono">
                          {asset.folder.replace("meditouch/", "")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5">
                    <button
                      onClick={() => copyUrlToClipboard(asset.secure_url, asset.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all"
                      title="Copy Secure CDN URL"
                    >
                      {copiedId === asset.id ? (
                        <>
                          <Check className="size-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3 text-stone-500" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <a
                        href={asset.secure_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                      <button
                        onClick={() => setDeletingAsset(asset)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete asset from CDN"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* 4. TABLE VIEW                                                             */
          /* ========================================================================= */
          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-3 py-3 w-12 text-center">#</th>
                  <th className="px-4 py-3">Asset & Preview</th>
                  <th className="px-4 py-3">Folder</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {assets.map((asset, idx) => {
                  const isImage =
                    asset.resource_type === "image" ||
                    ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(asset.format?.toLowerCase());

                  return (
                    <tr key={asset.id || asset.public_id} className="transition-colors hover:bg-stone-50/70">
                      {/* Index Column */}
                      <td className="px-3 py-3 text-center font-mono text-[11px] text-stone-400 font-medium">
                        {(page - 1) * rowsPerPage + idx + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => setPreviewAsset(asset)}
                            className="size-10 shrink-0 rounded-lg border border-stone-200 bg-stone-100 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80"
                          >
                            {isImage ? (
                              <img src={asset.secure_url} alt="" className="size-full object-cover" />
                            ) : (
                              <FileText className="size-5 text-[#5b15fc]" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-stone-900 truncate" title={asset.original_filename}>
                              {asset.original_filename}
                            </p>
                            <p className="text-[10px] font-mono text-stone-400 truncate">{asset.public_id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-mono">
                          {asset.folder}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono font-bold uppercase text-stone-700">{asset.format}</span>
                      </td>

                      <td className="px-4 py-3 font-mono text-stone-600">{formatFileSize(asset.bytes)}</td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-stone-800">
                          {formatRelativeTime(asset.created_at)}
                        </p>
                        <p className="text-[10px] font-mono text-stone-400">
                          {formatTime(asset.created_at)}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => copyUrlToClipboard(asset.secure_url, asset.id)}
                            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
                          >
                            {copiedId === asset.id ? "Copied" : "Copy"}
                          </button>
                          <a
                            href={asset.secure_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                          <button
                            onClick={() => setDeletingAsset(asset)}
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
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
        )}

        {/* ========================================================================= */}
        {/* 5. HERO UI SERVERSIDE PAGINATION                                          */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-stone-200 pt-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-stone-900">
                {totalCount === 0 ? 0 : (page - 1) * rowsPerPage + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-stone-900">
                {Math.min(page * rowsPerPage, totalCount)}
              </strong>{" "}
              of <strong className="text-stone-900">{totalCount}</strong> assets
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 text-[11px]">Assets per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-semibold text-stone-800 shadow-xs outline-hidden cursor-pointer"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      page === p
                        ? "bg-[#5b15fc] text-white shadow-xs"
                        : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 shadow-xs"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. UPLOAD MODAL (Write Feature)                                           */}
      {/* ========================================================================= */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg neo-card rounded-[24px] bg-white p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#5b15fc]/10 text-[#5b15fc]">
                  <UploadCloud className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-normal text-stone-900">Upload to Cloudinary CDN</h3>
                  <p className="text-xs text-stone-500">Securely route and store digital media</p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Folder Destination Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">
                Target CDN Destination Folder
              </label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="w-full h-10 rounded-xl border border-stone-200 bg-white px-3.5 text-xs font-semibold text-stone-800 shadow-xs outline-hidden cursor-pointer"
              >
                <option value="meditouch/general">meditouch/general (General Assets)</option>
                <option value="meditouch/profiles">meditouch/profiles (Doctor/User Avatars)</option>
                <option value="meditouch/doctors/documents">meditouch/doctors/documents (BMDC & Credentials)</option>
                <option value="meditouch/prescriptions">meditouch/prescriptions (Prescription Media)</option>
                <option value="meditouch/medicines">meditouch/medicines (Medicine Pack Images)</option>
              </select>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-[#5b15fc] bg-[#5b15fc]/5 scale-102"
                  : "border-stone-300 bg-stone-50 hover:bg-stone-100/70"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-xs text-[#5b15fc] mb-3">
                {uploading ? <Spinner className="size-6 text-[#5b15fc]" /> : <UploadCloud className="size-6" />}
              </div>
              <p className="text-xs font-bold text-stone-900">
                {uploading ? "Uploading to Cloudinary CDN..." : "Click or drag & drop files here"}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Supports JPG, PNG, WEBP, SVG, PDF, DOC, DOCX up to 20MB.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PREVIEW LIGHTBOX MODAL (Read Feature)                                  */}
      {/* ========================================================================= */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl neo-card rounded-[24px] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="min-w-0 flex-1 pr-4">
                <h3 className="font-heading text-lg font-normal text-stone-900 truncate">
                  {previewAsset.original_filename}
                </h3>
                <p className="text-xs font-mono text-stone-500 truncate">{previewAsset.public_id}</p>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Media Container */}
            <div className="flex items-center justify-center rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden max-h-[400px]">
              {previewAsset.resource_type === "image" ||
              ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(previewAsset.format?.toLowerCase()) ? (
                <img
                  src={previewAsset.secure_url}
                  alt={previewAsset.original_filename}
                  className="size-full max-h-[400px] object-contain"
                />
              ) : (
                <div className="py-16 text-center space-y-3">
                  <FileText className="size-16 text-[#5b15fc] mx-auto" />
                  <p className="text-xs font-bold text-stone-800">{previewAsset.original_filename}</p>
                  <a
                    href={previewAsset.secure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#5b15fc] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4d0ee0] shadow-xs"
                  >
                    <span>View / Download Document</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Detailed metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold">Format</span>
                <p className="font-mono font-bold text-stone-800">{previewAsset.format.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold">Size</span>
                <p className="font-mono font-bold text-stone-800">{formatFileSize(previewAsset.bytes)}</p>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold">Folder</span>
                <p className="font-mono font-semibold text-stone-800 truncate">{previewAsset.folder}</p>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold">Protocol</span>
                <p className="font-mono font-semibold text-emerald-600">HTTPS CDN</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => copyUrlToClipboard(previewAsset.secure_url, previewAsset.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                <Copy className="size-3.5" />
                <span>Copy Direct CDN URL</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={previewAsset.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#5b15fc] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4d0ee0] shadow-xs"
                >
                  <span>Open Full Link</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DELETE ASSET CONFIRMATION MODAL (Delete Feature)                       */}
      {/* ========================================================================= */}
      {deletingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md neo-card rounded-[24px] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-normal text-stone-900">Delete CDN Asset</h3>
                <p className="text-xs text-stone-500">Cloud storage purge</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-stone-900">{deletingAsset.original_filename}</strong> from Cloudinary CDN?
            </p>
            <p className="text-[11px] text-stone-400 bg-stone-50 p-2.5 rounded-xl border border-stone-200 font-mono">
              Public ID: {deletingAsset.public_id}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingLoading}
                onClick={() => setDeletingAsset(null)}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={handleDeleteAsset}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deletingLoading ? <Spinner className="size-3.5 text-white" /> : <Trash2 className="size-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

