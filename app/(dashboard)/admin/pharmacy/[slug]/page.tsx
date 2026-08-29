"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pill,
  ShieldCheck,
  Building2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  HelpCircle,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  Package,
  ExternalLink,
  Code2,
  X,
  Copy,
  ChevronRight
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";
import { pharmacyApi, MedicineDetailData } from "@/lib/api";
import { toast } from "sonner";

export default function MedicineDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const router = useRouter();

  const [medicine, setMedicine] = useState<MedicineDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("indications");
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await pharmacyApi.getMedicineDetails(slug);
        setMedicine(data);
      } catch (err: any) {
        toast.error("Failed to load medicine details", { description: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Spinner className="size-10 text-[#5b15fc]" />
        <p className="text-xs font-semibold text-stone-500">Loading pharmaceutical monograph...</p>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center neo-card rounded-2xl bg-white border border-stone-200 p-6 space-y-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-200">
          <AlertCircle className="size-7" />
        </div>
        <h2 className="font-heading text-2xl font-normal text-stone-900">Medicine Not Found</h2>
        <p className="text-xs text-stone-500 max-w-sm">
          The requested pharmaceutical record for &apos;{slug}&apos; could not be retrieved from database.
        </p>
        <Link
          href="/admin/pharmacy"
          className="inline-flex items-center gap-2 rounded-xl bg-[#5b15fc] text-white px-4 py-2 text-xs font-semibold shadow-xs hover:bg-[#4d0ee0]"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Medicine Catalog</span>
        </Link>
      </div>
    );
  }

  const pInfo = medicine.product_info || {};
  const medDetails = medicine.medicine_details || {};
  const rawImage = pInfo.medicine_image || medicine.product_info?.medicine_image;

  const unitPrices = pInfo.unit_prices || [];

  // Available tabs mapping
  const monographSections = [
    { key: "indications", label: "Indications & Uses", content: medDetails["Indications"] },
    { key: "dosage", label: "Dosage & Administration", content: medDetails["Dosage And Administration"] || medDetails["Dosage"] },
    { key: "pharmacology", label: "Pharmacology & Action", content: medDetails["Pharmacology"] || medDetails["Mode Of Action"] },
    { key: "side_effects", label: "Side Effects", content: medDetails["Side Effects"] },
    { key: "precautions", label: "Precautions & Warnings", content: medDetails["Precautions And Warnings"] },
    { key: "contraindications", label: "Contraindications", content: medDetails["Contraindications"] },
    { key: "pregnancy", label: "Pregnancy & Lactation", content: medDetails["Pregnancy And Lactation"] },
    { key: "interactions", label: "Drug Interactions", content: medDetails["Interaction"] },
    { key: "overdose", label: "Overdose & Populations", content: medDetails["Overdose Effects"] || medDetails["Use In Special Populations"] },
    { key: "faq", label: "Patient FAQ", content: medDetails["Faq"] },
  ].filter((s) => s.content);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <Link href="/admin/pharmacy" className="hover:text-[#5b15fc] flex items-center gap-1 transition-colors">
            <ArrowLeft className="size-3.5" />
            <span>Medicine Catalog</span>
          </Link>
          <ChevronRight className="size-3.5 text-stone-400" />
          <span className="text-stone-900 font-bold truncate max-w-xs">{medicine.medicine_name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawJson(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
          >
            <Code2 className="size-3.5 text-[#5b15fc]" />
            <span>Raw JSON Data</span>
          </button>
        </div>
      </div>

      {/* Product Hero Card */}
      <div className="neo-card rounded-[24px] bg-white border border-stone-200 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Product Image */}
          <div className="size-48 sm:size-56 shrink-0 rounded-2xl bg-linear-to-b from-stone-50 to-stone-100/70 border border-stone-200 p-4 flex items-center justify-center overflow-hidden shadow-inner mx-auto lg:mx-0">
            {rawImage ? (
              <img
                src={rawImage}
                alt={medicine.medicine_name}
                className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-sm"
                onError={(e: any) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <Pill className="size-16 text-stone-300" />
            )}
          </div>

          {/* Product Identity */}
          <div className="flex-1 space-y-4 min-w-0">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#5b15fc]/10 text-[#5b15fc] border border-[#5b15fc]/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                  {medicine.category_name || pInfo.category_name || "Tablet"}
                </span>

                {pInfo.rx_required ? (
                  <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-bold">
                    Prescription Required (Rx)
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
                    Over-The-Counter (OTC)
                  </span>
                )}

                <span className="rounded-full bg-stone-100 text-stone-600 px-2.5 py-0.5 text-xs font-mono">
                  Slug: {medicine.slug}
                </span>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl font-normal text-stone-900 tracking-tight">
                {medicine.medicine_name}{" "}
                {pInfo.strength && (
                  <span className="text-xl font-bold text-stone-500">{pInfo.strength}</span>
                )}
              </h1>

              <p className="text-sm font-semibold text-stone-600 italic">
                {medicine.generic_name}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-stone-500 pt-0.5">
                <Building2 className="size-3.5 text-stone-400" />
                <span className="font-medium">{medicine.manufacturer_name}</span>
                <span className="text-stone-300">•</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> Verified Pharmaceutical
                </span>
              </div>
            </div>

            {/* Packaging Unit Pricing Breakdown */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Packaging Sizes & Official Unit Pricing
              </p>
              <div className="flex flex-wrap gap-2.5">
                {unitPrices && unitPrices.length > 0 ? (
                  unitPrices.map((up: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-stone-200 bg-stone-50/80 px-3.5 py-2 space-y-0.5 shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                        <Package className="size-3.5 text-[#5b15fc]" />
                        <span>{up.unit}</span>
                      </div>
                      <p className="text-xs font-mono font-bold text-[#5b15fc]">
                        {formatCurrency(parseFloat(up.price) || 0)}
                        {up.unit_size > 1 && (
                          <span className="text-[10px] font-normal text-stone-500 ml-1">
                            ({up.unit_size} units)
                          </span>
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700">
                    Standard Unit: {formatCurrency(pInfo.unit_price || 0)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monograph Tabs & Detailed Content */}
      <div className="neo-card rounded-[24px] bg-white border border-stone-200 overflow-hidden shadow-xs">
        {/* Navigation Tabs */}
        {monographSections.length > 0 ? (
          <div>
            <div className="flex items-center gap-1 overflow-x-auto border-b border-stone-200 bg-stone-50/50 p-2 scrollbar-none">
              {monographSections.map((sec) => (
                <button
                  key={sec.key}
                  onClick={() => setActiveTab(sec.key)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === sec.key
                      ? "bg-white text-[#5b15fc] shadow-xs border border-stone-200"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Tab Content Section */}
            <div className="p-6 sm:p-8">
              {monographSections.map((sec) => {
                if (sec.key !== activeTab) return null;
                return (
                  <div key={sec.key} className="space-y-4 animate-in fade-in">
                    <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc]">
                        <FileText className="size-4" />
                      </div>
                      <h3 className="font-heading text-xl font-normal text-stone-900">
                        {sec.label}
                      </h3>
                    </div>

                    {/* Rich HTML Content safely styled with typography */}
                    <div
                      className="prose prose-stone max-w-none text-xs sm:text-sm text-stone-700 leading-relaxed space-y-3
                        [&_table]:w-full [&_table]:border-collapse [&_table]:my-3
                        [&_thead]:bg-stone-50 [&_th]:border-b [&_th]:border-stone-200 [&_th]:p-2.5 [&_th]:font-bold [&_th]:text-stone-800 [&_th]:text-left
                        [&_td]:border-b [&_td]:border-stone-100 [&_td]:p-2.5 [&_td]:text-stone-700
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5
                        [&_strong]:text-stone-900 [&_strong]:font-bold
                        [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:mt-3 [&_h2]:mb-1"
                      dangerouslySetInnerHTML={{ __html: sec.content || "" }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <Info className="size-8 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-stone-800">No Extended Monograph Available</p>
            <p className="text-xs text-stone-500">
              Basic catalog info is available. Run crawler to update detailed monograph.
            </p>
          </div>
        )}
      </div>

      {/* Related Generic Alternatives */}
      {medicine.related_medicines && medicine.related_medicines.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-normal text-stone-900">
              Related Generic Alternatives ({medicine.related_medicines.length})
            </h3>
            <span className="text-xs text-stone-500 font-medium">Same Formulation / Therapeutic Class</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {medicine.related_medicines.slice(0, 8).map((rel, idx) => (
              <div
                key={idx}
                className="neo-card rounded-2xl bg-white border border-stone-200 p-3.5 space-y-2 hover:border-[#5b15fc]/40 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="size-12 shrink-0 rounded-xl bg-stone-50 border border-stone-100 p-1 flex items-center justify-center">
                    {rel.medicine_image ? (
                      <img src={rel.medicine_image} alt={rel.medicine_name} className="size-full object-contain" />
                    ) : (
                      <Pill className="size-6 text-stone-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-stone-900 text-xs truncate">{rel.medicine_name}</h4>
                    <p className="text-[10px] text-stone-500 truncate">{rel.manufacturer_name}</p>
                    <span className="inline-block mt-1 rounded bg-stone-100 text-stone-600 px-1.5 py-0.5 text-[9px] font-mono">
                      {rel.category_name || "Tablet"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#5b15fc]">
                    {rel.unit_prices && rel.unit_prices[0]
                      ? formatCurrency(rel.unit_prices[0].price)
                      : "Available"}
                  </span>
                  {rel.slug && (
                    <Link
                      href={`/admin/pharmacy/${rel.slug}`}
                      className="text-[11px] font-bold text-stone-700 hover:text-[#5b15fc] flex items-center gap-0.5"
                    >
                      <span>View</span>
                      <ChevronRight className="size-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON Data Modal */}
      {showRawJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto neo-card rounded-[24px] bg-stone-950 text-stone-200 p-6 shadow-2xl space-y-4 my-auto border border-stone-800">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Code2 className="size-4" />
                <span>Raw Mongo Document Inspector: {medicine.slug}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(medicine, null, 2));
                    toast.success("JSON copied to clipboard");
                  }}
                  className="rounded-lg border border-stone-700 bg-stone-800 px-2.5 py-1 text-xs font-mono text-stone-300 hover:bg-stone-700 flex items-center gap-1"
                >
                  <Copy className="size-3" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => setShowRawJson(false)}
                  className="rounded-lg p-1 text-stone-400 hover:text-stone-200"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto p-3 bg-stone-900 rounded-xl border border-stone-800 max-h-[60vh] text-stone-300 scrollbar-thin">
              {JSON.stringify(medicine, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
