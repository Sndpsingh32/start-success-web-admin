import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

/** Turn `/uploads/...` paths from API into full URLs (admin runs on a different port). */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Custom Axios instance type that reflects our interceptor's behavior
 * (returning response.data directly instead of the full AxiosResponse).
 */
interface CustomAxiosInstance extends AxiosInstance {
  get<T = any, R = T>(url: string, config?: any): Promise<R>;
  post<T = any, R = T, D = any>(url: string, data?: D, config?: any): Promise<R>;
  patch<T = any, R = T, D = any>(url: string, data?: D, config?: any): Promise<R>;
  delete<T = any, R = T>(url: string, config?: any): Promise<R>;
}

const instance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
}) as CustomAxiosInstance;

// Add a request interceptor to add the auth token
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData must use multipart boundary — default application/json breaks file uploads
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors and return data directly
instance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || "Request failed";
    const errorMessage = Array.isArray(message) ? message.join(" ") : message;
    return Promise.reject(new Error(errorMessage));
  }
);

export type AuthLoginResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: unknown;
};

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
    logout: () => instance.post("/auth/logout"),
  },
  admin: {
    coursesList: () => instance.get<unknown[]>("/admin/courses"),
    courseById: (id: string) => instance.get(`/courses/${encodeURIComponent(id)}`),
    courseCreate: (body: unknown) => instance.post("/courses", body),
    courseUpdate: (id: string, body: unknown) => instance.patch(`/courses/${encodeURIComponent(id)}`, body),
    courseDelete: (id: string) => instance.delete(`/courses/${encodeURIComponent(id)}`),
    categoriesList: () => instance.get<unknown[]>("/categories"),
    categoryCreate: (body: { name: string; slug?: string; order?: number }) => instance.post("/categories", body),
    categoryUpdate: (id: string, body: Partial<{ name: string; slug: string; order: number }>) =>
      instance.patch(`/categories/${encodeURIComponent(id)}`, body),
    categoryDelete: (id: string) => instance.delete(`/categories/${encodeURIComponent(id)}`),
    landingPricingGet: () =>
      instance.get<{
        tiers: any[];
        compareRows?: { label: string; cells: string[] }[];
      }>("/admin/landing/pricing"),
    landingHeroGet: () => instance.get<any>("/public/hero"),
    landingHeroPatch: (body: unknown) => instance.patch("/admin/landing/hero", body),
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
    withdrawalDecide: (id: string, approve: boolean, adminNote?: string) =>
      instance.patch(`/withdrawals/admin/${encodeURIComponent(id)}`, { approve, adminNote }),
    withdrawalSyncPayout: (id: string) =>
      instance.post(`/withdrawals/admin/${encodeURIComponent(id)}/sync-payout`),
    planSalesList: (params: { status?: string; page?: number; limit?: number } = {}) =>
      instance.get<any>("/plan-sales/admin", { params }),
    planSaleMarkPaid: (id: string, adminNote?: string) =>
      instance.patch(`/plan-sales/admin/${encodeURIComponent(id)}/paid`, { adminNote }),
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
