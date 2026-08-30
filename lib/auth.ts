export interface UserSession {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("meditouch_access_token");
  if (!token || isTokenExpired(token)) return null;
  const userJson = localStorage.getItem("meditouch_user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("meditouch_access_token");
  if (!token || isTokenExpired(token)) return null;
  return token;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("meditouch_refresh_token");
}

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
  document.cookie = "meditouch_token=; path=/; max-age=0";
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

