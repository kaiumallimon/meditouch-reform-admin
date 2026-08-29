"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Share2,
  Check,
  ChevronRight,
  ChevronDown,
  Stethoscope,
  Clock,
  AlertTriangle,
  HeartPulse,
  Syringe,
  Baby,
  FlaskConical,
  BookOpen,
  Lock,
  Search,
  ShoppingCart
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";
import { pharmacyApi, MedicineDetailData } from "@/lib/api";
import { toast } from "sonner";

interface FaqItem {
  question: string;
  answer: string;
}

function parseFaqContent(rawContent: string): FaqItem[] {
  if (!rawContent) return [];

  const normalized = rawContent
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  const items: FaqItem[] = [];
  const chunks = normalized.split(/(?=(?:^|\n)\s*(?:Q\s*\d*[:\.\-]|Question\s*\d*[:\.\-]))/i);

  for (const chunk of chunks) {
    const trimmedChunk = chunk.trim();
    if (!trimmedChunk) continue;

    const answerSplit = trimmedChunk.split(/(?:^|\n|\s{2,})(?:A\s*\d*[:\.\-]|Answer\s*\d*[:\.\-])\s*/i);
    if (answerSplit.length >= 2) {
      const qText = answerSplit[0].replace(/^(?:Q\s*\d*[:\.\-]|Question\s*\d*[:\.\-])\s*/i, "").trim();
      const aText = answerSplit.slice(1).join(" ").trim();
      if (qText && aText) {
        items.push({ question: qText, answer: aText });
      }
    }
  }

  if (items.length === 0) {
    const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
    let currentQ = "";
    let currentA = "";

    for (const line of lines) {
      if (/^(?:Q\s*\d*[:\.\-]|Question\s*\d*[:\.\-])/i.test(line)) {
        if (currentQ && currentA) {
          items.push({ question: currentQ, answer: currentA });
          currentQ = "";
          currentA = "";
        }
        currentQ = line.replace(/^(?:Q\s*\d*[:\.\-]|Question\s*\d*[:\.\-])\s*/i, "").trim();
      } else if (/^(?:A\s*\d*[:\.\-]|Answer\s*\d*[:\.\-])/i.test(line)) {
        currentA = line.replace(/^(?:A\s*\d*[:\.\-]|Answer\s*\d*[:\.\-])\s*/i, "").trim();
      } else if (currentA) {
        currentA += " " + line;
      } else if (currentQ) {
        currentQ += " " + line;
      }
    }

    if (currentQ && currentA) {
      items.push({ question: currentQ, answer: currentA });
    }
  }

  return items;
}

