import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { DataTable } from "../components/common/DataTable";
import ComponentCard from "../components/common/ComponentCard";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import { api } from "../lib/api";
import { UserCircleIcon } from "../icons";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "details">("list");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.usersList({ page, search, limit: 10 });
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const viewDetails = (user: any) => {
    setSelectedUser(user);
    setView("details");
    window.scrollTo(0, 0);
  };

  const columns = useMemo(
    () => [
      {
        header: "User",
        accessor: (u: any) => (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <UserCircleIcon className="size-6 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{u.name}</span>
              <span className="text-xs text-gray-500">{u.email}</span>
            </div>
          </div>
        ),
      },
      {
        header: "Referral Code",
        accessor: (u: any) => (
          <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            {u.referralCode}
          </code>
        ),
      },
      {
        header: "Income (Active/Passive)",
        accessor: (u: any) => (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              ₹{u.activeIncome?.toLocaleString() ?? 0}
            </span>
            <span className="text-xs text-orange-600 dark:text-orange-400">
              ₹{u.passiveIncome?.toLocaleString() ?? 0}
            </span>
          </div>
        ),
      },
      {
        header: "Rank",
        accessor: (u: any) => (
          <Badge size="sm" color={u.rank === "BRONZE" ? "light" : "primary"}>
            {u.rank}
          </Badge>
        ),
      },
      {
        header: "Status",
        accessor: (u: any) => (
          <div className="flex gap-1">
            {u.isBanned ? (
              <Badge size="sm" color="error">
                Banned
              </Badge>
            ) : (
              <Badge size="sm" color="success">
                Active
              </Badge>
            )}
            {u.isVerifiedSeller && (
              <Badge size="sm" color="info">
                Verified Seller
              </Badge>
            )}
          </div>
        ),
      },
      {
        header: "Joined",
        accessor: (u: any) => (
          <span className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</span>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (u: any) => (
          <Button variant="outline" size="sm" onClick={() => viewDetails(u)}>
            View
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageMeta title="Users Management | StartSuccess Admin" description="Manage registered users" />
      <PageBreadcrumb pageTitle="Users Management" />

      <div className="space-y-6">
        {view === "list" ? (
          <ComponentCard title={`Total Users (${total})`}>
            {error && <Alert variant="error" title="Error" message={error} className="mb-4" />}

            <DataTable
              columns={columns}
              data={users}
              loading={loading}
              onSearch={setSearch}
              searchPlaceholder="Search by name, email or code..."
            />
          </ComponentCard>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView("list")}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:hover:bg-white/5 transition-colors"
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">User Details</h3>
            </div>

            {selectedUser && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Card */}
                <ComponentCard title="Profile" className="lg:col-span-1">
                  <div className="flex flex-col items-center text-center">
                    <div className="size-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden mb-4">
                      {selectedUser.avatarUrl ? (
                        <img src={selectedUser.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <UserCircleIcon className="size-16 text-gray-400" />
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedUser.name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">{selectedUser.email}</p>

                    <div className="w-full space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Phone</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {selectedUser.phone || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Referral Code</span>
                        <span className="text-brand-500 font-mono font-bold">
                          {selectedUser.referralCode}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Rank</span>
                        <Badge color="primary">{selectedUser.rank}</Badge>
                      </div>
                    </div>
                  </div>
                </ComponentCard>

                {/* Income & Wallet */}
                <ComponentCard title="Financials" className="lg:col-span-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium uppercase mb-1">
                        Active Income
                      </p>
                      <h3 className="text-2xl font-bold text-brand-700 dark:text-brand-300">
                        ₹{selectedUser.activeIncome?.toLocaleString() ?? 0}
                      </h3>
                    </div>
                    <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase mb-1">
                        Passive Income
                      </p>
                      <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        ₹{selectedUser.passiveIncome?.toLocaleString() ?? 0}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Referral Stats
                      </h5>
                      <Link
                        to={`/admin/tree/${selectedUser._id}`}
                        className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        View Network Tree
                      </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm text-gray-500">
                          <UserCircleIcon className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Direct Referrals</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {selectedUser.directReferralsCount ?? 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm text-gray-500">
                          <UserCircleIcon className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Network</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {selectedUser.totalReferralsCount ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ComponentCard>

                {/* Account Actions */}
                <ComponentCard title="Account Control" className="lg:col-span-3">
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="outline"
                      color={selectedUser.isBanned ? "success" : "error"}
                      onClick={async () => {
                        try {
                          await api.admin.userBan(selectedUser._id, !selectedUser.isBanned);
                          setSelectedUser({ ...selectedUser, isBanned: !selectedUser.isBanned });
                        } catch (e) {
                          alert(e instanceof Error ? e.message : "Action failed");
                        }
                      }}
                    >
                      {selectedUser.isBanned ? "Unban User" : "Ban User"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await api.admin.userVerifySeller(
                            selectedUser._id,
                            !selectedUser.isVerifiedSeller
                          );
                          setSelectedUser({
                            ...selectedUser,
                            isVerifiedSeller: !selectedUser.isVerifiedSeller,
                          });
                        } catch (e) {
                          alert(e instanceof Error ? e.message : "Action failed");
                        }
                      }}
                    >
                      {selectedUser.isVerifiedSeller
                        ? "Remove Verified Seller"
                        : "Mark as Verified Seller"}
                    </Button>
                  </div>
                </ComponentCard>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
