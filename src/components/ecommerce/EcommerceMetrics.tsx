import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowUpIcon, BoxIconLine, GroupIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import { api } from "../../lib/api";

export default function EcommerceMetrics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    platformRevenue: 0,
    pendingKyc: 0,
    pendingWithdrawals: 0,
    pendingPlanApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.admin.getStats();
        setStats(res);
      } catch (e) {
        console.error("Failed to load dashboard stats", e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const cards = [
    {
      label: "Total Users",
      value: loading ? "..." : stats.totalUsers.toLocaleString(),
      badge: { text: "Active", color: "success" as const },
      icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
      iconBg: "bg-gray-100 dark:bg-gray-800",
      link: "/admin/users",
    },
    {
      label: "Live Courses",
      value: loading ? "..." : stats.totalCourses.toLocaleString(),
      badge: { text: "Published", color: "info" as const },
      icon: <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />,
      iconBg: "bg-gray-100 dark:bg-gray-800",
      link: "/admin/courses",
    },
    {
      label: "Platform Revenue",
      value: loading ? "..." : `₹${stats.platformRevenue.toLocaleString()}`,
      badge: { text: "Real", color: "success" as const },
      icon: (
        <svg className="size-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-brand-50 dark:bg-brand-500/10",
      valueClass: "text-brand-500 dark:text-brand-400",
      link: null,
    },
    {
      label: "Pending KYC",
      value: loading ? "..." : stats.pendingKyc.toLocaleString(),
      badge: {
        text: stats.pendingKyc > 0 ? "Action needed" : "All clear",
        color: (stats.pendingKyc > 0 ? "warning" : "success") as "warning" | "success",
      },
      icon: (
        <svg className="size-6 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
      iconBg: "bg-warning-50 dark:bg-warning-500/10",
      link: "/admin/kyc",
    },
    {
      label: "Pending Withdrawals",
      value: loading ? "..." : stats.pendingWithdrawals.toLocaleString(),
      badge: {
        text: stats.pendingWithdrawals > 0 ? "Action needed" : "All clear",
        color: (stats.pendingWithdrawals > 0 ? "error" : "success") as "error" | "success",
      },
      icon: (
        <svg className="size-6 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      iconBg: "bg-error-50 dark:bg-error-500/10",
      link: "/admin/withdrawals",
    },
    {
      label: "Plan approvals",
      value: loading ? "..." : stats.pendingPlanApprovals.toLocaleString(),
      badge: {
        text: stats.pendingPlanApprovals > 0 ? "Action needed" : "All clear",
        color: (stats.pendingPlanApprovals > 0 ? "warning" : "success") as "warning" | "success",
      },
      icon: (
        <svg className="size-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-brand-50 dark:bg-brand-500/10",
      link: "/admin/plan-sales",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 md:gap-6">
      {cards.map((card) => {
        const inner = (
          <div
            className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full ${
              card.link ? "hover:border-brand-300 hover:shadow-sm transition-all" : ""
            }`}
          >
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${card.iconBg}`}>
              {card.icon}
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
                <h4
                  className={`mt-2 font-bold text-title-sm ${
                    card.valueClass ?? "text-gray-800 dark:text-white/90"
                  }`}
                >
                  {card.value}
                </h4>
              </div>
              <Badge color={card.badge.color}>
                {card.badge.color === "success" && <ArrowUpIcon />}
                {card.badge.text}
              </Badge>
            </div>
          </div>
        );

        return card.link ? (
          <Link key={card.label} to={card.link} className="block h-full">
            {inner}
          </Link>
        ) : (
          <div key={card.label}>{inner}</div>
        );
      })}
    </div>
  );
}
