"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
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
  ChevronRight,
  Stethoscope,
  Clock,
  AlertTriangle,
  HeartPulse,
  Syringe,
  Baby,
  Share2,
  Check,
  FlaskConical,
  BookOpen,
  Bookmark
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";
import { pharmacyApi, MedicineDetailData } from "@/lib/api";
import { toast } from "sonner";

export default function MedicineDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const router = useRouter();

  // All Hooks Declared Unconditionally At Top
  const [medicine, setMedicine] = useState<MedicineDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>("");

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

  // Stable Memoized Monograph Sections
  const monographSections = useMemo(() => {
    if (!medicine) return [];
    const details = medicine.medicine_details || {};
    return [
      {
        id: "indications",
        icon: Stethoscope,
        label: "Indications & Uses",
        tag: "Prescribing Info",
        content: details["Indications"] || details["Indication"],
      },
      {
        id: "dosage",
        icon: Clock,
        label: "Dosage & Administration",
        tag: "Clinical Dosage",
        content: details["Dosage And Administration"] || details["Dosage"] || details["Administration"],
      },
      {
        id: "pharmacology",
        icon: FlaskConical,
        label: "Pharmacology & Mechanism",
        tag: "Mode of Action",
        content: details["Pharmacology"] || details["Mode Of Action"],
      },
      {
        id: "side_effects",
        icon: AlertTriangle,
        label: "Side Effects & Adverse Reactions",
        tag: "Safety & Tolerance",
        content: details["Side Effects"] || details["Adverse Effects"],
      },
      {
        id: "precautions",
        icon: ShieldCheck,
        label: "Precautions & Warnings",
        tag: "Special Caution",
        content: details["Precautions And Warnings"] || details["Precautions"],
      },
      {
        id: "contraindications",
        icon: AlertCircle,
        label: "Contraindications",
        tag: "Do Not Prescribe",
        content: details["Contraindications"],
      },
      {
        id: "pregnancy",
        icon: Baby,
        label: "Pregnancy & Lactation",
        tag: "Maternal Health",
        content: details["Pregnancy And Lactation"],
      },
      {
        id: "interactions",
        icon: HeartPulse,
        label: "Drug & Food Interactions",
        tag: "Concurrent Meds",
        content: details["Interaction"] || details["Interactions"],
      },
      {
        id: "overdose",
        icon: Syringe,
        label: "Overdose & Special Populations",
        tag: "Emergency & Geriatrics",
        content: details["Overdose Effects"] || details["Use In Special Populations"],
      },
      {
        id: "faq",
        icon: HelpCircle,
        label: "Frequently Asked Questions",
        tag: "FAQ",
        content: details["Faq"] || details["FAQ"],
      },
    ].filter((s) => s.content && s.content.trim() !== "");
  }, [medicine]);

  // ScrollSpy: Update active navigation section based on scroll position (supporting overflow containers)
  useEffect(() => {
    if (monographSections.length === 0) return;
    const sectionIds = monographSections.map((s) => s.id);

    if (!activeSectionId && sectionIds.length > 0) {
      setActiveSectionId(sectionIds[0]);
    }

    const updateActiveSection = () => {
      let currentSection = sectionIds[0];

      // Find the element currently closest to the top of view
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the top of the card is within the upper 300px or past it but bottom still visible
          if (rect.top <= 260 && rect.bottom >= 120) {
            currentSection = id;
            break;
          }
        }
      }
      setActiveSectionId(currentSection);
    };

    const mainContainer = document.querySelector("main");

    if (mainContainer) {
      mainContainer.addEventListener("scroll", updateActiveSection, { passive: true });
    }
    window.addEventListener("scroll", updateActiveSection, { passive: true });

    // Also use IntersectionObserver for fine-grained intersection detection
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveSectionId(visibleEntries[0].target.id);
        }
      },
      {
        root: mainContainer || null,
        rootMargin: "-80px 0px -50% 0px",
        threshold: [0, 0.1, 0.5],
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    updateActiveSection();

    return () => {
      if (mainContainer) {
        mainContainer.removeEventListener("scroll", updateActiveSection);
      }
      window.removeEventListener("scroll", updateActiveSection);
      observer.disconnect();
    };
  }, [monographSections]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Page link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Early Returns AFTER All Hooks
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Spinner className="size-10 text-[#5b15fc]" />
        <p className="text-xs font-semibold text-stone-500">Loading pharmaceutical details & monograph...</p>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center neo-card rounded-2xl bg-white border border-stone-200 p-8 space-y-4 max-w-xl mx-auto">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-200">
          <AlertCircle className="size-7" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900">Medicine Not Found</h2>
        <p className="text-xs text-stone-500 max-w-sm">
          The requested pharmaceutical record for &apos;{slug}&apos; could not be retrieved from the database.
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
  const rawImage = pInfo.medicine_image || medicine.product_info?.medicine_image;
  const unitPrices = pInfo.unit_prices || [];
  const activePack = unitPrices[selectedPackIndex] || unitPrices[0] || null;

  return (
    <div className="w-full space-y-8">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/pharmacy"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-[#5b15fc] hover:border-[#5b15fc]/40 shadow-xs transition-all cursor-pointer group"
          >
            <ArrowLeft className="size-3.5 text-stone-400 group-hover:text-[#5b15fc] transition-colors" />
            <span>Medicine Catalog</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400">
            <span>/</span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-700">
              <span className="size-1.5 rounded-full bg-[#5b15fc]" />
              {medicine.category_name || pInfo.category_name || "General"}
            </span>
            <span>/</span>
            <span className="font-bold text-stone-900 max-w-xs truncate">
              {medicine.medicine_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all"
            title="Share page link"
          >
            {copiedLink ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5 text-stone-400" />}
            <span>{copiedLink ? "Link Copied" : "Share"}</span>
          </button>

          <button
            onClick={() => setShowRawJson(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-[#5b15fc] shadow-xs cursor-pointer transition-all"
          >
            <Code2 className="size-3.5 text-[#5b15fc]" />
            <span>Mongo Document</span>
          </button>
        </div>
      </div>

      {/* Main Product Shop Showcase (Compact Full Width Clean E-Commerce Card) */}
      <div className="neo-card rounded-2xl bg-white border border-stone-200 p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Product Visual Showcase (MedEasy Studio Full-Bleed 4:3) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full aspect-4/3 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden group shadow-xs">
              {rawImage ? (
                <img
                  src={rawImage}
                  alt={medicine.medicine_name}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e: any) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-300 space-y-1.5 p-6">
                  <Pill className="size-12 text-stone-300" />
                  <span className="text-xs text-stone-400 font-medium">No Image Available</span>
                </div>
              )}

              {/* Floating Dosage Pill (Top-Left) */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-stone-800 border border-stone-200/90 shadow-xs">
                  <span className="size-1.5 rounded-full bg-[#5b15fc]" />
                  {medicine.category_name || pInfo.category_name || "Tablet"}
                </span>
              </div>

              {/* Floating OTC/Rx Pill (Top-Right) */}
              <div className="absolute top-3 right-3 z-10 pointer-events-none">
                {pInfo.rx_required ? (
                  <span className="inline-flex items-center rounded-lg bg-rose-500 text-white backdrop-blur-md px-2.5 py-1 text-[9px] font-bold shadow-xs tracking-wider">
                    Rx Required
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-lg bg-emerald-600 text-white backdrop-blur-md px-2.5 py-1 text-[9px] font-bold shadow-xs tracking-wider">
                    OTC
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Product Identity, Pricing & Specs */}
          <div className="lg:col-span-7 space-y-4">
            {/* Header: Brand Name, Strength & Generic Formulation */}
            <div className="space-y-1 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  <ShieldCheck className="size-3" />
                  Verified Medicine
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
                  <CheckCircle2 className="size-3" />
                  In Stock
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                {medicine.medicine_name}{" "}
                {pInfo.strength && (
                  <span className="text-lg font-normal text-stone-500">{pInfo.strength}</span>
                )}
              </h1>

              <p className="text-xs sm:text-sm font-semibold text-[#5b15fc]">
                {medicine.generic_name}
              </p>

              <p className="text-xs text-stone-500 flex items-center gap-1.5 pt-0.5">
                <Building2 className="size-3.5 text-stone-400" />
                <span>Manufactured by:</span>
                <strong className="text-stone-800 font-semibold">{medicine.manufacturer_name}</strong>
              </p>
            </div>

            {/* Price Box */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Official Retail Price (MRP)
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-stone-900">
                  {formatCurrency(activePack ? parseFloat(activePack.price) || 0 : pInfo.unit_price || 0)}
                </p>
                <span className="text-xs text-stone-500 font-medium">
                  {activePack ? `per ${activePack.unit}` : "standard unit"}
                </span>
              </div>
            </div>

            {/* Pack Size Selector */}
            {unitPrices && unitPrices.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Available Pack Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {unitPrices.map((up: any, idx: number) => {
                    const isSelected = selectedPackIndex === idx;
                    const priceVal = parseFloat(up.price) || 0;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPackIndex(idx)}
                        className={`rounded-lg px-3 py-1.5 text-left transition-all cursor-pointer border ${
                          isSelected
                            ? "border-[#5b15fc] bg-[#5b15fc]/5 ring-2 ring-[#5b15fc]/20 shadow-xs"
                            : "border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900">
                            {up.unit}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="size-3 text-[#5b15fc]" />
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#5b15fc] mt-0.5">
                          {formatCurrency(priceVal)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="rounded-lg border border-stone-100 bg-stone-50 p-2">
                <span className="text-[9px] text-stone-400 font-medium block">Dosage Form</span>
                <span className="text-xs font-bold text-stone-800 block truncate mt-0.5">
                  {medicine.category_name || pInfo.category_name || "Tablet"}
                </span>
              </div>
              <div className="rounded-lg border border-stone-100 bg-stone-50 p-2">
                <span className="text-[9px] text-stone-400 font-medium block">Prescription</span>
                <span className="text-xs font-bold text-stone-800 block truncate mt-0.5">
                  {pInfo.rx_required ? "Rx Required" : "No (OTC)"}
                </span>
              </div>
              <div className="rounded-lg border border-stone-100 bg-stone-50 p-2">
                <span className="text-[9px] text-stone-400 font-medium block">Stock Status</span>
                <span className="text-xs font-bold text-emerald-700 block truncate mt-0.5">
                  In Stock
                </span>
              </div>
              <div className="rounded-lg border border-stone-100 bg-stone-50 p-2">
                <span className="text-[9px] text-stone-400 font-medium block">Pack Size</span>
                <span className="text-xs font-bold text-stone-800 block truncate mt-0.5">
                  {activePack ? `${activePack.unit_size || 1} units` : "1 unit"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Monograph Layout (Pinned Left Index Sidebar & Right Detailed Sections) */}
      <div className="space-y-4">
        <div className="border-b border-stone-200 pb-2">
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Clinical Monograph & Prescribing Details
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Official pharmacological guidelines, clinical indications, dosage, warnings, and precautions.
          </p>
        </div>

        {monographSections.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Compact Pinned Left Indexing Sidebar (Sticky From Top) */}
            <div className="lg:col-span-3 lg:sticky lg:top-0 self-start space-y-2.5">
              <div className="neo-card rounded-2xl bg-white border border-stone-200 p-3 space-y-2 shadow-xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="size-3.5 text-[#5b15fc]" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-900">
                      Index
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#5b15fc] bg-[#5b15fc]/10 px-1.5 py-0.2 rounded-md">
                    {monographSections.length}
                  </span>
                </div>

                <nav className="space-y-0.5 max-h-[calc(100vh-140px)] overflow-y-auto pr-0.5 scrollbar-thin">
                  {monographSections.map((sec) => {
                    const IconComponent = sec.icon;
                    const isActive = activeSectionId === sec.id;
                    return (
                      <a
                        key={sec.id}
                        href={`#${sec.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(sec.id);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "start" });
                            setActiveSectionId(sec.id);
                          }
                        }}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#5b15fc] text-white shadow-xs"
                            : "text-stone-600 hover:bg-[#5b15fc]/10 hover:text-[#5b15fc]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <IconComponent className={`size-3.5 shrink-0 ${isActive ? "text-white" : "text-stone-400"}`} />
                          <span className="truncate text-[11px]">{sec.label}</span>
                        </div>
                        <ChevronRight className={`size-2.5 shrink-0 ${isActive ? "text-white/80" : "text-stone-300"}`} />
                      </a>
                    );
                  })}
                </nav>
              </div>

              {/* Compact Clinical Source Note */}
              <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-2.5 text-[10px] text-stone-500 leading-snug flex items-start gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Verified against official drug database monographs.</span>
              </div>
            </div>

            {/* Enlarged Right Main Monograph Descriptions & Stacked Sections */}
            <div className="lg:col-span-9 space-y-5">
              {monographSections.map((sec) => {
                const IconComponent = sec.icon;
                return (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="neo-card rounded-2xl bg-white border border-stone-200 p-6 sm:p-7 space-y-3 shadow-xs scroll-mt-2"
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc]">
                          <IconComponent className="size-4" />
                        </div>
                        <h3 className="text-base font-bold text-stone-900">
                          {sec.label}
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-stone-400 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-100">
                        {sec.tag}
                      </span>
                    </div>

                    {/* Rich HTML Description */}
                    <div
                      className="prose prose-stone max-w-none text-xs sm:text-sm text-stone-700 leading-relaxed space-y-2.5
                        [&_table]:w-full [&_table]:border-collapse [&_table]:my-3
                        [&_thead]:bg-stone-50 [&_th]:border-b [&_th]:border-stone-200 [&_th]:p-2.5 [&_th]:font-bold [&_th]:text-stone-800 [&_th]:text-left
                        [&_td]:border-b [&_td]:border-stone-100 [&_td]:p-2.5 [&_td]:text-stone-700
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                        [&_strong]:text-stone-900 [&_strong]:font-bold
                        [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:mt-3 [&_h2]:mb-1
                        [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-stone-800 [&_h3]:mt-2 [&_h3]:mb-1
                        [&_p]:leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sec.content || "" }}
                    />
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="neo-card rounded-2xl bg-white border border-stone-200 p-8 text-center space-y-2">
            <Info className="size-8 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-stone-800">No Extended Clinical Monograph Available</p>
            <p className="text-xs text-stone-500">
              Basic catalog and pricing information is stored. Run the crawler with Next.js data endpoint to ingest full clinical monograph.
            </p>
          </div>
        )}
      </div>

      {/* Related Generic Alternatives Section */}
      {medicine.related_medicines && medicine.related_medicines.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <div>
              <h3 className="text-xl font-bold text-stone-900">
                Related Generic Alternatives ({medicine.related_medicines.length})
              </h3>
              <p className="text-xs text-stone-500">
                Therapeutically equivalent products with identical active generic formulation
              </p>
            </div>
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
              Same Generic
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {medicine.related_medicines.map((rel, idx) => (
              <div
                key={idx}
                className="neo-card rounded-xl bg-white border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
              >
                {/* Top Full-Bleed Image Frame (Clickable to details) */}
                <Link
                  href={`/admin/pharmacy/${rel.slug}`}
                  className="relative aspect-4/3 w-full bg-stone-100 flex items-center justify-center overflow-hidden border-b border-stone-100 cursor-pointer group/img block"
                >
                  {rel.medicine_image ? (
                    <img
                      src={rel.medicine_image}
                      alt={rel.medicine_name}
                      className="size-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      onError={(e: any) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center bg-stone-50">
                      <Pill className="size-8 text-stone-300" />
                    </div>
                  )}

                  {/* Redesigned Category Badge on top-left */}
                  <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-stone-800 border border-stone-200/90 shadow-2xs tracking-wide">
                      <span className="size-1 rounded-full bg-[#5b15fc]" />
                      {rel.category_name || "Tablet"}
                    </span>
                  </div>

                  {/* Redesigned Rx/OTC Badge on top-right if available */}
                  <div className="absolute top-1.5 right-1.5 z-10 pointer-events-none">
                    {rel.rx_required ? (
                      <span className="inline-flex items-center rounded-md bg-rose-500/95 text-white backdrop-blur-md px-1.5 py-0.5 text-[8px] font-bold shadow-2xs tracking-wider">
                        Rx
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-emerald-600/95 text-white backdrop-blur-md px-1.5 py-0.5 text-[8px] font-bold shadow-2xs tracking-wider">
                        OTC
                      </span>
                    )}
                  </div>
                </Link>

                {/* Card Body Info */}
                <div className="p-2.5 flex flex-col justify-between flex-1 space-y-2">
                  <div className="space-y-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <Link
                        href={`/admin/pharmacy/${rel.slug}`}
                        className="font-heading text-xs font-semibold text-stone-900 hover:text-[#5b15fc] transition-colors line-clamp-1 cursor-pointer"
                      >
                        {rel.medicine_name}
                      </Link>
                    </div>
                    <p className="text-[10px] text-stone-500 line-clamp-1 italic font-medium">
                      {medicine.generic_name}
                    </p>
                    <p className="text-[10px] text-stone-400 line-clamp-1">
                      {rel.manufacturer_name}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
                    <div>
                      <p className="text-[9px] text-stone-400 font-medium leading-none">Price</p>
                      <p className="font-bold text-stone-900 text-xs mt-0.5">
                        {rel.unit_prices && rel.unit_prices[0]
                          ? formatCurrency(parseFloat(rel.unit_prices[0].price) || 0)
                          : "Available"}
                      </p>
                    </div>

                    <Link
                      href={`/admin/pharmacy/${rel.slug}`}
                      className="inline-flex items-center gap-0.5 rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-800 hover:bg-[#5b15fc] hover:text-white transition-all shadow-2xs cursor-pointer"
                    >
                      <span>Details</span>
                      <ExternalLink className="size-2.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON Inspector Modal */}
      {showRawJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto neo-card rounded-3xl bg-stone-950 text-stone-200 p-6 shadow-2xl space-y-4 my-auto border border-stone-800">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                <Code2 className="size-4" />
                <span>Raw Mongo Document Inspector: {medicine.slug}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(medicine, null, 2));
                    toast.success("JSON copied to clipboard");
                  }}
                  className="rounded-xl border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs font-mono text-stone-300 hover:bg-stone-700 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="size-3.5" />
                  <span>Copy JSON</span>
                </button>
                <button
                  onClick={() => setShowRawJson(false)}
                  className="rounded-xl p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 cursor-pointer transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto p-4 bg-stone-900 rounded-2xl border border-stone-800 max-h-[60vh] text-stone-300 scrollbar-thin">
              {JSON.stringify(medicine, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
