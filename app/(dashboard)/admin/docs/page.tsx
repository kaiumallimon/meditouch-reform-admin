"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { getSession, clearSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  Code2,
  Copy,
  Check,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Play,
  Terminal,
  FileCode,
  Layers,
  Server,
  Lock,
  Globe,
  Clock,
  ChevronDown,
  ChevronRight,
  Database,
  Pill,
  Cloud,
  Stethoscope,
  Activity,
  UserCheck,
  RefreshCw,
  LogOut,
  Radio,
  BookOpen,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Hash,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type SdkLang = "nextjs" | "flutter" | "curl";
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "SSE";

interface ParamDef {
  name: string;
  in: "path" | "query" | "body" | "header";
  type: string;
  required: boolean;
  description?: string;
  default?: string;
  example?: any;
}

interface EndpointDoc {
  id: string;
  category: "auth" | "pharmacy" | "sse" | "media" | "telemedicine" | "audit" | "users";
  method: HttpMethod;
  path: string;
  title: string;
  description: string;
  authRequired: boolean;
  rolesAllowed?: string[];
  params?: ParamDef[];
  requestBody?: Record<string, any>;
  responseExample: Record<string, any>;
  nextjsSnippet: string;
  flutterSnippet: string;
  curlSnippet: string;
}

