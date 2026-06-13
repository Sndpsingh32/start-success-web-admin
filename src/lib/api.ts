import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import {
  clearAdminSession,
  ensureAdminSession,
  getAccessToken,
  refreshAccessToken,
  shouldRefreshAccessToken,
  type AuthLoginResponse,
} from "./auth-session";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";
const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE ?? API_BASE).replace(/\/$/, "");
const S3_MEDIA_HOST = import.meta.env.VITE_S3_MEDIA_BASE?.replace(/\/$/, "") ?? null;

/** Resolve `/uploads/...`, S3 keys, or absolute URLs for admin previews. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const trimmed = path.trim();
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const apiBase = API_BASE.replace(/\/$/, "");
    if (apiBase.includes("localhost") && trimmed.includes("/uploads/")) {
      return `${apiBase}${trimmed.slice(trimmed.indexOf("/uploads/"))}`;
    }
    return trimmed;
  }
  const uploadsIdx = trimmed.indexOf("/uploads/");
  if (uploadsIdx !== -1) {
    return `${MEDIA_BASE}${trimmed.slice(uploadsIdx)}`;
  }
  if (S3_MEDIA_HOST && /^(videos|images|media|avatars|kyc)\//.test(trimmed)) {
    return `${S3_MEDIA_HOST}/${trimmed}`;
  }
  return `${MEDIA_BASE}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

/**
 * Custom Axios instance type that reflects our interceptor's behavior
 * (returning response.data directly instead of the full AxiosResponse).
 */
interface CustomAxiosInstance extends AxiosInstance {
  get<T = any, R = T>(url: string, config?: any): Promise<R>;
  post<T = any, R = T, D = any>(url: string, data?: D, config?: any): Promise<R>;
  put<T = any, R = T, D = any>(url: string, data?: D, config?: any): Promise<R>;
  delete<T = any, R = T>(url: string, config?: any): Promise<R>;
}

const instance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
}) as CustomAxiosInstance;

function isAuthRoute(url?: string): boolean {
  if (!url) return false;
  return url.includes("/auth/login") || url.includes("/auth/refresh");
}

// Proactively refresh before expiry; attach latest Bearer token to every request
instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!isAuthRoute(config.url) && shouldRefreshAccessToken()) {
      await refreshAccessToken();
    }
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthRoute(original.url)
    ) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return instance.request(original);
      }
      clearAdminSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/signin")) {
        window.location.href = "/signin";
      }
    }

    const message = error.response?.data?.message || error.message || "Request failed";
    const errorMessage = Array.isArray(message) ? message.join(" ") : message;
    if (status === 401) {
      return Promise.reject(
        new Error(
          typeof errorMessage === "string" && errorMessage.toLowerCase().includes("unauthorized")
            ? "Session expired. Please sign in again as admin."
            : errorMessage,
        ),
      );
    }
    return Promise.reject(new Error(errorMessage));
  },
);

export { clearAdminSession, ensureAdminSession, refreshAccessToken };
export type { AuthLoginResponse };

export type AuthMeResponse = {
  _id?: string;
  email?: string;
  name?: string;
  role?: string;
};

