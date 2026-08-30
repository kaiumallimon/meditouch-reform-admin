export interface UserSession {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function saveSession(user: UserSession, accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("meditouch_user", JSON.stringify(user));
  localStorage.setItem("meditouch_access_token", accessToken);
  localStorage.setItem("meditouch_refresh_token", refreshToken);
  // Also set cookie for server components/middleware
  document.cookie = `meditouch_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("meditouch_user");
  localStorage.removeItem("meditouch_access_token");
  localStorage.removeItem("meditouch_refresh_token");
  localStorage.removeItem("meditouch_active_chat_session");
  document.cookie = "meditouch_token=; path=/; max-age=0";
}

export function isTokenExpired(token: string | null, bufferSeconds: number = 0): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return Date.now() >= (payload.exp - bufferSeconds) * 1000;
  } catch {
    return true;
  }
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("meditouch_refresh_token");
  // If refresh token is expired, user must be logged out
  if (!refreshToken || isTokenExpired(refreshToken)) {
    return null;
  }
  const userJson = localStorage.getItem("meditouch_user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("meditouch_refresh_token");
  if (!refreshToken || isTokenExpired(refreshToken)) {
    clearSession();
    return null;
  }
  return refreshToken;
}

let refreshPromise: Promise<string | null> | null = null;

export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem("meditouch_access_token");
  // If access token is valid and has at least 30s remaining, use it directly
  if (accessToken && !isTokenExpired(accessToken, 30)) {
    return accessToken;
  }

  const refreshToken = localStorage.getItem("meditouch_refresh_token");
  if (!refreshToken || isTokenExpired(refreshToken)) {
    // Refresh token expired -> directly logout user
    clearSession();
    if (window.location.pathname.startsWith("/admin")) {
      window.location.href = "/login?session_expired=true";
    }
    return null;
  }

  // Deduplicate concurrent refresh calls
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearSession();
        if (window.location.pathname.startsWith("/admin")) {
          window.location.href = "/login?session_expired=true";
        }
        return null;
      }

      const json = await res.json();
      const data = json.data;
      if (data?.access_token) {
        localStorage.setItem("meditouch_access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("meditouch_refresh_token", data.refresh_token);
        }
        document.cookie = `meditouch_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
        return data.access_token;
      }
      clearSession();
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("meditouch_access_token");
  if (!token || isTokenExpired(token)) return null;
  return token;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("meditouch_access_token");
}

export function isAdmin(): boolean {
  const session = getSession();
  return session?.role === "ADMIN";
}

export function isDeveloper(): boolean {
  const session = getSession();
  return session?.role === "DEVELOPER";
}

export function isStaff(): boolean {
  const session = getSession();
  return session?.role === "ADMIN" || session?.role === "DEVELOPER";
}

