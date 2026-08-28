"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { pharmacyApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Pill,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  Sparkles
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function PharmacyAdminPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const data = await pharmacyApi.listMedicines(1, 100);
      setMedicines(data.items || []);
    } catch (err: any) {
      toast.error("Failed to load medicine catalog", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleSyncMedEasy = async () => {
    try {
      setSyncing(true);
      const res = await pharmacyApi.ingestMedEasy();
      toast.success("MedEasy Sync Complete", {
        description: `Successfully ingested/updated ${res.count} medicines.`,
      });
      await loadMedicines();
    } catch (err: any) {
      toast.error("Ingestion failed", { description: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const filtered = medicines.filter((m) =>
    m.brand?.toLowerCase().includes(search.toLowerCase()) ||
    m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
            Medicine Catalog & Inventory
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pharmaceutical database synchronized with MedEasy Bangladesh catalog.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncMedEasy}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-[#5b15fc] text-white px-4 py-2 text-xs font-bold neo-button shadow-[2px_2px_0px_0px_#1C1917] hover:bg-[#4d0ee0] disabled:opacity-50"
          >
            {syncing ? (
              <>
                <Spinner className="size-3.5 text-white" />
                <span>Ingesting Catalog...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                <span>Sync MedEasy Catalog</span>
              </>
            )}
          </button>
          <button
            onClick={loadMedicines}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-white px-3 py-2 text-xs font-bold text-stone-800 neo-button hover:bg-stone-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
          <input
            placeholder="Search by brand name, generic formulation, manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl pl-9 pr-4 text-xs font-medium text-stone-900 neo-input outline-hidden placeholder:text-stone-400"
          />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Showing {filtered.length} Items
        </span>
      </div>

      {/* Catalog Table */}
      <div className="neo-card rounded-[22px] p-6 bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-8 text-[#5b15fc]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 border border-stone-200 mb-2">
              <Pill className="size-6" />
            </div>
            <p className="text-sm font-bold text-stone-900">No Medicines Found</p>
            <p className="text-xs text-stone-500 mt-1">
              Click &quot;Sync MedEasy Catalog&quot; to ingest the verified Bangladesh drug database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="pb-3 pr-4">Brand / Generic Name</th>
                  <th className="pb-3 px-4">Dosage / Strength</th>
                  <th className="pb-3 px-4">Manufacturer</th>
                  <th className="pb-3 px-4">Unit Price</th>
                  <th className="pb-3 px-4">Pack Size</th>
                  <th className="pb-3 pl-4 text-right">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/20">
                          <Package className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-xs">{item.brand}</p>
                          <p className="text-[11px] text-stone-500">{item.generic_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-700">
                      <span className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-mono font-bold">
                        {item.dosage_form}
                      </span>{" "}
                      {item.strength}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-medium">
                      {item.manufacturer}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 font-medium">
                      {item.pack_size || "Per Unit"}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      {item.in_stock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                          <CheckCircle2 className="size-3" />
                          In Stock ({item.stock_count || 100})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                          <AlertCircle className="size-3" />
                          Out of Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
