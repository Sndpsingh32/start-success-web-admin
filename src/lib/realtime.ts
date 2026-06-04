const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

export type AdminRealtimePayload = {
  event?: string;
  forAdmin?: boolean;
  withdrawalId?: string;
  amount?: number;
  status?: string;
  userId?: string;
};

type Listener = (payload: AdminRealtimePayload) => void;

let adminSource: EventSource | null = null;
const listeners = new Set<Listener>();

function parseEvent(raw: MessageEvent): AdminRealtimePayload {
  try {
    const data = typeof raw.data === "string" ? JSON.parse(raw.data) : raw.data;
    return (data ?? {}) as AdminRealtimePayload;
  } catch {
    return {};
  }
}

export function connectAdminRealtime() {
  const token = localStorage.getItem("token");
  if (!token || adminSource) return;

  const url = `${API_BASE.replace(/\/$/, "")}/notifications/events/admin?token=${encodeURIComponent(token)}`;
  adminSource = new EventSource(url);

  adminSource.onmessage = (ev) => {
    const payload = parseEvent(ev);
    listeners.forEach((fn) => fn(payload));
  };

  adminSource.onerror = () => {
    disconnectAdminRealtime();
    window.setTimeout(connectAdminRealtime, 5000);
  };
}

export function disconnectAdminRealtime() {
  adminSource?.close();
  adminSource = null;
}

export function subscribeAdminRealtime(listener: Listener) {
  listeners.add(listener);
  connectAdminRealtime();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) disconnectAdminRealtime();
  };
}
