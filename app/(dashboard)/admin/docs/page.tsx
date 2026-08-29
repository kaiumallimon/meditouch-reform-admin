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
  Share2,
  Folder,
  FolderOpen,
  FileText,
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Send,
  Cpu,
  Monitor,
  Smartphone
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
  category: string;
  group: string;
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

  // Active section state
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<SdkLang>("nextjs");

  // Collapsible tree groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "getting-started": true,
    "pharmacy": true,
    "auth": true,
    "media": false,
    "telemedicine": false,
    "audit": false,
    "sdks": false,
  });

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

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Full Endpoint Catalog
  const endpoints: EndpointDoc[] = useMemo(
    () => [
      // AUTH
      {
        id: "auth-login",
        group: "auth",
        category: "Auth & Identity",
        method: "POST",
        path: "/auth/login",
        title: "User & Staff Password Authentication",
        description:
          "Authenticates a registered phone number or email with a password and issues an HMAC SHA-256 JWT access token and refresh token.",
        authRequired: false,
        params: [
          { name: "identifier", in: "body", type: "string", required: true, description: "Phone number (e.g. 01711223344) or Email (e.g. dev@meditouch.com)", example: "01711223344" },
          { name: "password", in: "body", type: "string", required: true, description: "Plaintext account password", example: "SecurePassphrase123" }
        ],
        requestBody: {
          identifier: "dev@meditouch.com",
          password: "YourStrongPassword123"
        },
        responseExample: {
          success: true,
          message: "Authentication successful",
          data: {
            access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTliMWE1ZTciLCJyb2xlIjoiREVWRUxPUEVSIiwiZXhwIjoxNzI1MDAwMDAwfQ.signature",
            refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTliMWE1ZTciLCJpc19yZWZyZXNoIjp0cnVlfQ.signature",
            token_type: "bearer",
            user_id: "usr_99b1a5e7",
            role: "DEVELOPER",
            name: "Dev Integrator",
            phone: "+880195432200",
            email: "dev@meditouch.com"
          }
        },
        nextjsSnippet: `// lib/api/auth.ts
import axios from "axios";

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  role: "USER" | "DOCTOR" | "NURSE" | "ADMIN" | "DEVELOPER";
  name: string;
}

export async function loginWithCredentials(identifier: string, password: string): Promise<AuthResponse> {
  const response = await axios.post("${API_BASE}/auth/login", {
    identifier,
    password,
  }, {
    headers: { "Content-Type": "application/json" }
  });

  const { data } = response.data;
  localStorage.setItem("meditouch_access_token", data.access_token);
  return data;
}`,
        flutterSnippet: `// lib/services/auth_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  static const String baseUrl = '${API_BASE}';

  Future<Map<String, dynamic>> login({
    required String identifier,
    required String password,
  }) async {
    final url = Uri.parse('\$baseUrl/auth/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': identifier,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return json['data'];
    } else {
      throw Exception('Authentication failed: \${response.body}');
    }
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
        group: "auth",
        category: "Auth & Identity",
        method: "GET",
        path: "/auth/me",
        title: "Get Authenticated Profile",
        description: "Returns the profile, verification status, role, and metadata of the currently authenticated Bearer token.",
        authRequired: true,
        rolesAllowed: ["USER", "DOCTOR", "NURSE", "ADMIN", "DEVELOPER"],
        responseExample: {
          success: true,
          message: "User profile retrieved",
          data: {
            id: "usr_99b1a5e7",
            name: "John Doe",
            phone: "+880195432200",
            email: "kaiumallimon5@gmail.com",
            role: "DEVELOPER",
            is_active: true,
            is_verified: true,
            avatar_url: null
          }
        },
        nextjsSnippet: `// lib/api/user.ts
export async function fetchCurrentUserProfile(token: string) {
  const res = await fetch("${API_BASE}/auth/me", {
    headers: {
      "Authorization": \`Bearer \${token}\`,
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error("Unauthorized");
  return (await res.json()).data;
}`,
        flutterSnippet: `// lib/services/user_service.dart
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

      // PHARMACY
      {
        id: "pharmacy-medicines",
        group: "pharmacy",
        category: "E-Pharmacy & Crawler",
        method: "GET",
        path: "/pharmacy/medicines",
        title: "Search & Filter Pharmaceutical Catalog",
        description: "High-performance full-text search, strength filtering, Rx requirement, and pagination across 12,000+ indexed pharmaceutical products.",
        authRequired: false,
        params: [
          { name: "search", in: "query", type: "string", required: false, description: "Brand name, generic, or strength", example: "Napa" },
          { name: "category", in: "query", type: "string", required: false, description: "e.g. tablet, syrup, suspension, capsule" },
          { name: "rx_required", in: "query", type: "boolean", required: false, description: "Filter OTC (false) vs Prescription (true)" },
          { name: "sort_by", in: "query", type: "string", required: false, description: "name_asc | name_desc | price_asc | price_desc", default: "name_asc" },
          { name: "page", in: "query", type: "integer", required: false, default: "1" },
          { name: "limit", in: "query", type: "integer", required: false, default: "24" }
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
                medicine_image: "https://api.medeasy.health/media/medicines/medeasy_ace_500.jpg",
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
        nextjsSnippet: `// lib/api/pharmacy.ts
export async function searchMedicines(query = "", category = "", page = 1) {
  const params = new URLSearchParams({
    search: query,
    category: category,
    page: String(page),
    limit: "24"
  });

  const res = await fetch(\`${API_BASE}/pharmacy/medicines?\${params.toString()}\`, {
    next: { revalidate: 30 } // ISR Cache
  });
  return (await res.json()).data;
}`,
        flutterSnippet: `// lib/services/pharmacy_service.dart
Future<Map<String, dynamic>> searchMedicines({
  String search = '',
  int page = 1,
}) async {
  final uri = Uri.parse('${API_BASE}/pharmacy/medicines').replace(
    queryParameters: {
      if (search.isNotEmpty) 'search': search,
      'page': page.toString(),
      'limit': '24',
    },
  );
  final res = await http.get(uri);
  return jsonDecode(res.body)['data'];
}`,
        curlSnippet: `curl -X GET "${API_BASE}/pharmacy/medicines?search=Paracetamol&page=1&limit=10"`
      },

      {
        id: "pharmacy-detail",
        group: "pharmacy",
        category: "E-Pharmacy & Crawler",
        method: "GET",
        path: "/pharmacy/medicines/{slug_or_id}",
        title: "Full Clinical Monograph & Pack Pricing",
        description: "Retrieves complete drug monograph including indications, therapeutic class, adult/pediatric dosages, side effects, contraindications, pregnancy warnings, and pack tier pricing.",
        authRequired: false,
        params: [
          { name: "slug_or_id", in: "path", type: "string", required: true, description: "Drug URL slug or MongoDB ID", example: "ace-500-mg-tablet" }
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
        nextjsSnippet: `// lib/api/monograph.ts
export async function getDrugMonograph(slug: string) {
  const res = await fetch(\`${API_BASE}/pharmacy/medicines/\${encodeURIComponent(slug)}\`);
  if (!res.ok) throw new Error("Medicine not found");
  return (await res.json()).data;
}`,
        flutterSnippet: `// lib/services/monograph_service.dart
Future<Map<String, dynamic>> getDrugMonograph(String slug) async {
  final res = await http.get(Uri.parse('${API_BASE}/pharmacy/medicines/\$slug'));
  return jsonDecode(res.body)['data'];
}`,
        curlSnippet: `curl -X GET "${API_BASE}/pharmacy/medicines/ace-500-mg-tablet"`
      },

      {
        id: "pharmacy-stream",
        group: "pharmacy",
        category: "E-Pharmacy & Crawler",
        method: "SSE",
        path: "/pharmacy/crawler/stream",
        title: "Real-Time Crawler & Ingestion SSE Stream",
        description: "Server-Sent Events (SSE) stream delivering real-time progress frames during MedEasy web crawling, catalog ingestion, database upserts, page ingestion counts, and completion signals.",
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
        nextjsSnippet: `// hooks/useCrawlerStream.ts
import { useEffect, useState } from "react";

export function useCrawlerStream() {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource("${API_BASE}/pharmacy/crawler/stream");

    eventSource.onopen = () => setConnected(true);
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setMessages((prev) => [payload, ...prev]);
      } catch {
        // Raw frame
      }
    };

    eventSource.onerror = () => setConnected(false);

    return () => eventSource.close();
  }, []);

  return { messages, connected };
}`,
        flutterSnippet: `// lib/services/crawler_stream.dart
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

      // MEDIA
      {
        id: "media-upload",
        group: "media",
        category: "Cloudinary CDN",
        method: "POST",
        path: "/media/upload",
        title: "Multi-Part Asset Upload to Cloudinary CDN",
        description: "Uploads prescriptions, doctor credentials, and documents with automated SSL optimization, edge-caching, and MongoDB metadata registration.",
        authRequired: true,
        rolesAllowed: ["ADMIN", "DEVELOPER", "DOCTOR", "USER"],
        params: [
          { name: "file", in: "body", type: "binary", required: true, description: "Image (PNG, JPG, WEBP) or Document (PDF) up to 20 MB" },
          { name: "folder", in: "query", type: "string", required: false, description: "Cloudinary folder path (e.g. meditouch/prescriptions)", default: "meditouch/general" }
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
        nextjsSnippet: `// lib/api/cdn.ts
export async function uploadMedia(file: File, folder = "meditouch/general", token: string) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(\`${API_BASE}/media/upload?folder=\${encodeURIComponent(folder)}\`, {
    method: "POST",
    headers: { "Authorization": \`Bearer \${token}\` },
    body: formData
  });
  return (await res.json()).data;
}`,
        flutterSnippet: `// lib/services/media_service.dart
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
  final res = await http.Response.fromStream(streamedRes);
  return jsonDecode(res.body)['data'];
}`,
        curlSnippet: `curl -X POST "${API_BASE}/media/upload?folder=meditouch/general" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \\
  -F "file=@/path/to/prescription.pdf"`
      },

      // TELEMEDICINE
      {
        id: "doctors-list",
        group: "telemedicine",
        category: "Telemedicine & Doctors",
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
        nextjsSnippet: `// lib/api/doctors.ts
export async function getDoctors(specialty?: string, search?: string) {
  const qs = new URLSearchParams();
  if (specialty) qs.append("specialty", specialty);
  if (search) qs.append("search", search);

  const res = await fetch(\`${API_BASE}/doctors?\${qs.toString()}\`);
  return (await res.json()).data;
}`,
        flutterSnippet: `// lib/services/doctor_service.dart
Future<List<dynamic>> fetchDoctors({String? specialty}) async {
  final uri = Uri.parse('${API_BASE}/doctors')
      .replace(queryParameters: {if (specialty != null) 'specialty': specialty});
  final res = await http.get(uri);
  return jsonDecode(res.body)['data']['items'];
}`,
        curlSnippet: `curl -X GET "${API_BASE}/doctors?specialty=Cardiology"`
      },

      // AUDIT
      {
        id: "admin-audit-logs",
        group: "audit",
        category: "Security & Audit",
        method: "GET",
        path: "/admin/audit-logs",
        title: "Query Security Audit Trail & Event Logs",
        description: "Returns immutable system audit records, actor user attribution, client IP addresses, target entity IDs, and machine-readable payload differentials.",
        authRequired: true,
        rolesAllowed: ["ADMIN", "DEVELOPER"],
        params: [
          { name: "search", in: "query", type: "string", required: false, description: "Search in event message or user ID" },
          { name: "action", in: "query", type: "string", required: false, description: "USER_LOGIN, CRAWLER_STARTED, DRUG_CREATED, etc." },
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
        nextjsSnippet: `// lib/api/audit.ts
export async function getAuditLogs(token: string, page = 1) {
  const res = await fetch(\`${API_BASE}/admin/audit-logs?page=\${page}&limit=25\`, {
    headers: { "Authorization": \`Bearer \${token}\` }
  });
  return (await res.json()).data;
}`,
        flutterSnippet: `// lib/services/audit_service.dart
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

  // Filtered list for search
  const filteredEndpoints = useMemo(() => {
    if (!searchQuery.trim()) return endpoints;
    const q = searchQuery.toLowerCase();
    return endpoints.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        ep.path.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q)
    );
  }, [endpoints, searchQuery]);

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
        fetchOptions.headers = { "Accept": "text/event-stream" };
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

  // Reusable Mac Terminal UI Component with inline SDK Language Tabs
  const TerminalWindow = ({
    title,
    code,
    language = "typescript",
    id,
    showLanguageTabs = false,
  }: {
    title: string;
    code: string;
    language?: string;
    id: string;
    showLanguageTabs?: boolean;
  }) => {
    return (
      <div className="rounded-xl border border-stone-800 bg-[#0d1117] overflow-hidden shadow-xl text-stone-100">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-stone-800 select-none flex-wrap gap-2">
          {/* Left: macOS dots + Filename/Title */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 inline-block" />
              <span className="size-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 inline-block" />
              <span className="size-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 inline-block" />
            </div>
            <span className="text-[11px] font-mono text-stone-400 font-medium ml-2">
              {title}
            </span>
          </div>

          {/* Center/Right: SDK Language Tabs (Inside Terminal Header) + Format Badge + Copy */}
          <div className="flex items-center gap-2">
            {showLanguageTabs && (
              <div className="inline-flex rounded-lg border border-stone-700/80 bg-stone-900 p-0.5 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedLang("nextjs")}
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    selectedLang === "nextjs"
                      ? "bg-[#5b15fc] text-white shadow-xs"
                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
                  }`}
                >
                  Next.js / React
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang("flutter")}
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    selectedLang === "flutter"
                      ? "bg-[#5b15fc] text-white shadow-xs"
                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
                  }`}
                >
                  Flutter / Dart
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang("curl")}
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    selectedLang === "curl"
                      ? "bg-[#5b15fc] text-white shadow-xs"
                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
                  }`}
                >
                  cURL
                </button>
              </div>
            )}

            <span className="text-[10px] font-mono font-semibold uppercase text-stone-500 bg-stone-800/80 px-2 py-0.5 rounded">
              {language}
            </span>

            <button
              onClick={() => handleCopy(code, id)}
              className="flex items-center gap-1 rounded bg-stone-800/80 hover:bg-stone-700 text-stone-300 px-2 py-1 text-[11px] font-mono transition-all cursor-pointer shadow-xs"
            >
              {copiedId === id ? (
                <>
                  <Check className="size-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3 text-stone-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Terminal Code Body with JetBrains Mono */}
        <div className="p-4 overflow-x-auto">
          <pre className="font-mono text-[12.5px] leading-relaxed text-stone-200 selection:bg-[#5b15fc]/30">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full bg-white text-stone-900 overflow-hidden font-sans">
      {/* 1. Left Tree-Like Sidebar */}
      <aside className="w-68 sm:w-76 border-r border-stone-200/80 bg-stone-50/70 flex flex-col shrink-0 h-full select-none">
        {/* Docs Title & Version */}
        <div className="p-4 border-b border-stone-200/80 space-y-3 bg-white/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#5b15fc] text-white shadow-xs">
                <Code2 className="size-4" />
              </div>
              <span className="font-heading text-lg font-bold text-stone-900 tracking-tight">
                Docs
              </span>
            </div>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 font-mono">
              v1.0-STABLE
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 rounded-lg border border-stone-200 bg-white pl-8 pr-3 text-xs text-stone-900 outline-hidden placeholder:text-stone-400 focus:border-[#5b15fc] transition-all"
            />
          </div>
        </div>

        {/* Tree Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
          {/* Group 1: Getting Started */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("getting-started")}
              className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {openGroups["getting-started"] ? <FolderOpen className="size-3.5 text-[#5b15fc]" /> : <Folder className="size-3.5 text-stone-400" />}
                <span>Getting Started</span>
              </div>
              {openGroups["getting-started"] ? <ChevronDown className="size-3 text-stone-400" /> : <ChevronRight className="size-3 text-stone-400" />}
            </button>

            {openGroups["getting-started"] && (
              <div className="pl-3 space-y-0.5 border-l-2 border-stone-200/60 ml-2.5">
                <button
                  onClick={() => setActiveSection("intro")}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "intro" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <FileText className="size-3.5 text-stone-400" />
                  <span>Introduction & Envelopes</span>
                </button>
                <button
                  onClick={() => setActiveSection("auth-guide")}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "auth-guide" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Key className="size-3.5 text-stone-400" />
                  <span>Authentication & Bearer JWT</span>
                </button>
                <button
                  onClick={() => setActiveSection("sse-guide")}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "sse-guide" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Radio className="size-3.5 text-purple-600" />
                  <span>Real-Time SSE Protocol</span>
                </button>
              </div>
            )}
          </div>

          {/* Group 2: E-Pharmacy & MedEasy Crawler */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("pharmacy")}
              className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {openGroups["pharmacy"] ? <FolderOpen className="size-3.5 text-[#5b15fc]" /> : <Folder className="size-3.5 text-stone-400" />}
                <span>E-Pharmacy & Crawler</span>
              </div>
              {openGroups["pharmacy"] ? <ChevronDown className="size-3 text-stone-400" /> : <ChevronRight className="size-3 text-stone-400" />}
            </button>

            {openGroups["pharmacy"] && (
              <div className="pl-3 space-y-0.5 border-l-2 border-stone-200/60 ml-2.5">
                <button
                  onClick={() => setActiveSection("pharmacy-medicines")}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "pharmacy-medicines" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <span className="truncate">Search Catalog</span>
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50">GET</span>
                </button>
                <button
                  onClick={() => setActiveSection("pharmacy-detail")}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "pharmacy-detail" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <span className="truncate">Clinical Monograph</span>
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50">GET</span>
                </button>
                <button
                  onClick={() => setActiveSection("pharmacy-stream")}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "pharmacy-stream" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <span className="truncate">Crawler Event Stream</span>
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold text-purple-700 bg-purple-50">SSE</span>
                </button>
              </div>
            )}
          </div>

          {/* Group 3: Auth & Identity */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("auth")}
              className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {openGroups["auth"] ? <FolderOpen className="size-3.5 text-[#5b15fc]" /> : <Folder className="size-3.5 text-stone-400" />}
                <span>Auth & Identity</span>
              </div>
              {openGroups["auth"] ? <ChevronDown className="size-3 text-stone-400" /> : <ChevronRight className="size-3 text-stone-400" />}
            </button>

            {openGroups["auth"] && (
              <div className="pl-3 space-y-0.5 border-l-2 border-stone-200/60 ml-2.5">
                <button
                  onClick={() => setActiveSection("auth-login")}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "auth-login" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <span className="truncate">Password Login</span>
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold text-blue-700 bg-blue-50">POST</span>
                </button>
                <button
                  onClick={() => setActiveSection("auth-me")}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "auth-me" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <span className="truncate">Current Profile</span>
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50">GET</span>
                </button>
              </div>
            )}
          </div>

          {/* Group 4: Cloudinary CDN Media */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("media")}
              className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {openGroups["media"] ? <FolderOpen className="size-3.5 text-[#5b15fc]" /> : <Folder className="size-3.5 text-stone-400" />}
                <span>Cloudinary Media CDN</span>
              </div>
              {openGroups["media"] ? <ChevronDown className="size-3 text-stone-400" /> : <ChevronRight className="size-3 text-stone-400" />}
            </button>

            {openGroups["media"] && (
              <div className="pl-3 space-y-0.5 border-l-2 border-stone-200/60 ml-2.5">
                <button
                  onClick={() => setActiveSection("media-upload")}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "media-upload" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <span className="truncate">Upload Asset</span>
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold text-blue-700 bg-blue-50">POST</span>
                </button>
              </div>
            )}
          </div>

          {/* Group 5: Telemedicine */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("telemedicine")}
              className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {openGroups["telemedicine"] ? <FolderOpen className="size-3.5 text-[#5b15fc]" /> : <Folder className="size-3.5 text-stone-400" />}
                <span>Telemedicine & Clinical</span>
              </div>
              {openGroups["telemedicine"] ? <ChevronDown className="size-3 text-stone-400" /> : <ChevronRight className="size-3 text-stone-400" />}
            </button>

            {openGroups["telemedicine"] && (
              <div className="pl-3 space-y-0.5 border-l-2 border-stone-200/60 ml-2.5">
                <button
                  onClick={() => setActiveSection("doctors-list")}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "doctors-list" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <span className="truncate">Doctor Directory</span>
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50">GET</span>
                </button>
              </div>
            )}
          </div>

          {/* Group 6: Security & Audit */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("audit")}
              className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {openGroups["audit"] ? <FolderOpen className="size-3.5 text-[#5b15fc]" /> : <Folder className="size-3.5 text-stone-400" />}
                <span>Security & Audit Trails</span>
              </div>
              {openGroups["audit"] ? <ChevronDown className="size-3 text-stone-400" /> : <ChevronRight className="size-3 text-stone-400" />}
            </button>

            {openGroups["audit"] && (
              <div className="pl-3 space-y-0.5 border-l-2 border-stone-200/60 ml-2.5">
                <button
                  onClick={() => setActiveSection("admin-audit-logs")}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "admin-audit-logs" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <span className="truncate">Audit Event Trail</span>
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50">GET</span>
                </button>
              </div>
            )}
          </div>

          {/* Group 7: SDK Guides */}
          <div className="space-y-1">
            <button
              onClick={() => toggleGroup("sdks")}
              className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {openGroups["sdks"] ? <FolderOpen className="size-3.5 text-[#5b15fc]" /> : <Folder className="size-3.5 text-stone-400" />}
                <span>SDKs & Client Libraries</span>
              </div>
              {openGroups["sdks"] ? <ChevronDown className="size-3 text-stone-400" /> : <ChevronRight className="size-3 text-stone-400" />}
            </button>

            {openGroups["sdks"] && (
              <div className="pl-3 space-y-0.5 border-l-2 border-stone-200/60 ml-2.5">
                <button
                  onClick={() => {
                    setSelectedLang("nextjs");
                    setActiveSection("sdk-nextjs");
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "sdk-nextjs" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Monitor className="size-3.5 text-stone-400" />
                  <span>Next.js 15 (TypeScript)</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedLang("flutter");
                    setActiveSection("sdk-flutter");
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 font-medium transition-colors cursor-pointer text-left ${
                    activeSection === "sdk-flutter" ? "bg-[#5b15fc]/10 text-[#5b15fc] font-bold" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Smartphone className="size-3.5 text-stone-400" />
                  <span>Flutter (Dart)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-stone-200/80 bg-white/60 text-[10px] text-stone-400 font-mono text-center">
          MediTouch Developer API v1.0
        </div>
      </aside>

      {/* 2. Main Documentation Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Top Sticky Tool Bar */}
        <div className="h-13 border-b border-stone-200/80 px-6 flex items-center justify-between gap-4 bg-white/90 backdrop-blur-xs shrink-0 z-10">
          <div className="flex items-center gap-2 text-xs text-stone-500 min-w-0">
            <span className="font-semibold text-stone-400">Documentation</span>
            <span>/</span>
            <span className="font-semibold text-stone-900 truncate">
              {activeSection === "intro"
                ? "Introduction"
                : activeSection === "auth-guide"
                ? "Authentication Guide"
                : activeSection === "sse-guide"
                ? "Real-Time SSE Streams"
                : activeSection === "sdk-nextjs"
                ? "Next.js 15 TypeScript SDK"
                : activeSection === "sdk-flutter"
                ? "Flutter Dart SDK"
                : activeEndpoint?.title || "API Reference"}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live API Health Status */}
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-700 shadow-2xs">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>API Online</span>
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

        {/* Main Content Area (Clean Centered Layout) */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-10 w-full flex justify-center">
          <div className="w-full max-w-4xl space-y-10">
            {/* VIEW 1: INTRODUCTION */}
            {activeSection === "intro" && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h1 className="font-heading text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                    Introduction
                  </h1>
                  <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                    The MediTouch Platform provides unified RESTful APIs and low-latency Server-Sent Events (SSE) event streams powering rural telemedicine consultations, MedEasy pharmacy crawling, clinical drug monographs, and encrypted Cloudinary media asset delivery.
                  </p>
                </div>

                {/* Base URL Box */}
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Default API Base URL
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

                {/* Envelope Design */}
                <div className="space-y-3">
                  <h2 className="font-heading text-xl font-normal text-stone-900">Standardized Response Envelope</h2>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    All JSON responses adhere to the standard envelope format:
                  </p>
                  <TerminalWindow
                    title="response_envelope.json"
                    language="json"
                    id="envelope-json"
                    code={`{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "items": [...],
    "total": 120
  }
}`}
                  />
                </div>

                {/* Quickstart Boilerplates with inline Language Tabs */}
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-normal text-stone-900">Client Installation & Setup</h2>
                  <TerminalWindow
                    title={
                      selectedLang === "nextjs"
                        ? "terminal.sh"
                        : selectedLang === "flutter"
                        ? "pubspec.yaml"
                        : "terminal.sh"
                    }
                    language={
                      selectedLang === "nextjs"
                        ? "bash"
                        : selectedLang === "flutter"
                        ? "yaml"
                        : "bash"
                    }
                    id={`intro-setup-${selectedLang}`}
                    showLanguageTabs={true}
                    code={
                      selectedLang === "nextjs"
                        ? `# Initialize Next.js 15 Client Dependencies\nnpm install axios @tanstack/react-query lucide-react sonner`
                        : selectedLang === "flutter"
                        ? `dependencies:\n  flutter:\n    sdk: flutter\n  http: ^1.2.0\n  eventsource: ^0.4.0`
                        : `# Check API Server Status\ncurl -X GET "${API_BASE.replace('/api/v1', '')}/health"`
                    }
                  />
                </div>
              </div>
            )}

            {/* VIEW 2: AUTHENTICATION GUIDE */}
            {activeSection === "auth-guide" && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h1 className="font-heading text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                    Authentication & JWT Security
                  </h1>
                  <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                    MediTouch secures protected endpoints using Bearer JSON Web Tokens (JWT) signed with HMAC SHA-256 algorithm.
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-1.5">
                  <h3 className="text-xs font-bold text-indigo-900">HTTP Authorization Header</h3>
                  <p className="text-xs font-mono text-indigo-800">
                    Authorization: Bearer &lt;YOUR_ACCESS_TOKEN&gt;
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="font-heading text-xl font-normal text-stone-900">Active Developer Bearer Token</h2>
                  <TerminalWindow
                    title="jwt_session_token.env"
                    language="jwt"
                    id="jwt-token-box"
                    code={token || "No active token found in session. Please sign in."}
                  />
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
                    The MediTouch crawler engine broadcasts continuous real-time progress events over persistent HTTP streams using standard Server-Sent Events (<code className="font-mono text-xs text-[#5b15fc] bg-[#5b15fc]/10 px-1 py-0.5 rounded">text/event-stream</code>).
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="font-heading text-xl font-normal text-stone-900">Event Types & Payload Schemas</h2>
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
                          <td className="py-2.5 px-3 font-mono text-stone-600">{"{ timestamp, status, active_jobs }"}</td>
                          <td className="py-2.5 px-3 text-stone-600">Initial stream handshake acknowledgment</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">PAGE_SCRAPED</td>
                          <td className="py-2.5 px-3 font-mono text-stone-600">{"{ page, items_found, duration_ms }"}</td>
                          <td className="py-2.5 px-3 text-stone-600">Emitted when a catalog category page finishes scraping</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">DRUG_INGESTED</td>
                          <td className="py-2.5 px-3 font-mono text-stone-600">{"{ drug_name, generic_name, slug, is_upsert }"}</td>
                          <td className="py-2.5 px-3 text-stone-600">Emitted when a medicine is inserted or updated in MongoDB</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-mono font-bold text-rose-700">CRAWLER_STOPPED</td>
                          <td className="py-2.5 px-3 font-mono text-stone-600">{"{ reason, total_inserted, total_skipped }"}</td>
                          <td className="py-2.5 px-3 text-stone-600">Emitted when crawling completes or is halted</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: SDK GUIDES (NEXTJS & FLUTTER) */}
            {activeSection === "sdk-nextjs" && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h1 className="font-heading text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                    Next.js 15+ (TypeScript) SDK Integration
                  </h1>
                  <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                    Production-ready API client supporting Server Components, Server Actions, Incremental Static Regeneration (ISR), and Client Hooks.
                  </p>
                </div>

                <TerminalWindow
                  title="lib/meditouch-sdk.ts"
                  language="typescript"
                  id="sdk-nextjs-code"
                  code={`import axios from "axios";

export const meditouch = {
  baseURL: "${API_BASE}",

  // Pharmacy Catalog Search
  async getMedicines(params?: { search?: string; page?: number; limit?: number }) {
    const res = await axios.get(\`\${this.baseURL}/pharmacy/medicines\`, { params });
    return res.data.data;
  },

  // Drug Monograph
  async getMedicineDetail(slug: string) {
    const res = await axios.get(\`\${this.baseURL}/pharmacy/medicines/\${slug}\`);
    return res.data.data;
  },

  // Media CDN Upload
  async uploadFile(file: File, token: string) {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post(\`\${this.baseURL}/media/upload\`, form, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    return res.data.data;
  }
};`}
                />
              </div>
            )}

            {activeSection === "sdk-flutter" && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h1 className="font-heading text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight">
                    Flutter (Dart) SDK Integration
                  </h1>
                  <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                    Asynchronous Dart service for mobile apps with SSE streaming and JSON serialization.
                  </p>
                </div>

                <TerminalWindow
                  title="lib/services/meditouch_api.dart"
                  language="dart"
                  id="sdk-flutter-code"
                  code={`import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:eventsource/eventsource.dart';

class MediTouchApi {
  static const String baseUrl = '${API_BASE}';

  // Fetch Catalog
  static Future<Map<String, dynamic>> fetchCatalog({String search = '', int page = 1}) async {
    final uri = Uri.parse('\$baseUrl/pharmacy/medicines').replace(
      queryParameters: {if (search.isNotEmpty) 'search': search, 'page': '\$page'},
    );
    final res = await http.get(uri);
    return jsonDecode(res.body)['data'];
  }

  // Real-Time Crawler SSE Stream
  static Stream<Map<String, dynamic>> streamCrawlerEvents() async* {
    final client = await EventSource.connect('\$baseUrl/pharmacy/crawler/stream');
    await for (final event in client) {
      if (event.data != null && event.data!.isNotEmpty) {
        yield jsonDecode(event.data!);
      }
    }
  }
}`}
                />
              </div>
            )}

            {/* VIEW 5: ACTIVE ENDPOINT DETAIL (Centered Single-Column Flow) */}
            {activeEndpoint && (
              <div className="space-y-10 animate-in fade-in">
                {/* 1. Endpoint Header */}
                <div className="space-y-3 border-b border-stone-200/80 pb-6">
                  <div className="flex items-center gap-3 flex-wrap">
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
                    {activeEndpoint.authRequired ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <Lock className="size-2.5" />
                        Bearer Token Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Globe className="size-2.5" />
                        Public Endpoint
                      </span>
                    )}
                  </div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-normal text-stone-900">
                    {activeEndpoint.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {activeEndpoint.description}
                  </p>
                </div>

                {/* 2. Request Parameters */}
                {activeEndpoint.params && activeEndpoint.params.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-heading text-lg font-normal text-stone-900">Request Parameters</h3>
                    <div className="overflow-x-auto rounded-xl border border-stone-200 shadow-2xs">
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

                {/* 3. Multi-Language Code Snippet with Terminal Language Tabs */}
                <div className="space-y-3">
                  <h3 className="font-heading text-lg font-normal text-stone-900">
                    Integration Code Snippet
                  </h3>

                  <TerminalWindow
                    title={
                      selectedLang === "nextjs"
                        ? `${activeEndpoint.id}.ts`
                        : selectedLang === "flutter"
                        ? `${activeEndpoint.id}.dart`
                        : `request.sh`
                    }
                    language={selectedLang === "nextjs" ? "typescript" : selectedLang === "flutter" ? "dart" : "bash"}
                    id={`code-${activeEndpoint.id}-${selectedLang}`}
                    showLanguageTabs={true}
                    code={
                      selectedLang === "nextjs"
                        ? activeEndpoint.nextjsSnippet
                        : selectedLang === "flutter"
                        ? activeEndpoint.flutterSnippet
                        : activeEndpoint.curlSnippet
                    }
                  />
                </div>

                {/* 4. 200 OK Response Schema & Live Testing */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg font-normal text-stone-900">
                      200 OK Standard Response
                    </h3>
                    <button
                      onClick={() => executeLiveTest(activeEndpoint)}
                      disabled={liveTestLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#5b15fc] text-white px-3 py-1.5 text-xs font-bold shadow-xs hover:bg-[#4d0ee0] cursor-pointer disabled:opacity-50 transition-all"
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
                      <TerminalWindow
                        title="live_response.json"
                        language="json"
                        id="live-response-output"
                        code={JSON.stringify(liveTestResult.data, null, 2)}
                      />
                    </div>
                  ) : (
                    <TerminalWindow
                      title="example_response.json"
                      language="json"
                      id={`res-${activeEndpoint.id}`}
                      code={JSON.stringify(activeEndpoint.responseExample, null, 2)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