export const api = {
  auth: {
    login: (email: string, password: string) =>
      instance.post<AuthLoginResponse & { user?: AuthMeResponse }>("/auth/login", {
        username: email.trim(),
        password,
      }),
    me: () => instance.get<AuthMeResponse>("/auth/me"),
    refresh: (refreshToken: string) =>
      axios.post<AuthLoginResponse>(`${API_BASE}/auth/refresh`, {
        refresh_token: refreshToken,
      }),
    logout: () => instance.post("/auth/logout"),
  },
  admin: {
    coursesList: () => instance.get<unknown[]>("/admin/courses"),
    courseById: (id: string) => instance.get(`/courses/${encodeURIComponent(id)}`),
    courseCreate: (body: unknown) => instance.post("/courses", body),
    courseUpdate: (id: string, body: unknown) => instance.patch(`/courses/${encodeURIComponent(id)}`, body),
    courseDelete: (id: string) => instance.delete(`/courses/${encodeURIComponent(id)}`),
    categoriesList: () => instance.get<unknown[]>("/categories"),
    categoryCreate: (body: { name: string; slug?: string; order?: number; imageUrl?: string }) => instance.post("/categories", body),
    categoryUpdate: (id: string, body: Partial<{ name: string; slug: string; order: number; imageUrl: string }>) =>
      instance.patch(`/categories/${encodeURIComponent(id)}`, body),
    categoryDelete: (id: string) => instance.delete(`/categories/${encodeURIComponent(id)}`),
    landingPricingGet: () =>
      instance.get<{
        tiers: any[];
        compareRows?: { label: string; cells: string[] }[];
      }>("/admin/landing/pricing"),
    landingHeroGet: () => instance.get<any>("/public/hero"),
    landingHeroPatch: (body: unknown) => instance.patch("/admin/landing/hero", body),
    landingFeaturedGet: () =>
      instance.get<{ items: unknown[]; max: number }>("/admin/landing/featured-courses"),
    landingFeaturedPut: (courseIds: string[]) =>
      instance.put("/admin/landing/featured-courses", { courseIds }),
    contactPageGet: () => instance.get<any>("/admin/contact-page"),
    contactPagePatch: (body: unknown) => instance.patch("/admin/contact-page", body),
    landingPricingPatch: (body: unknown) => {
      console.log("landingPricingPatch called with", body);
      return instance.patch("/admin/landing/pricing", body);
    },
    /** Users management */
    usersList: (params: { page?: number; limit?: number; search?: string } = {}) =>
      instance.get<any>("/admin/users", { params }),
    userBan: (id: string, ban: boolean) =>
      instance.patch(`/admin/users/${encodeURIComponent(id)}/ban`, null, { params: { value: ban } }),
    userVerifySeller: (id: string, verify: boolean) =>
      instance.patch(`/admin/users/${encodeURIComponent(id)}/verify-seller`, null, { params: { value: verify } }),
    userReferrals: (id: string) => instance.get(`/admin/users/${encodeURIComponent(id)}/referrals`),
    /** KYC management */
    kycList: (params: { status?: string; page?: number; limit?: number } = {}) =>
      instance.get<any>("/kyc/admin/list", { params }),
    kycDecide: (id: string, approve: boolean, adminNote?: string) =>
      instance.patch(`/kyc/admin/decide/${encodeURIComponent(id)}`, { approve, adminNote }),
    /** Withdrawals management */
    withdrawalsList: (params: { status?: string; page?: number; limit?: number } = {}) =>
      instance.get<any>("/withdrawals/admin", { params }),
    withdrawalDecide: (
      id: string,
      body: {
        approve: boolean;
        adminNote?: string;
        payoutMode?: "manual" | "razorpayx";
        paymentMethod?: string;
        paymentReference?: string;
      },
    ) => instance.patch(`/withdrawals/admin/${encodeURIComponent(id)}`, body),
    withdrawalSyncPayout: (id: string) =>
      instance.post(`/withdrawals/admin/${encodeURIComponent(id)}/sync-payout`),
    planSalesList: (params: { status?: string; page?: number; limit?: number } = {}) =>
      instance.get<any>("/plan-sales/admin", { params }),
    planSaleMarkPaid: (id: string, adminNote?: string) =>
      instance.patch(`/plan-sales/admin/${encodeURIComponent(id)}/paid`, { adminNote }),
    planSaleDecide: (id: string, approve: boolean, adminNote?: string) =>
      instance.patch(`/plan-sales/admin/${encodeURIComponent(id)}/decide`, { approve, adminNote }),
    plansActive: () => instance.get<any[]>("/plans", { params: { active: "true" } }),
    planSaleQuote: (body: { planId: string; promoCode: string }) =>
      instance.post<any>("/plan-sales/admin/quote", body),
    planSaleCreateOffline: (body: {
      fullName: string;
      email: string;
      dateOfBirth: string;
      contactNumber: string;
      promoCode: string;
      planId: string;
      paymentMethod: string;
      paymentReference?: string;
      adminNote?: string;
    }) => instance.post<any>("/plan-sales/admin/sell", body),
    incomeUsers: (params: { page?: number; limit?: number; search?: string } = {}) =>
      instance.get<any>("/analytics/income/users", { params }),
    leaderboard: (period: string) => instance.get<any>(`/analytics/leaderboard?period=${period}`),
    /** Admin uploads a video file; returns absolute `url` for the lesson field. */
    uploadCourseVideo: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      // Let Axios set the correct Content-Type for FormData (includes boundary)
      return instance.post("/admin/media/video", fd);
    },
    /** Upload any media file (image/video); returns absolute `url` for fields. */
    uploadMedia: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      // Let Axios set the correct Content-Type for FormData
      return instance.post("/admin/media/upload", fd);
    },
    /** Stats & Dashboard */
    getStats: () => instance.get<any>("/admin/stats"),
    /** Banners */
    bannersList: () => instance.get<any[]>("/banners/admin/all"),
    bannerCreate: (body: any) => instance.post("/banners/admin", body),
    bannerUpdate: (id: string, body: any) => instance.patch(`/banners/admin/${encodeURIComponent(id)}`, body),
    bannerDelete: (id: string) => instance.delete(`/banners/admin/${encodeURIComponent(id)}`),
    /** Marketing tools (M-Tools) */
    marketingToolsList: () => instance.get<any[]>("/marketing-tools/admin/all"),
    marketingToolCreate: (body: any) => instance.post("/marketing-tools/admin", body),
    marketingToolUpdate: (id: string, body: any) =>
      instance.patch(`/marketing-tools/admin/${encodeURIComponent(id)}`, body),
    marketingToolDelete: (id: string) =>
      instance.delete(`/marketing-tools/admin/${encodeURIComponent(id)}`),
    /** Affiliate trainings */
    trainingsList: () => instance.get<any[]>("/trainings/admin/all"),
    trainingCreate: (body: any) => instance.post("/trainings/admin", body),
    trainingUpdate: (id: string, body: any) =>
      instance.patch(`/trainings/admin/${encodeURIComponent(id)}`, body),
    trainingDelete: (id: string) =>
      instance.delete(`/trainings/admin/${encodeURIComponent(id)}`),
    /** About Us team leaders */
    teamMembersList: () => instance.get<any[]>("/team-members/admin/all"),
    teamMemberCreate: (body: any) => instance.post("/team-members/admin", body),
    teamMemberUpdate: (id: string, body: any) =>
      instance.patch(`/team-members/admin/${encodeURIComponent(id)}`, body),
    teamMemberDelete: (id: string) => instance.delete(`/team-members/admin/${encodeURIComponent(id)}`),
    /** Coupons */
    couponsList: () => instance.get<any[]>("/coupons"),
    couponCreate: (body: any) => instance.post("/coupons", body),
    couponUpdate: (id: string, body: any) => instance.patch(`/coupons/${encodeURIComponent(id)}`, body),
    couponDelete: (id: string) => instance.delete(`/coupons/${encodeURIComponent(id)}`),
    /** Settings */
    settingsGet: () => instance.get("/settings/public"),
    settingsUpdate: (body: any) => instance.patch("/settings/admin", body),
    /** Notifications / Broadcast */
    broadcastSend: (body: { title: string; body: string; type: string }) =>
      instance.post("/notifications/broadcast", body),
    /** Referral Tree */
    userReferralTree: (userId: string) =>
      instance.get(`/admin/users/${encodeURIComponent(userId)}/referrals`),
    /** Reviews */
    reviewsList: (params: { page?: number; limit?: number; courseId?: string } = {}) =>
      instance.get<any>("/reviews/admin/all", { params }),
    reviewDelete: (id: string) => instance.delete(`/reviews/${encodeURIComponent(id)}`),
  },
};
