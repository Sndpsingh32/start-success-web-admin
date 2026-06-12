import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { api } from "../../lib/api";
import { clearAdminSession, ensureAdminSession } from "../../lib/auth-session";

type Me = { role?: string; email?: string; name?: string };

/**
 * Wraps all dashboard routes: requires JWT and `role === "admin"` from `GET /auth/me`.
 */
export default function RequireAuth() {
  const location = useLocation();
  const [state, setState] = useState<"loading" | "ok" | "no">("loading");

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const ok = await ensureAdminSession();
      if (!ok) {
        if (!cancelled) setState("no");
        return;
      }
      try {
        const u = await api.auth.me();
        if (cancelled) return;
        const role = (u as Me).role;
        if (role === "admin") {
          try {
            localStorage.setItem("adminUser", JSON.stringify(u));
          } catch {
            /* ignore */
          }
          setState("ok");
        } else {
          clearAdminSession();
          setState("no");
        }
      } catch {
        if (cancelled) return;
        clearAdminSession();
        setState("no");
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Checking session…
      </div>
    );
  }
  if (state === "no") {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
