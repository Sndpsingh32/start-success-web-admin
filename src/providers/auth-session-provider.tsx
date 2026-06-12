import { useEffect, type ReactNode } from "react";
import { startAdminSessionKeepAlive } from "../lib/auth-session";

/** Keeps admin JWT fresh while the dashboard is open (prevents 15m logout). */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => startAdminSessionKeepAlive(), []);
  return <>{children}</>;
}