function FaqAccordion({ content }: { content: string }) {
  const faqItems = useMemo(() => parseFaqContent(content), [content]);
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleItem = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const expandAll = () => {
    setOpenIndices(faqItems.map((_, i) => i));
  };

  const collapseAll = () => {
    setOpenIndices([]);
  };

  if (faqItems.length === 0) {
    return (
      <div
        className="prose prose-stone max-w-none text-xs sm:text-sm text-stone-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-stone-500 font-medium">
          {faqItems.length} clinical questions answered
        </span>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="text-[#5b15fc] hover:underline font-semibold cursor-pointer"
          >
            Expand all
          </button>
          <span className="text-stone-300">•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-stone-500 hover:underline font-semibold cursor-pointer"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {faqItems.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 ${
                isOpen
                  ? "border-[#5b15fc]/30 bg-white shadow-xs"
                  : "border-stone-200/90 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(idx)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3.5 p-4 text-left cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold mt-0.5 transition-colors ${
                      isOpen
                        ? "bg-[#5b15fc] text-white"
                        : "bg-[#5b15fc]/10 text-[#5b15fc] group-hover:bg-[#5b15fc]/20"
                    }`}
                  >
                    Q{idx + 1}
                  </div>
                  <span className="font-heading text-xs sm:text-sm font-semibold text-stone-900 group-hover:text-[#5b15fc] transition-colors leading-snug">
                    {item.question}
                  </span>
                </div>
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isOpen
                      ? "bg-[#5b15fc]/10 text-[#5b15fc]"
                      : "bg-stone-100 text-stone-500 group-hover:bg-stone-200/80 group-hover:text-stone-800"
                  }`}
                >
                  <ChevronDown
                    className={`size-4 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-[#5b15fc]" : ""
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-stone-100">
                  <div className="pl-9 pr-2">
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PublicMedicineDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const router = useRouter();

  const [medicine, setMedicine] = useState<MedicineDetailData | null>(null);
  const [loading, setLoading] = useState(true);
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
        toast.error("Failed to load medicine details");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  const pInfo = useMemo(() => medicine?.product_info || {}, [medicine]);

  const rawImage = useMemo(() => {
    if (medicine && (medicine as any).medicine_image) {
      return (medicine as any).medicine_image;
    }
    if (pInfo && pInfo.medicine_image) {
      return pInfo.medicine_image;
    }
    return null;
  }, [medicine, pInfo]);

  const monographSections = useMemo(() => {
    if (!medicine) return [];
    const details = medicine.medicine_details || {};
    const sections = [
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

    if (medicine.related_medicines && medicine.related_medicines.length > 0) {
      sections.push({
        id: "alternatives",
        icon: Layers,
        label: `Generic Alternatives (${medicine.related_medicines.length})`,
        tag: "Alternatives",
        content: "__ALTERNATIVES_SECTION__",
      });
    }

    return sections;
  }, [medicine]);

  // ScrollSpy for Active Section
  useEffect(() => {
    if (monographSections.length === 0) return;
    const sectionIds = monographSections.map((s) => s.id);

    if (!activeSectionId && sectionIds.length > 0) {
      setActiveSectionId(sectionIds[0]);
    }

    const updateActiveSection = () => {
      let currentSection = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            currentSection = id;
          }
        }
      }
      setActiveSectionId(currentSection);
    };

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
    };
  }, [monographSections, activeSectionId]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const publicUrl = `${window.location.origin}/pharmacy/${slug}`;
      navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      toast.success("Public link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] flex flex-col items-center justify-center p-6">
        <div className="neo-card rounded-2xl bg-white p-8 border border-stone-200 flex flex-col items-center gap-3 shadow-sm">
          <Spinner className="size-8 text-[#5b15fc]" />
          <p className="text-xs font-bold uppercase tracking-wider text-stone-800">
            Loading Medicine Details...
          </p>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] flex flex-col items-center justify-center p-6">
        <div className="neo-card rounded-2xl bg-white p-8 border border-stone-200 text-center max-w-md space-y-4 shadow-sm">
          <AlertCircle className="size-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-stone-900">Medicine Not Found</h2>
          <p className="text-xs text-stone-500">
            The requested medicine profile could not be located in the official pharmaceutical catalog.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#5b15fc] px-4 py-2 text-xs font-bold text-white hover:bg-[#4d0ee0] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const unitPrices = pInfo.unit_prices || [];
  const activePack = unitPrices[selectedPackIndex] || unitPrices[0] || null;

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col text-stone-900 selection:bg-[#5b15fc]/20 selection:text-[#5b15fc]">
      {/* Public Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3 sm:py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/logo.svg"
                alt="MediTouch"
                width={160}
                height={42}
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                priority
              />
              <span className="hidden sm:inline-block text-[10px] sm:text-[11px] font-bold text-stone-600 uppercase tracking-wider bg-stone-100/90 border border-stone-200/90 px-2.5 py-0.5 rounded-full">
                Drug Reference
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-[#5b15fc] hover:border-[#5b15fc]/30 shadow-xs cursor-pointer transition-all"
            >
              {copiedLink ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5 text-stone-400" />}
              <span>{copiedLink ? "Link Copied" : "Share"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span className="font-semibold text-stone-700">Medicines</span>
          <span>/</span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-stone-200/70 px-2 py-0.5 text-[11px] font-bold text-stone-800">
            <span className="size-1.5 rounded-full bg-[#5b15fc]" />
            {medicine.category_name || pInfo.category_name || "General"}
          </span>
          <span>/</span>
          <span className="font-bold text-stone-900 truncate max-w-sm">
            {medicine.medicine_name}
          </span>
        </div>

        {/* Hero Showcase Card */}
        <div className="neo-card rounded-2xl bg-white border border-stone-200 p-5 sm:p-6 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Product Image Frame (MedEasy Full Bleed 4:3) */}
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

            {/* Product Identity, Pricing & Specs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                    <ShieldCheck className="size-3" />
                    Verified Medicine
                  </span>
                  {pInfo.in_stock && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
                      <CheckCircle2 className="size-3" />
                      In Stock
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-baseline gap-2 pt-1">
                  <h1 className="font-heading text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                    {medicine.medicine_name}
                  </h1>
                  {pInfo.strength && (
                    <span className="text-sm font-semibold text-stone-500">
                      {pInfo.strength}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-[#5b15fc]">
                  {medicine.generic_name}
                </p>

                {(medicine.manufacturer_name || pInfo.manufacturer) && (
                  <p className="text-[11px] text-stone-500 flex items-center gap-1 pt-0.5">
                    <Building2 className="size-3 text-stone-400" />
                    <span>Manufactured by: <strong className="text-stone-800 font-semibold">{medicine.manufacturer_name || pInfo.manufacturer}</strong></span>
                  </p>
                )}
              </div>

              {/* Retail Price Display */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Official Retail Price (MRP)
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                    {formatCurrency(activePack ? parseFloat(activePack.price) || 0 : pInfo.unit_price || 0)}
                  </span>
                  {activePack?.title && (
                    <span className="text-xs text-stone-500 font-medium">
                      per {activePack.title}
                    </span>
                  )}
                </div>

                {/* Available Pack Size Pills */}
                {unitPrices.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Available Pack Sizes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {unitPrices.map((pack: any, idx: number) => {
                        const isSelected = idx === selectedPackIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedPackIndex(idx)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border text-left cursor-pointer ${
                              isSelected
                                ? "border-[#5b15fc] bg-[#5b15fc]/10 text-[#5b15fc] shadow-xs"
                                : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:border-stone-300"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{pack.title || "Pack"}</span>
                              {isSelected && <CheckCircle2 className="size-3 text-[#5b15fc]" />}
                            </div>
                            <span className="block text-[11px] font-bold mt-0.5">
                              {formatCurrency(parseFloat(pack.price) || 0)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100">
                <div className="rounded-xl bg-stone-50/80 p-2.5 border border-stone-100">
                  <span className="text-[10px] font-medium text-stone-400 block">Dosage Form</span>
                  <span className="text-xs font-bold text-stone-800 truncate block mt-0.5">
                    {medicine.category_name || pInfo.dosage_form || "Tablet"}
                  </span>
                </div>
                <div className="rounded-xl bg-stone-50/80 p-2.5 border border-stone-100">
                  <span className="text-[10px] font-medium text-stone-400 block">Prescription</span>
                  <span className={`text-xs font-bold truncate block mt-0.5 ${pInfo.rx_required ? "text-rose-600" : "text-emerald-600"}`}>
                    {pInfo.rx_required ? "Yes (Rx)" : "No (OTC)"}
                  </span>
                </div>
                <div className="rounded-xl bg-stone-50/80 p-2.5 border border-stone-100">
                  <span className="text-[10px] font-medium text-stone-400 block">Stock Status</span>
                  <span className="text-xs font-bold text-emerald-600 truncate block mt-0.5">
                    {pInfo.in_stock !== false ? "In Stock" : "Unavailable"}
                  </span>
                </div>
                <div className="rounded-xl bg-stone-50/80 p-2.5 border border-stone-100">
                  <span className="text-[10px] font-medium text-stone-400 block">Pack Size</span>
                  <span className="text-xs font-bold text-stone-800 truncate block mt-0.5">
                    {pInfo.pack_size || "1 unit"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monograph & Prescribing Details Section */}
        <div className="space-y-4 pt-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              Clinical Monograph & Prescribing Details
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Official pharmacological guidelines, clinical indications, dosage, warnings, and precautions.
            </p>
          </div>

          {monographSections.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Pinned Left Table of Contents */}
              <div className="lg:col-span-3 lg:sticky lg:top-20 self-start space-y-2.5">
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

                  <nav className="space-y-0.5">
                    {monographSections.map((sec) => {
                      const IconComponent = sec.icon;
                      const isActive = activeSectionId === sec.id;
                      const isAlternatives = sec.id === "alternatives";
                      return (
                        <React.Fragment key={sec.id}>
                          {isAlternatives && (
                            <div className="pt-1.5 pb-0.5 border-t border-stone-100 my-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 px-1">
                                Related Formulations
                              </span>
                            </div>
                          )}
                          <a
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
                                : isAlternatives
                                ? "text-[#5b15fc] bg-[#5b15fc]/5 hover:bg-[#5b15fc]/15 font-bold"
                                : "text-stone-600 hover:bg-[#5b15fc]/10 hover:text-[#5b15fc]"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <IconComponent className={`size-3.5 shrink-0 ${isActive ? "text-white" : isAlternatives ? "text-[#5b15fc]" : "text-stone-400"}`} />
                              <span className="truncate text-[11px]">{sec.label}</span>
                            </div>
                            <ChevronRight className={`size-2.5 shrink-0 ${isActive ? "text-white/80" : isAlternatives ? "text-[#5b15fc]" : "text-stone-300"}`} />
                          </a>
                        </React.Fragment>
                      );
                    })}
                  </nav>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white/70 p-2.5 text-[10px] text-stone-500 leading-snug flex items-start gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Verified against official drug database monographs.</span>
                </div>
              </div>

              {/* Right Stacked Sections */}
              <div className="lg:col-span-9 space-y-5">
                {monographSections
                  .filter((sec) => sec.content !== "__ALTERNATIVES_SECTION__")
                  .map((sec) => {
                    const IconComponent = sec.icon;
                    return (
                      <section
                        key={sec.id}
                        id={sec.id}
                        className="neo-card rounded-2xl bg-white border border-stone-200 p-6 sm:p-7 space-y-3 shadow-xs scroll-mt-24"
                      >
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

                        {sec.id === "faq" ? (
                          <div className="pt-2">
                            <FaqAccordion content={sec.content || ""} />
                          </div>
                        ) : (
                          <div
                            className="prose prose-stone max-w-none text-xs sm:text-sm text-stone-700 leading-relaxed space-y-2.5
                              [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-stone-300 [&_table]:shadow-2xs
                              [&_thead]:bg-stone-100/90
                              [&_th]:border [&_th]:border-stone-300 [&_th]:py-2.5 [&_th]:px-3.5 [&_th]:font-bold [&_th]:text-stone-900 [&_th]:text-left [&_th]:text-xs [&_th]:tracking-wide
                              [&_tbody_tr]:border-b [&_tbody_tr]:border-stone-200
                              [&_tbody_tr:nth-child(even)]:bg-stone-50/50
                              [&_tbody_tr:hover]:bg-[#5b15fc]/5
                              [&_td]:border [&_td]:border-stone-200 [&_td]:py-2.5 [&_td]:px-3.5 [&_td]:text-stone-700 [&_td]:text-xs [&_td]:align-top
                              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                              [&_strong]:text-stone-900 [&_strong]:font-bold
                              [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:mt-3 [&_h2]:mb-1
                              [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-stone-800 [&_h3]:mt-2 [&_h3]:mb-1
                              [&_p]:leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sec.content || "" }}
                          />
                        )}
                      </section>
                    );
                  })}

                {/* Related Generic Alternatives Section */}
                {medicine.related_medicines && medicine.related_medicines.length > 0 && (
                  <section
                    id="alternatives"
                    className="neo-card rounded-2xl bg-white border border-stone-200 p-6 sm:p-7 space-y-4 shadow-xs scroll-mt-24"
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#5b15fc]/10 text-[#5b15fc]">
                          <Layers className="size-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-stone-900">
                            Related Generic Alternatives ({medicine.related_medicines.length})
                          </h3>
                          <p className="text-[11px] text-stone-400">
                            Therapeutically equivalent products with identical active generic formulation
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#5b15fc] bg-[#5b15fc]/10 px-2 py-0.5 rounded-md">
                        Same Generic
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pt-1">
                      {medicine.related_medicines.map((rel, idx) => (
                        <div
                          key={idx}
                          className="neo-card rounded-xl bg-white border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <Link
                            href={`/pharmacy/${rel.slug}`}
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

                            <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                              <span className="inline-flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-stone-800 border border-stone-200/90 shadow-2xs tracking-wide">
                                <span className="size-1 rounded-full bg-[#5b15fc]" />
                                {rel.category_name || "Tablet"}
                              </span>
                            </div>

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

                          <div className="p-2.5 flex flex-col justify-between flex-1 space-y-2">
                            <div className="space-y-0.5">
                              <div className="flex items-start justify-between gap-1">
                                <Link
                                  href={`/pharmacy/${rel.slug}`}
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
                                href={`/pharmacy/${rel.slug}`}
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
                  </section>
                )}
              </div>
            </div>
          ) : (
            <div className="neo-card rounded-2xl bg-white border border-stone-200 p-8 text-center space-y-2">
              <Info className="size-8 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-800">No Extended Clinical Monograph Available</p>
              <p className="text-xs text-stone-500">
                Official pharmacological data for this medicine is currently being indexed.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Public Footer */}
      <footer className="mt-12 bg-white border-t border-stone-200 py-6 px-4 text-center text-xs text-stone-500">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-bold text-stone-700">Medical Information Disclaimer</p>
          <p className="text-[11px] leading-relaxed text-stone-400">
            The pharmacological monographs, clinical indications, dosages, and interactions presented here are for reference and educational purposes only. They are not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified physician or pharmacist.
          </p>
          <p className="text-[10px] text-stone-400 pt-2">
            © {new Date().getFullYear()} MediTouch Health. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

