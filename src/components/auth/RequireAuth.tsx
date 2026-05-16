import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { api } from "../../lib/api";

type Me = { role?: string; email?: string; name?: string };

/**
 * Wraps all dashboard routes: requires JWT and `role === "admin"` from `GET /auth/me`.
 */
export default function RequireAuth() {
  const location = useLocation();
  const [state, setState] = useState<"loading" | "ok" | "no">("loading");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setState("no");
      return;
    }
    let cancelled = false;
    void api.auth
      .me()
      .then((u) => {
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
          localStorage.removeItem("token");
          localStorage.removeItem("adminUser");
          setState("no");
        }
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem("token");
        localStorage.removeItem("adminUser");
        setState("no");
      });
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
