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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            E-Pharmacy Medicine Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse normalized medicines, pricing, dosage forms, and synchronize with MedEasy catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSyncMedEasy}
            disabled={syncing}
            className="gap-2 rounded-4xl"
          >
            {syncing ? <Spinner className="size-3.5" /> : <Sparkles className="size-3.5" />}
            Sync MedEasy Catalog
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMedicines}
            disabled={loading}
            className="gap-2 rounded-4xl"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by brand name (e.g. Napa, Seclo), generic name (Paracetamol), or manufacturer..."
          className="h-10 w-full rounded-4xl border border-input bg-card pl-9 pr-3 text-xs outline-hidden focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Medicines Table */}
      <div className="rounded-4xl border border-border bg-card p-6 shadow-xs overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Pill className="size-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No Medicines Found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Sync MedEasy Catalog&quot; to ingest medicines into the platform.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3">Brand & Strength</th>
                <th className="pb-3">Generic Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Manufacturer</th>
                <th className="pb-3">Unit Price</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                        <Pill className="size-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{m.brand}</p>
                        <p className="text-[11px] text-muted-foreground font-normal">{m.dosage_form} • {m.strength}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">{m.generic_name}</td>
                  <td className="py-3">
                    <Badge variant="outline" className="text-[10px]">
                      {m.category}
                    </Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">{m.manufacturer || "-"}</td>
                  <td className="py-3 font-semibold text-foreground">{formatCurrency(m.unit_price)}</td>
                  <td className="py-3 text-muted-foreground">{m.stock_count ?? 100} units</td>
                  <td className="py-3 text-right">
                    <Badge
                      variant={m.in_stock ? "success" : "destructive"}
                      className="text-[10px]"
                    >
                      {m.in_stock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

