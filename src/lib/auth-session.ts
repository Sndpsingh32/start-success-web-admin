import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

export type AuthLoginResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: unknown;
};

const REFRESH_BUFFER_MS = 3 * 60 * 1000; // refresh 3 min before access token expires
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // background refresh every 10 min

let refreshInFlight: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export function getRefreshToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
}

export function setAuthTokens(access: string, refresh?: string) {
  localStorage.setItem("token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("adminUser");
}

function decodeTokenExpiryMs(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when access token is missing, expired, or expiring within REFRESH_BUFFER_MS. */
export function shouldRefreshAccessToken(token: string | null = getAccessToken()): boolean {
  if (!token) return Boolean(getRefreshToken());
  const exp = decodeTokenExpiryMs(token);
  if (!exp) return false;
  return Date.now() >= exp - REFRESH_BUFFER_MS;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await axios.post<AuthLoginResponse>(`${API_BASE}/auth/refresh`, {
          refresh_token: refresh,
        });
        const token = res.data?.access_token;
        if (!token) return null;
        setAuthTokens(token, res.data?.refresh_token);
        window.dispatchEvent(new CustomEvent("admin-auth-refreshed"));
        return token;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

/** Keep admin logged in — refresh before expiry when possible. */
export async function ensureAdminSession(): Promise<boolean> {
  const token = getAccessToken();
  const refresh = getRefreshToken();
  if (!token && !refresh) return false;
  if (shouldRefreshAccessToken(token)) {
    const next = await refreshAccessToken();
    if (next) return true;
    if (!token) return false;
  }
  return Boolean(getAccessToken());
}

export function startAdminSessionKeepAlive(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const tick = () => {
    if (!getRefreshToken()) return;
    if (shouldRefreshAccessToken()) {
      void refreshAccessToken();
    }
  };

  const intervalId = window.setInterval(tick, REFRESH_INTERVAL_MS);

  const onVisible = () => {
    if (document.visibilityState === "visible") tick();
  };
  document.addEventListener("visibilitychange", onVisible);

  tick();

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