export default function DeveloperDocsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Navigation & Section
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<SdkLang>("nextjs");

  // Live Console Testing states
  const [liveTestLoading, setLiveTestLoading] = useState(false);
  const [liveTestResult, setLiveTestResult] = useState<{
    status: number;
    latencyMs: number;
    headers: Record<string, string>;
    data: any;
  } | null>(null);

  useEffect(() => {
    const s = getSession();
    if (s) {
      setSession(s);
    }
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("meditouch_access_token") || "";
      setToken(storedToken);
    }
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyToken = () => {
    if (!token) {
      toast.error("No active session token found.");
      return;
    }
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    toast.success("Bearer JWT Token copied to clipboard");
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSignOut = () => {
    clearSession();
    toast.success("Signed out successfully");
    router.push("/login");
  };

  // Endpoints Definitions
  const endpoints: EndpointDoc[] = useMemo(
    () => [
      {
        id: "auth-login",
        category: "auth",
        method: "POST",
        path: "/auth/login",
        title: "User & Staff Password Authentication",
        description:
          "Authenticates a user, doctor, nurse, administrator, or developer via their registered phone number or email address and returns a signed JWT access token and refresh token.",
        authRequired: false,
        params: [
          { name: "identifier", in: "body", type: "string", required: true, description: "Phone number (e.g. 01711223344) or Email (e.g. dev@meditouch.com)", example: "01711223344" },
          { name: "password", in: "body", type: "string", required: true, description: "Account secret passphrase or password", example: "CorrectHorseBatteryStaple" }
        ],
        requestBody: {
          identifier: "dev@meditouch.com",
          password: "YourStrongPassword123"
        },
        responseExample: {
          success: true,
          message: "Authentication successful",
          data: {
            access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            token_type: "bearer",
            user_id: "usr_99b1a5e7",
            role: "DEVELOPER",
            name: "Dev Integrator",
            phone: "01711223344",
            email: "dev@meditouch.com"
          }
        },
        nextjsSnippet: `// Next.js 15 / React TypeScript Fetch
export async function loginUser(identifier: string, password: string) {
  const res = await fetch("${API_BASE}/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Authentication failed");
  }
  const result = await res.json();
  return result.data;
}`,
        flutterSnippet: `// Flutter / Dart (package:http)
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> login({
  required String identifier,
  required String password,
}) async {
  final url = Uri.parse('${API_BASE}/auth/login');
  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'identifier': identifier, 'password': password}),
  );

  if (response.statusCode == 200) {
    final body = jsonDecode(response.body);
    return body['data'];
  } else {
    throw Exception('Login failed: \${response.body}');
  }
}`,
        curlSnippet: `curl -X POST "${API_BASE}/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "identifier": "dev@meditouch.com",
    "password": "YourStrongPassword123"
  }'`
      },

      {
        id: "auth-me",
        category: "auth",
        method: "GET",
        path: "/auth/me",
        title: "Get Current Authenticated Profile",
        description: "Returns the profile, role permissions, active session metadata, and verification status of the current Bearer token holder.",
        authRequired: true,
        rolesAllowed: ["USER", "DOCTOR", "NURSE", "ADMIN", "DEVELOPER"],
        responseExample: {
          success: true,
          message: "User profile retrieved",
          data: {
            id: "usr_99b1a5e7",
            name: "Dev Integrator",
            phone: "01711223344",
            email: "dev@meditouch.com",
            role: "DEVELOPER",
            is_active: true,
            is_verified: true,
            avatar_url: "https://res.cloudinary.com/meditouch/image/upload/avatar.png"
          }
        },
        nextjsSnippet: `// Next.js 15 / React TypeScript Fetch
export async function getCurrentUser(token: string) {
  const res = await fetch("${API_BASE}/auth/me", {
    headers: {
      "Authorization": \`Bearer \${token}\`,
      "Accept": "application/json"
    }
  });
  return res.json();
}`,
        flutterSnippet: `// Flutter / Dart (package:http)
Future<Map<String, dynamic>> getCurrentUser(String token) async {
  final res = await http.get(
    Uri.parse('${API_BASE}/auth/me'),
    headers: {
      'Authorization': 'Bearer \$token',
      'Accept': 'application/json',
    },
  );
  return jsonDecode(res.body)['data'];
}`,
        curlSnippet: `curl -X GET "${API_BASE}/auth/me" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"`
      },

      {
        id: "pharmacy-medicines",
        category: "pharmacy",
        method: "GET",
        path: "/pharmacy/medicines",
        title: "Search & Filter Pharmaceutical Catalog",
        description: "Performs full-text search, category filtering, Rx requirements filtering, price sorting, and pagination across 12,000+ indexed medicines.",
        authRequired: false,
        params: [
          { name: "search", in: "query", type: "string", required: false, description: "Drug brand, strength, or generic name", example: "Napa" },
          { name: "category", in: "query", type: "string", required: false, description: "Dosage form category (e.g. tablet, syrup, suspension)" },
          { name: "rx_required", in: "query", type: "boolean", required: false, description: "Filter OTC (false) vs Prescription drugs (true)" },
          { name: "sort_by", in: "query", type: "string", required: false, description: "name_asc | name_desc | price_asc | price_desc", default: "name_asc" },
          { name: "page", in: "query", type: "integer", required: false, description: "1-indexed pagination page", default: "1" },
          { name: "limit", in: "query", type: "integer", required: false, description: "Number of items per page (1 - 100)", default: "24" }
        ],
        responseExample: {
          success: true,
          message: "Medicine catalog retrieved",
          data: {
            items: [
              {
                id: "med_ace_500",
                slug: "ace-500-mg-tablet",
                brand: "Ace",
                generic_name: "Paracetamol",
                dosage_form: "Tablet",
                strength: "500 mg",
                manufacturer: "Square Pharmaceuticals PLC",
                unit_price: 1.20,
                pack_size: "510's Pack",
                medicine_image: "https://res.cloudinary.com/meditouch/image/upload/ace.jpg",
                rx_required: false,
                is_available: true
              }
            ],
            total: 12450,
            page: 1,
            limit: 24,
            total_pages: 519
          }
        },
        nextjsSnippet: `// Next.js 15 / React TypeScript Fetch
export async function getMedicineCatalog(params: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.search) qs.append("search", params.search);
  if (params.category) qs.append("category", params.category);
  if (params.page) qs.append("page", String(params.page));
  if (params.limit) qs.append("limit", String(params.limit));

  const res = await fetch(\`${API_BASE}/pharmacy/medicines?\${qs.toString()}\`, {
    next: { revalidate: 60 },
  });
  return res.json();
}`,
        flutterSnippet: `// Flutter / Dart (package:http)
Future<Map<String, dynamic>> fetchCatalog({
  String? search,
  String? category,
  int page = 1,
  int limit = 24,
}) async {
  final queryParams = {
    if (search != null) 'search': search,
    if (category != null) 'category': category,
    'page': page.toString(),
    'limit': limit.toString(),
  };

  final uri = Uri.parse('${API_BASE}/pharmacy/medicines')
      .replace(queryParameters: queryParams);

  final res = await http.get(uri);
  if (res.statusCode == 200) {
    return jsonDecode(res.body)['data'];
  }
  throw Exception('Failed to load medicine catalog');
}`,
        curlSnippet: `curl -X GET "${API_BASE}/pharmacy/medicines?search=Paracetamol&page=1&limit=10"`
      },

      {
        id: "pharmacy-detail",
        category: "pharmacy",
        method: "GET",
        path: "/pharmacy/medicines/{slug_or_id}",
        title: "Full Clinical Monograph & Pack Pricing",
        description: "Fetches exhaustive clinical details including indications, therapeutic class, adult/pediatric dosages, interactions, side effects, contraindications, pregnancy category, and pack price items.",
        authRequired: false,
        params: [
          { name: "slug_or_id", in: "path", type: "string", required: true, description: "URL slug or MongoDB ObjectID", example: "ace-500-mg-tablet" }
        ],
        responseExample: {
          success: true,
          message: "Medicine details retrieved",
          data: {
            id: "med_ace_500",
            slug: "ace-500-mg-tablet",
            brand: "Ace",
            generic_name: "Paracetamol",
            dosage_form: "Tablet",
            strength: "500 mg",
            manufacturer: "Square Pharmaceuticals PLC",
            unit_prices: [
              { unit_name: "1 Strip (10 Tablets)", price: 12.00, discount_price: 10.80 },
              { unit_name: "1 Box (510 Tablets)", price: 612.00, discount_price: 550.80 }
            ],
            indications: "Fever, headache, toothache, earache, backache, arthralgia, myalgia.",
            dosage_administration: "Adult: 0.5-1 g every 4-6 hours up to a maximum of 4 g daily.",
            contraindications: "Hypersensitivity to paracetamol.",
            side_effects: "Skin rashes, neutropenia, thrombocytopenia are rare.",
            pregnancy_lactation: "Pregnancy Category B. Safe in therapeutic doses.",
            faqs: "Q: Can I take Ace on an empty stomach?\\nA: Yes, it can be taken with or without food."
          }
        },
        nextjsSnippet: `// Next.js 15 / React TypeScript Fetch
export async function getMedicineDetails(slugOrId: string) {
  const res = await fetch(\`${API_BASE}/pharmacy/medicines/\${encodeURIComponent(slugOrId)}\`);
  if (!res.ok) throw new Error("Medicine not found");
  return res.json();
}`,
        flutterSnippet: `// Flutter / Dart (package:http)
Future<Map<String, dynamic>> getMedicineDetail(String slugOrId) async {
  final res = await http.get(
    Uri.parse('${API_BASE}/pharmacy/medicines/\$slugOrId'),
  );
  if (res.statusCode == 200) {
    return jsonDecode(res.body)['data'];
  }
  throw Exception('Drug monograph not found');
}`,
        curlSnippet: `curl -X GET "${API_BASE}/pharmacy/medicines/ace-500-mg-tablet"`
      },

      {
        id: "pharmacy-stream",
        category: "sse",
        method: "SSE",
        path: "/pharmacy/crawler/stream",
        title: "Real-Time Crawler & Ingestion SSE Stream",
        description:
          "High-throughput Server-Sent Events (SSE) stream delivering real-time progress frames during MedEasy web crawling, catalog additions, database upserts, page ingestion counts, and completion signals.",
        authRequired: false,
        responseExample: {
          event: "DRUG_INGESTED",
          data: {
            timestamp: "2026-08-30T04:12:00Z",
            page: 14,
            drug_name: "Napa Extra 500mg+65mg",
            generic_name: "Paracetamol + Caffeine",
            category: "otc-medicine",
            total_ingested_session: 348
          }
        },
        nextjsSnippet: `// Next.js 15 / React SSE Stream Client Hook
import { useEffect, useState } from "react";

export function useCrawlerStream() {
  const [logs, setLogs] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource("${API_BASE}/pharmacy/crawler/stream");

    eventSource.onopen = () => setConnected(true);
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setLogs((prev) => [payload, ...prev]);
      } catch (e) {
        console.log("Raw SSE frame:", event.data);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => eventSource.close();
  }, []);

  return { logs, connected };
}`,
        flutterSnippet: `// Flutter / Dart (package:eventsource)
import 'dart:convert';
import 'package:eventsource/eventsource.dart';

Stream<Map<String, dynamic>> listenToCrawlerEvents() async* {
  final eventSource = await EventSource.connect('${API_BASE}/pharmacy/crawler/stream');

  await for (final event in eventSource) {
    if (event.data != null && event.data!.isNotEmpty) {
      yield jsonDecode(event.data!);
    }
  }
}`,
        curlSnippet: `curl -N -H "Accept: text/event-stream" "${API_BASE}/pharmacy/crawler/stream"`
      },

      {
        id: "media-upload",
        category: "media",
        method: "POST",
        path: "/media/upload",
        title: "Multi-Part Asset Upload to Cloudinary CDN",
        description: "Uploads images, prescriptions, doctor credentials, and documents with automatic SSL compression, edge-caching, and MongoDB metadata registration.",
        authRequired: true,
        rolesAllowed: ["ADMIN", "DEVELOPER", "DOCTOR", "USER"],
        params: [
          { name: "file", in: "body", type: "binary", required: true, description: "Image (PNG, JPG, WEBP) or Document (PDF) up to 20 MB" },
          { name: "folder", in: "query", type: "string", required: false, description: "Cloudinary folder path (e.g. meditouch/general)", default: "meditouch/general" }
        ],
        responseExample: {
          success: true,
          message: "Media asset uploaded successfully",
          data: {
            id: "asset_77f201e",
            public_id: "meditouch/general/rx_9921",
            secure_url: "https://res.cloudinary.com/meditouch/image/upload/v1725/rx_9921.jpg",
            format: "jpg",
            resource_type: "image",
            bytes: 148200,
            original_filename: "prescription_scan.jpg",
            folder: "meditouch/general"
          }
        },
        nextjsSnippet: `// Next.js 15 / React FormData Upload
export async function uploadAsset(file: File, folder = "meditouch/general", token: string) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(\`${API_BASE}/media/upload?folder=\${encodeURIComponent(folder)}\`, {
    method: "POST",
    headers: { "Authorization": \`Bearer \${token}\` },
    body: formData
  });
  return res.json();
}`,
        flutterSnippet: `// Flutter / Dart (MultipartRequest)
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> uploadMediaFile({
  required String filePath,
  required String token,
  String folder = 'meditouch/general',
}) async {
  final uri = Uri.parse('${API_BASE}/media/upload?folder=\$folder');
  final req = http.MultipartRequest('POST', uri)
    ..headers['Authorization'] = 'Bearer \$token'
    ..files.add(await http.MultipartFile.fromPath('file', filePath));

  final streamedRes = await req.send();
  final response = await http.Response.fromStream(streamedRes);
  return jsonDecode(response.body)['data'];
}`,
        curlSnippet: `curl -X POST "${API_BASE}/media/upload?folder=meditouch/general" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \\
  -F "file=@/path/to/prescription.pdf"`
      },

      {
        id: "doctors-list",
        category: "telemedicine",
        method: "GET",
        path: "/doctors",
        title: "Search Verified Doctors & Available Slots",
        description: "Returns doctors filtered by clinical specialty, BMDC verification status, consultation fee range, and experience.",
        authRequired: false,
        params: [
          { name: "specialty", in: "query", type: "string", required: false, description: "e.g. Cardiology, Dermatology, Pediatrics" },
          { name: "search", in: "query", type: "string", required: false, description: "Doctor name, hospital, or degrees" },
          { name: "page", in: "query", type: "integer", required: false, default: "1" },
          { name: "limit", in: "query", type: "integer", required: false, default: "20" }
        ],
        responseExample: {
          success: true,
          message: "Doctors retrieved",
          data: {
            items: [
              {
                id: "doc_01a",
                name: "Prof. Dr. M. A. Hasan",
                bmdc_reg_number: "A-54321",
                specialties: ["Cardiology", "Internal Medicine"],
                qualifications: ["MBBS (DMC)", "FCPS (Med)", "MD (Cardio)"],
                experience_years: 18,
                consultation_fee: 1200.0,
                is_verified: true,
                rating: 4.95,
                avatar_url: "https://res.cloudinary.com/meditouch/image/upload/doctor_1.jpg"
              }
            ],
            total: 48,
            page: 1,
            limit: 20
          }
        },
        nextjsSnippet: `// Next.js 15 / React TypeScript Fetch
export async function getDoctors(specialty?: string, search?: string) {
  const qs = new URLSearchParams();
  if (specialty) qs.append("specialty", specialty);
  if (search) qs.append("search", search);

  const res = await fetch(\`${API_BASE}/doctors?\${qs.toString()}\`);
  return res.json();
}`,
        flutterSnippet: `// Flutter / Dart (package:http)
Future<List<dynamic>> fetchDoctors({String? specialty}) async {
  final uri = Uri.parse('${API_BASE}/doctors')
      .replace(queryParameters: {if (specialty != null) 'specialty': specialty});
  final res = await http.get(uri);
  return jsonDecode(res.body)['data']['items'];
}`,
        curlSnippet: `curl -X GET "${API_BASE}/doctors?specialty=Cardiology"`
      },

      {
        id: "admin-audit-logs",
        category: "audit",
        method: "GET",
        path: "/admin/audit-logs",
        title: "Query Security Audit Trail & Event Logs",
        description: "Returns immutable system audit records, actor user attribution, client IP addresses, target entity IDs, and machine-readable payload differentials.",
        authRequired: true,
        rolesAllowed: ["ADMIN", "DEVELOPER"],
        params: [
          { name: "search", in: "query", type: "string", required: false, description: "Text search in event message or user ID" },
          { name: "action", in: "query", type: "string", required: false, description: "USER_LOGIN, CRAWLER_STARTED, DRUG_CREATED, USER_UPDATED, etc." },
          { name: "page", in: "query", type: "integer", required: false, default: "1" },
          { name: "limit", in: "query", type: "integer", required: false, default: "25" }
        ],
        responseExample: {
          success: true,
          message: "Audit logs retrieved",
          data: {
            items: [
              {
                id: "audit_90124",
                action: "USER_LOGIN",
                message: "User logged in with email: dev@meditouch.com",
                target_type: "USER",
                target_id: "usr_99b1a5e7",
                user_id: "usr_99b1a5e7",
                ip_address: "127.0.0.1",
                created_at: "2026-08-30T04:15:30Z",
                details: { role: "DEVELOPER", method: "PASSWORD" }
              }
            ],
            total: 4180,
            page: 1,
            limit: 25
          }
        },
        nextjsSnippet: `// Next.js 15 / React TypeScript Fetch
export async function getAuditLogs(token: string, page = 1) {
  const res = await fetch(\`${API_BASE}/admin/audit-logs?page=\${page}&limit=25\`, {
    headers: {
      "Authorization": \`Bearer \${token}\`,
      "Accept": "application/json"
    }
  });
  return res.json();
}`,
        flutterSnippet: `// Flutter / Dart (package:http)
Future<Map<String, dynamic>> getAuditLogs(String token, {int page = 1}) async {
  final res = await http.get(
    Uri.parse('${API_BASE}/admin/audit-logs?page=\$page&limit=25'),
    headers: {'Authorization': 'Bearer \$token'},
  );
  return jsonDecode(res.body)['data'];
}`,
        curlSnippet: `curl -X GET "${API_BASE}/admin/audit-logs?limit=10" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"`
      }
    ],
    []
  );

  // Active endpoint if selected
  const activeEndpoint = useMemo(() => {
    return endpoints.find((ep) => ep.id === activeSection) || null;
  }, [endpoints, activeSection]);

  // Execute Live Test Endpoint
  const executeLiveTest = async (ep: EndpointDoc) => {
    setLiveTestLoading(true);
    setLiveTestResult(null);

    const startTime = performance.now();

    try {
      let testUrl = `${API_BASE}${ep.path.replace("{slug_or_id}", "ace-500-mg-tablet")}`;
      let fetchOptions: RequestInit = {
        method: ep.method === "SSE" ? "GET" : ep.method,
        headers: {
          "Accept": "application/json",
        } as Record<string, string>,
      };

      if (ep.authRequired && token) {
        (fetchOptions.headers as any)["Authorization"] = `Bearer ${token}`;
      }

      if (ep.method === "POST" && ep.requestBody) {
        (fetchOptions.headers as any)["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify(ep.requestBody);
      }

      if (ep.method === "SSE") {
        fetchOptions.headers = {
          "Accept": "text/event-stream",
        };
      }

      const res = await fetch(testUrl, fetchOptions);
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      let responseData: any = {};
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        responseData = await res.json();
      } else {
        const text = await res.text();
        responseData = text.slice(0, 1000) || { message: `Stream response status (${res.status})` };
      }

      const headerObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headerObj[key] = val;
      });

      setLiveTestResult({
        status: res.status,
        latencyMs,
        headers: headerObj,
        data: responseData,
      });

      if (res.ok) {
        toast.success(`HTTP ${res.status} OK (${latencyMs}ms)`);
      } else {
        toast.warning(`HTTP ${res.status} Response returned (${latencyMs}ms)`);
      }
    } catch (err: any) {
      const endTime = performance.now();
      setLiveTestResult({
        status: 0,
        latencyMs: Math.round(endTime - startTime),
        headers: {},
        data: { error: err.message || "Network request failed" },
      });
      toast.error("Request Failed", { description: err.message });
    } finally {
      setLiveTestLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-white text-stone-900 overflow-hidden font-sans">
      {/* 1. Left Documentation Navigation Sidebar (Exact Documentation Style) */}
      <aside className="w-64 sm:w-72 border-r border-stone-200/80 bg-stone-50/50 flex flex-col shrink-0 h-full">
        {/* Docs Header */}
        <div className="p-4 border-b border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#5b15fc] text-white shadow-xs">
                <Code2 className="size-4" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-stone-900">
                Docs
              </span>
            </div>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 font-mono">
              v1.0
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 rounded-lg border border-stone-200 bg-white pl-8 pr-3 text-xs text-stone-900 outline-hidden placeholder:text-stone-400 focus:border-[#5b15fc]"
            />
          </div>
        </div>

        {/* Navigation Tree */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 text-xs">
          {/* Section: Overview */}
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Overview
            </p>
            <button
              onClick={() => setActiveSection("intro")}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                activeSection === "intro"
                  ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <BookOpen className="size-3.5" />
              <span>Introduction</span>
            </button>
            <button
              onClick={() => setActiveSection("auth-guide")}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                activeSection === "auth-guide"
                  ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <Lock className="size-3.5" />
              <span>Authentication & JWT</span>
            </button>
            <button
              onClick={() => setActiveSection("sse-guide")}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                activeSection === "sse-guide"
                  ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <Radio className="size-3.5 text-purple-600" />
              <span>Real-Time SSE Streams</span>
            </button>
          </div>

          {/* Section: REST Endpoints */}
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              REST Endpoints
            </p>
            {endpoints.map((ep) => {
              const isActive = activeSection === ep.id;
              const badgeColor =
                ep.method === "GET"
                  ? "text-emerald-700 bg-emerald-50"
                  : ep.method === "POST"
                  ? "text-blue-700 bg-blue-50"
                  : "text-purple-700 bg-purple-50";

              return (
                <button
                  key={ep.id}
                  onClick={() => setActiveSection(ep.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <span className="truncate pr-1">{ep.title}</span>
                  <span className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold shrink-0 ${badgeColor}`}>
                    {ep.method}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Section: Resources */}
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Resources
            </p>
            <a
              href={`${API_BASE.replace('/api/v1', '')}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="size-3.5 text-stone-400" />
                <span>Swagger Interactive UI</span>
              </div>
            </a>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-stone-200/80 bg-white space-y-2">
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span className="truncate font-medium">{session?.name || "Developer"}</span>
            <span className="font-mono text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
              {session?.role || "DEV"}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Documentation Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Top Sticky Tool Bar */}
        <div className="h-13 border-b border-stone-200/80 px-6 flex items-center justify-between gap-4 bg-white/80 backdrop-blur-xs shrink-0 z-10">
          <div className="flex items-center gap-2 text-xs text-stone-500 min-w-0">
            <span>Docs</span>
            <span>/</span>
            <span className="font-semibold text-stone-900 truncate">
              {activeSection === "intro"
                ? "Introduction"
                : activeSection === "auth-guide"
                ? "Authentication Guide"
                : activeSection === "sse-guide"
                ? "Real-Time SSE Streams"
                : activeEndpoint?.title || "API Reference"}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Language Selector */}
            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs">
              <button
                onClick={() => setSelectedLang("nextjs")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedLang === "nextjs" ? "bg-white text-[#5b15fc] shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Next.js / React
              </button>
              <button
                onClick={() => setSelectedLang("flutter")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedLang === "flutter" ? "bg-white text-[#5b15fc] shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Flutter
              </button>
              <button
                onClick={() => setSelectedLang("curl")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedLang === "curl" ? "bg-white text-[#5b15fc] shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                cURL
              </button>
            </div>

            {/* Token Quick Copy */}
            <button
              onClick={handleCopyToken}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer"
            >
              {copiedToken ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-stone-400" />}
              <span>{copiedToken ? "Copied JWT" : "Copy Token"}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 max-w-5xl space-y-10">
          {/* VIEW 1: INTRODUCTION */}
          {activeSection === "intro" && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h1 className="font-heading text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                  Introduction
                </h1>
                <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                  Welcome to the MediTouch Developer Platform API documentation. This reference provides complete specifications, real-time Server-Sent Events (SSE) protocols, and production code snippets for building modern web (Next.js 15 / React) and mobile (Flutter / Dart) healthcare clients.
                </p>
              </div>

              {/* Base URL Box */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Default API Base Endpoint
                </span>
                <div className="flex items-center justify-between font-mono text-xs font-bold text-[#5b15fc]">
                  <span>{API_BASE}</span>
                  <button
                    onClick={() => handleCopy(API_BASE, "base-url")}
                    className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {copiedId === "base-url" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              </div>

              {/* Quick Description */}
              <div className="space-y-3">
                <h2 className="font-heading text-xl font-normal text-stone-900">Standard API Response Envelope</h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  All REST endpoints return standardized JSON payloads wrapped in the uniform envelope format:
                </p>
                <pre className="rounded-xl bg-stone-900 text-stone-100 p-4 text-xs font-mono overflow-x-auto">
                  <code>{`{
  "success": true,
  "message": "Human readable status description",
  "data": { ... }
}`}</code>
                </pre>
              </div>

              {/* Quickstart Code */}
              <div className="space-y-3">
                <h2 className="font-heading text-xl font-normal text-stone-900">Quickstart Installation & Setup</h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Set up your client package environment with dependencies:
                </p>
                {selectedLang === "nextjs" && (
                  <pre className="rounded-xl bg-stone-900 text-stone-100 p-4 text-xs font-mono">
                    <code>{`# Install Next.js 15 Fetch & State utilities
npm install axios swr @tanstack/react-query`}</code>
                  </pre>
                )}
                {selectedLang === "flutter" && (
                  <pre className="rounded-xl bg-stone-900 text-stone-100 p-4 text-xs font-mono">
                    <code>{`# In pubspec.yaml dependencies
dependencies:
  http: ^1.2.0
  eventsource: ^0.4.0`}</code>
                  </pre>
                )}
                {selectedLang === "curl" && (
                  <pre className="rounded-xl bg-stone-900 text-stone-100 p-4 text-xs font-mono">
                    <code>{`# Health check query
curl -X GET "${API_BASE.replace('/api/v1', '')}/health"`}</code>
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: AUTHENTICATION GUIDE */}
          {activeSection === "auth-guide" && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h1 className="font-heading text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                  Authentication & JWT Tokens
                </h1>
                <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                  MediTouch utilizes stateless Bearer JSON Web Tokens (JWT) signed with HMAC SHA-256 for all protected administrative, clinical, and developer endpoints.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
                <h3 className="text-xs font-bold text-indigo-900">Authorization Request Header</h3>
                <p className="text-xs text-indigo-700 font-mono">
                  Authorization: Bearer &lt;YOUR_ACCESS_TOKEN&gt;
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-heading text-xl font-normal text-stone-900">Your Active Developer Token</h2>
                <div className="relative">
                  <pre className="rounded-xl bg-stone-900 text-emerald-400 p-4 text-xs font-mono break-all leading-relaxed max-h-40 overflow-y-auto">
                    <code>{token || "No active token found. Please sign in."}</code>
                  </pre>
                  <button
                    onClick={handleCopyToken}
                    className="absolute top-3 right-3 rounded bg-white/10 hover:bg-white/20 px-2 py-1 text-[10px] font-bold text-white transition-all cursor-pointer"
                  >
                    Copy Token
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: REAL-TIME SSE STREAM GUIDE */}
          {activeSection === "sse-guide" && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h1 className="font-heading text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                  Real-Time Server-Sent Events (SSE)
                </h1>
                <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                  The MediTouch crawler engine broadcasts continuous real-time progress events over persistent HTTP streams using Server-Sent Events (SSE).
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="font-heading text-xl font-normal text-stone-900">Stream Event Types</h2>
                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="py-2.5 px-3">Event Name</th>
                        <th className="py-2.5 px-3">Payload Structure</th>
                        <th className="py-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-700">CONNECTED</td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">{"{ timestamp, status }"}</td>
                        <td className="py-2.5 px-3 text-stone-600">Initial stream handshake</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">PAGE_SCRAPED</td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">{"{ page, items_found }"}</td>
                        <td className="py-2.5 px-3 text-stone-600">Dispatched per catalog page crawl</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">DRUG_INGESTED</td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">{"{ drug_name, generic_name }"}</td>
                        <td className="py-2.5 px-3 text-stone-600">Dispatched per medicine upsert</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: ACTIVE ENDPOINT DETAIL */}
          {activeEndpoint && (
            <div className="space-y-8 animate-in fade-in">
              {/* Endpoint Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold ${
                      activeEndpoint.method === "GET"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : activeEndpoint.method === "POST"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {activeEndpoint.method}
                  </span>
                  <span className="font-mono text-base font-bold text-stone-900">{activeEndpoint.path}</span>
                </div>
                <h1 className="font-heading text-2xl sm:text-3xl font-normal text-stone-900">
                  {activeEndpoint.title}
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {activeEndpoint.description}
                </p>
              </div>

              {/* Parameters Table */}
              {activeEndpoint.params && activeEndpoint.params.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-heading text-lg font-normal text-stone-900">Parameters</h3>
                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        <tr>
                          <th className="py-2.5 px-3">Field</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">In</th>
                          <th className="py-2.5 px-3">Required</th>
                          <th className="py-2.5 px-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 bg-white">
                        {activeEndpoint.params.map((p) => (
                          <tr key={p.name}>
                            <td className="py-2.5 px-3 font-mono font-bold text-stone-900">{p.name}</td>
                            <td className="py-2.5 px-3 font-mono text-purple-700">{p.type}</td>
                            <td className="py-2.5 px-3 font-mono uppercase text-[10px] text-stone-500">{p.in}</td>
                            <td className="py-2.5 px-3">
                              {p.required ? (
                                <span className="font-bold text-rose-600">Yes</span>
                              ) : (
                                <span className="text-stone-400">No</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-stone-600">{p.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Code Snippets & Response */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-normal text-stone-900">
                    {selectedLang === "nextjs"
                      ? "Next.js / TypeScript SDK"
                      : selectedLang === "flutter"
                      ? "Flutter Dart Implementation"
                      : "cURL Terminal Request"}
                  </h3>
                  <button
                    onClick={() =>
                      handleCopy(
                        selectedLang === "nextjs"
                          ? activeEndpoint.nextjsSnippet
                          : selectedLang === "flutter"
                          ? activeEndpoint.flutterSnippet
                          : activeEndpoint.curlSnippet,
                        `code-${activeEndpoint.id}`
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    {copiedId === `code-${activeEndpoint.id}` ? (
                      <>
                        <Check className="size-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-stone-400" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="rounded-xl bg-stone-900 text-stone-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                  <code>
                    {selectedLang === "nextjs"
                      ? activeEndpoint.nextjsSnippet
                      : selectedLang === "flutter"
                      ? activeEndpoint.flutterSnippet
                      : activeEndpoint.curlSnippet}
                  </code>
                </pre>
              </div>

              {/* Response Schema & Live Testing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-normal text-stone-900">200 OK Response Schema</h3>
                  <button
                    onClick={() => executeLiveTest(activeEndpoint)}
                    disabled={liveTestLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#5b15fc] text-white px-3 py-1.5 text-xs font-bold shadow-xs hover:bg-[#4d0ee0] cursor-pointer disabled:opacity-50"
                  >
                    {liveTestLoading ? <Spinner className="size-3.5 text-white" /> : <Play className="size-3.5 fill-white" />}
                    <span>Send Live Request</span>
                  </button>
                </div>

                {liveTestResult ? (
                  <div className="space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-mono px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200">
                      <span className={liveTestResult.status < 400 ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                        HTTP {liveTestResult.status} {liveTestResult.status === 200 ? "OK" : ""}
                      </span>
                      <span className="text-stone-500">{liveTestResult.latencyMs} ms latency</span>
                    </div>
                    <pre className="rounded-xl bg-stone-950 text-emerald-400 p-4 text-xs font-mono overflow-x-auto max-h-72 border border-stone-800 leading-snug">
                      <code>{JSON.stringify(liveTestResult.data, null, 2)}</code>
                    </pre>
                  </div>
                ) : (
                  <pre className="rounded-xl bg-stone-900 text-stone-200 p-4 text-xs font-mono overflow-x-auto max-h-72 border border-stone-800 leading-snug">
                    <code>{JSON.stringify(activeEndpoint.responseExample, null, 2)}</code>
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
