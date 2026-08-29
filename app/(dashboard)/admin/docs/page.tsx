"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { getSession } from "@/lib/auth";
import {
  Code2,
  Copy,
  Check,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Radio,
  Play,
  Terminal,
  FileCode,
  Layers,
  Sparkles,
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
  Eye,
  KeyRound,
  Send,
  AlertTriangle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

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
  const [session, setSession] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [globalLang, setGlobalLang] = useState<SdkLang>("nextjs");

  // Expanded cards
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    "auth-login": true,
    "pharmacy-stream": true,
  });

  // Live Console Testing states
  const [testingEndpointId, setTestingEndpointId] = useState<string | null>(null);
  const [liveTestLoading, setLiveTestLoading] = useState(false);
  const [liveTestResult, setLiveTestResult] = useState<{
    endpointId: string;
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
      toast.error("No active session token found. Please sign in.");
      return;
    }
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    toast.success("Bearer JWT Token copied to clipboard");
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedEndpoints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Endpoint Definitions
  const endpoints: EndpointDoc[] = useMemo(
    () => [
      // 1. AUTHENTICATION
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
          {
            name: "identifier",
            in: "body",
            type: "string",
            required: true,
            description: "Phone number (e.g. 01711223344) or Email (e.g. dev@meditouch.com)",
            example: "01711223344"
          },
          {
            name: "password",
            in: "body",
            type: "string",
            required: true,
            description: "Account secret passphrase or password",
            example: "CorrectHorseBatteryStaple"
          }
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
  // Store result.data.access_token securely
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
    body: jsonEncode({
      'identifier': identifier,
      'password': password,
    }),
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

      // 2. PHARMACY CATALOG & MONOGRAPH
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
          { name: "sort_by", in: "query", type: "string", required: false, description: "name_asc | name_desc | price_asc | price_desc | created_desc", default: "name_asc" },
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
    next: { revalidate: 60 }, // Cache in Next.js ISR
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

      // 3. REAL-TIME SSE STREAM
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
        nextjsSnippet: `// Next.js 15 / React SSE Stream Client (Browser / React Hook)
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
      // Auto-reconnects by default in browser EventSource
    };

    return () => eventSource.close();
  }, []);

  return { logs, connected };
}`,
        flutterSnippet: `// Flutter / Dart (using package:eventsource or sse_channel)
import 'dart:convert';
import 'package:eventsource/eventsource.dart';

Stream<Map<String, dynamic>> listenToCrawlerEvents() async* {
  final eventSource = await EventSource.connect('${API_BASE}/pharmacy/crawler/stream');

  await for (final event in eventSource) {
    if (event.data != null && event.data!.isNotEmpty) {
      final decoded = jsonDecode(event.data!);
      yield decoded;
    }
  }
}`,
        curlSnippet: `curl -N -H "Accept: text/event-stream" "${API_BASE}/pharmacy/crawler/stream"`
      },

      // 4. CLOUDINARY CDN & MEDIA
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
          { name: "file", in: "body", type: "binary", required: true, description: "Image (PNG, JPG, WEBP, SVG) or Document (PDF, DOCX) up to 20 MB" },
          { name: "folder", in: "query", type: "string", required: false, description: "Cloudinary folder path (e.g. meditouch/general, meditouch/prescriptions)", default: "meditouch/general" }
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
    headers: {
      "Authorization": \`Bearer \${token}\`
    },
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

      // 5. DOCTORS & TELEMEDICINE
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

      // 6. AUDIT LOGS
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
          { name: "target_type", in: "query", type: "string", required: false, description: "USER, DOCTOR, MEDICINE, ORDER, SYSTEM" },
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
            limit: 25,
            total_pages: 168
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

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchCat = selectedCategory === "ALL" || ep.category === selectedCategory;
      const matchMethod = selectedMethod === "ALL" || ep.method === selectedMethod;
      const matchSearch =
        !search.trim() ||
        ep.title.toLowerCase().includes(search.toLowerCase()) ||
        ep.path.toLowerCase().includes(search.toLowerCase()) ||
        ep.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchMethod && matchSearch;
    });
  }, [endpoints, selectedCategory, selectedMethod, search]);

  // Execute Live Test Endpoint
  const executeLiveTest = async (ep: EndpointDoc) => {
    setTestingEndpointId(ep.id);
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
        responseData = text.slice(0, 1000) || { message: `Stream probe response (${res.status})` };
      }

      const headerObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headerObj[key] = val;
      });

      setLiveTestResult({
        endpointId: ep.id,
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
        endpointId: ep.id,
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
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
              MediTouch API Reference & Developer SDK Portal
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 font-mono">
              <Code2 className="size-3" />
              v1.0-STABLE
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Complete OpenAPI 3.1 specifications, real-time SSE stream protocols, and production code generators for Next.js, React, and Flutter.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`${API_BASE.replace('/api/v1', '')}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer"
          >
            <ExternalLink className="size-3.5 text-stone-500" />
            <span>FastAPI Swagger UI</span>
          </a>
        </div>
      </div>

      {/* 2. Active Session Auth Bar */}
      <div className="neo-card rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white p-4 sm:p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Active Developer Session & JWT Authorization
              </span>
              <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-mono font-bold">
                {session?.role || "DEVELOPER"}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-mono break-all max-w-2xl">
              {token ? `Bearer ${token.slice(0, 36)}...${token.slice(-16)}` : "No active JWT token loaded."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyToken}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
            >
              {copiedToken ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Copied JWT!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-stone-300" />
                  <span>Copy Bearer Token</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Top Architecture Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Endpoints</span>
          <p className="font-heading text-2xl font-bold text-stone-900">28</p>
          <p className="text-[10px] text-stone-400 font-medium">REST & RPC routes</p>
        </div>

        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">SSE Stream</span>
          <p className="font-heading text-2xl font-bold text-purple-600">Active</p>
          <p className="text-[10px] text-stone-400 font-medium">Crawler event bus</p>
        </div>

        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">SDK Targets</span>
          <p className="font-heading text-2xl font-bold text-[#5b15fc]">3 SDKs</p>
          <p className="text-[10px] text-stone-400 font-medium">Next.js, Flutter, cURL</p>
        </div>

        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Rate Limit</span>
          <p className="font-heading text-2xl font-bold text-emerald-600">120/min</p>
          <p className="text-[10px] text-stone-400 font-medium">Per IP token window</p>
        </div>

        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Security</span>
          <p className="font-heading text-2xl font-bold text-blue-600">JWT + SSL</p>
          <p className="text-[10px] text-stone-400 font-medium">256-bit encrypted</p>
        </div>

        <div className="neo-card rounded-2xl bg-white p-4 border border-stone-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Response</span>
          <p className="font-heading text-2xl font-bold text-amber-600">JSON</p>
          <p className="text-[10px] text-stone-400 font-medium">Standard envelope</p>
        </div>
      </div>

      {/* 4. Controls: Global SDK Selector, Search, Method, Category */}
      <div className="neo-card rounded-[24px] bg-white p-4 sm:p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
            <input
              type="text"
              placeholder="Filter by route path, keyword, or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-4 text-xs font-semibold text-stone-900 neo-input outline-hidden placeholder:text-stone-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* HTTP Method Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="h-10 rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-800 shadow-xs outline-hidden cursor-pointer"
            >
              <option value="ALL">All HTTP Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="SSE">SSE (Streams)</option>
            </select>

            {/* Language Switcher Tabs */}
            <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1 shadow-xs">
              <button
                onClick={() => setGlobalLang("nextjs")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  globalLang === "nextjs" ? "bg-white text-[#5b15fc] shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>⚛️ Next.js / React</span>
              </button>
              <button
                onClick={() => setGlobalLang("flutter")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  globalLang === "flutter" ? "bg-white text-[#5b15fc] shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>🎯 Flutter / Dart</span>
              </button>
              <button
                onClick={() => setGlobalLang("curl")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  globalLang === "curl" ? "bg-white text-[#5b15fc] shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>💻 cURL / CLI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
          {[
            { id: "ALL", label: "All Modules" },
            { id: "auth", label: "🔑 Auth & JWT" },
            { id: "pharmacy", label: "💊 E-Pharmacy & MedEasy" },
            { id: "sse", label: "⚡ Real-Time SSE Stream" },
            { id: "media", label: "☁️ Cloudinary CDN" },
            { id: "telemedicine", label: "🩺 Doctors & Clinical" },
            { id: "audit", label: "🛡️ Audit Trails" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#5b15fc] text-white shadow-xs"
                  : "bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Endpoints Documentation Accordion */}
      <div className="space-y-4">
        {filteredEndpoints.length === 0 ? (
          <div className="neo-card rounded-2xl bg-white p-12 text-center border border-stone-200">
            <Code2 className="size-8 text-stone-400 mx-auto mb-2" />
            <p className="text-base font-bold text-stone-900">No Endpoints Match Your Filter</p>
            <p className="text-xs text-stone-500 mt-1">Try clearing your search keyword or method filter.</p>
          </div>
        ) : (
          filteredEndpoints.map((ep) => {
            const isExpanded = expandedEndpoints[ep.id] ?? false;

            const methodColor =
              ep.method === "GET"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : ep.method === "POST"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : ep.method === "PATCH"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : ep.method === "DELETE"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-purple-50 text-[#5b15fc] border-purple-200 animate-pulse";

            const codeSnippet =
              globalLang === "nextjs"
                ? ep.nextjsSnippet
                : globalLang === "flutter"
                ? ep.flutterSnippet
                : ep.curlSnippet;

            const isCurrentTest = testingEndpointId === ep.id && liveTestResult;

            return (
              <div
                key={ep.id}
                className="neo-card rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-xs transition-all hover:border-stone-300"
              >
                {/* Header Bar */}
                <div
                  onClick={() => toggleExpand(ep.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 bg-stone-50/40 cursor-pointer hover:bg-stone-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-mono font-bold border ${methodColor}`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-stone-900 truncate">
                      {ep.path}
                    </span>
                    <span className="text-xs text-stone-500 hidden md:inline truncate">
                      — {ep.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ep.authRequired ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <Lock className="size-2.5" />
                        Bearer Token
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Globe className="size-2.5" />
                        Public
                      </span>
                    )}

                    <div className="p-1 text-stone-400 hover:text-stone-700">
                      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                {isExpanded && (
                  <div className="p-5 space-y-5 border-t border-stone-100">
                    {/* Description */}
                    <div>
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">{ep.description}</p>
                    </div>

                    {/* Parameters Table */}
                    {ep.params && ep.params.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                          Parameters & Query Fields
                        </h4>
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
                              {ep.params.map((param) => (
                                <tr key={param.name}>
                                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                                    {param.name}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-purple-700">{param.type}</td>
                                  <td className="py-2.5 px-3 font-mono text-stone-500 uppercase text-[10px]">
                                    {param.in}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {param.required ? (
                                      <span className="text-rose-600 font-bold">Yes</span>
                                    ) : (
                                      <span className="text-stone-400 font-medium">Optional</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-stone-600">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Code Snippet & Live Console Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Left: Multi-SDK Code Generator */}
                      <div className="lg:col-span-7 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCode className="size-3.5 text-stone-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                              {globalLang === "nextjs"
                                ? "Next.js 15 TypeScript SDK"
                                : globalLang === "flutter"
                                ? "Flutter Dart HTTP Client"
                                : "cURL Terminal Command"}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(codeSnippet, `code-${ep.id}`)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                          >
                            {copiedId === `code-${ep.id}` ? (
                              <>
                                <Check className="size-3 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3 text-stone-500" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="rounded-xl bg-stone-900 text-stone-100 p-3.5 text-xs font-mono overflow-x-auto leading-relaxed border border-stone-800">
                          <code>{codeSnippet}</code>
                        </pre>
                      </div>

                      {/* Right: Response Example & Live Tester */}
                      <div className="lg:col-span-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                            200 OK JSON Schema
                          </span>
                          <button
                            onClick={() => executeLiveTest(ep)}
                            disabled={liveTestLoading}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#5b15fc] text-white px-2.5 py-1 text-[11px] font-bold shadow-xs hover:bg-[#4d0ee0] cursor-pointer disabled:opacity-50"
                          >
                            {liveTestLoading && testingEndpointId === ep.id ? (
                              <Spinner className="size-3 text-white" />
                            ) : (
                              <Play className="size-3 fill-white" />
                            )}
                            <span>Test Endpoint</span>
                          </button>
                        </div>

                        {/* Live Response Result if tested */}
                        {isCurrentTest ? (
                          <div className="space-y-1.5 animate-in fade-in">
                            <div className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-stone-100 border border-stone-200">
                              <span className={liveTestResult.status < 400 ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                                Status: {liveTestResult.status} {liveTestResult.status === 200 ? "OK" : ""}
                              </span>
                              <span className="text-stone-500">{liveTestResult.latencyMs} ms</span>
                            </div>
                            <pre className="rounded-xl bg-stone-950 text-emerald-400 p-3 text-[11px] font-mono overflow-x-auto max-h-56 leading-snug border border-stone-800">
                              <code>{JSON.stringify(liveTestResult.data, null, 2)}</code>
                            </pre>
                          </div>
                        ) : (
                          <pre className="rounded-xl bg-stone-900 text-stone-200 p-3 text-[11px] font-mono overflow-x-auto max-h-56 leading-snug border border-stone-800">
                            <code>{JSON.stringify(ep.responseExample, null, 2)}</code>
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
