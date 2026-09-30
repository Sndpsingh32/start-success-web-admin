import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { DataTable } from "../components/common/DataTable";
import ComponentCard from "../components/common/ComponentCard";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import { Modal } from "../components/ui/modal";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import { api, mediaUrl } from "../lib/api";
import {
  UserCircleIcon,
  EyeIcon,
  EyeCloseIcon,
  CopyIcon,
  CheckCircleIcon,
} from "../icons";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "details">("list");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [upgradingPlan, setUpgradingPlan] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void api.admin
      .plansActive()
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.usersList({ page, search, limit: 10 });
      setUsers(res.items || res.data || []);
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
    setShowPassword(false);
    setNewPassword("");
    setPasswordError(null);
    setIsPasswordModalOpen(false);
    window.scrollTo(0, 0);
  };

  const copyPassword = async (pwd?: string) => {
    if (!pwd) return;
    try {
      await navigator.clipboard.writeText(pwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser?._id) return;
    const trimmed = newPassword.trim();
    if (!trimmed || trimmed.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    setPasswordUpdating(true);
    setPasswordError(null);
    try {
      await api.admin.userUpdatePassword(selectedUser._id, trimmed);
      const updatedUser = { ...selectedUser, password: trimmed, plainPassword: trimmed };
      setSelectedUser(updatedUser);
      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? { ...u, password: trimmed, plainPassword: trimmed } : u))
      );
      setNewPassword("");
      setIsPasswordModalOpen(false);
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleUpgradePlan = async () => {
    if (!selectedUser?._id || !selectedPlanId) return;
    setUpgradingPlan(true);
    setUpgradeError(null);
    try {
      const updated = await api.admin.userUpgradePlan(selectedUser._id, selectedPlanId);
      setSelectedUser(updated);
      setUsers((prev) => prev.map((u) => (u._id === selectedUser._id ? updated : u)));
      setIsUpgradeModalOpen(false);
    } catch (e) {
      setUpgradeError(e instanceof Error ? e.message : "Failed to upgrade plan");
    } finally {
      setUpgradingPlan(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?._id) return;
    setDeletingUser(true);
    setDeleteError(null);
    try {
      await api.admin.userDelete(selectedUser._id);
      setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
      setTotal((t) => Math.max(0, t - 1));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      setView("list");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setDeletingUser(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "User",
        accessor: (u: any) => (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {u.avatarUrl ? (
                <img src={mediaUrl(u.avatarUrl) ?? u.avatarUrl} alt="" className="size-full object-cover" />
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
        header: "Plan",
        accessor: (u: any) => (
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-500/20">
            {u.planId?.name || (typeof u.planId === "string" ? "Plan assigned" : "No Plan")}
          </span>
        ),
      },
      {
        header: "Password",
        accessor: (u: any) => {
          const pwd = u.plainPassword || (u.password && !u.password.startsWith("$2") ? u.password : "");
          const isRevealed = Boolean(revealedPasswords[u._id]);
          return (
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="font-semibold text-gray-900 dark:text-white">
                {isRevealed ? (pwd || "Hashed") : "••••••••"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRevealedPasswords((prev) => ({
                    ...prev,
                    [u._id]: !prev[u._id],
                  }));
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title={isRevealed ? "Hide" : "Show password"}
              >
                {isRevealed ? <EyeCloseIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
              </button>
              {pwd && isRevealed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyPassword(pwd);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  title="Copy password"
                >
                  <CopyIcon className="size-3.5" />
                </button>
              )}
            </div>
          );
        },
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
    [revealedPasswords]
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
                        <img src={mediaUrl(selectedUser.avatarUrl) ?? selectedUser.avatarUrl} alt="" className="size-full object-cover" />
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
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Plan</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-brand-600 dark:text-brand-400">
                            {selectedUser.planId?.name ||
                              (typeof selectedUser.planId === "string"
                                ? "Plan assigned"
                                : "No Plan")}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPlanId(
                                selectedUser.planId?._id ||
                                  (typeof selectedUser.planId === "string"
                                    ? selectedUser.planId
                                    : "")
                              );
                              setUpgradeError(null);
                              setIsUpgradeModalOpen(true);
                            }}
                          >
                            Upgrade
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Password</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          {(() => {
                            const pwd =
                              selectedUser.plainPassword ||
                              (selectedUser.password &&
                              !selectedUser.password.startsWith("$2")
                                ? selectedUser.password
                                : "");
                            return (
                              <>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {showPassword
                                    ? pwd || (selectedUser.password ? "Hashed" : "N/A")
                                    : "••••••••"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                  title={showPassword ? "Hide password" : "Show password"}
                                >
                                  {showPassword ? (
                                    <EyeCloseIcon className="size-4" />
                                  ) : (
                                    <EyeIcon className="size-4" />
                                  )}
                                </button>
                                {pwd && (
                                  <button
                                    type="button"
                                    onClick={() => void copyPassword(pwd)}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    title="Copy password"
                                  >
                                    {copied ? (
                                      <CheckCircleIcon className="size-4 text-success-500" />
                                    ) : (
                                      <CopyIcon className="size-4" />
                                    )}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
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
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewPassword("");
                        setPasswordError(null);
                        setShowNewPassword(false);
                        setIsPasswordModalOpen(true);
                      }}
                    >
                      Change Password
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPlanId(
                          selectedUser.planId?._id ||
                            (typeof selectedUser.planId === "string"
                              ? selectedUser.planId
                              : "")
                        );
                        setUpgradeError(null);
                        setIsUpgradeModalOpen(true);
                      }}
                    >
                      Upgrade Plan
                    </Button>
                    <Button
                      variant="outline"
                      color="error"
                      onClick={() => {
                        setDeleteError(null);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      Delete User
                    </Button>
                  </div>
                </ComponentCard>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        className="max-w-md w-full p-6 m-4"
      >
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
          Change Password
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Set a new password for <strong>{selectedUser?.name}</strong> ({selectedUser?.email}).
        </p>

        {passwordError && (
          <Alert variant="error" title="Error" message={passwordError} className="mb-4" />
        )}

        <div className="mb-6 space-y-2">
          <Label>New Password</Label>
          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password (min. 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={passwordUpdating}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              tabIndex={-1}
            >
              {showNewPassword ? <EyeCloseIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPasswordModalOpen(false)}
            disabled={passwordUpdating}
          >
            Cancel
          </Button>
          <Button
            disabled={passwordUpdating || !newPassword.trim()}
            onClick={() => void handleUpdatePassword()}
          >
            {passwordUpdating ? "Saving..." : "Save Password"}
          </Button>
        </div>
      </Modal>

      {/* Upgrade Plan Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        className="max-w-md w-full p-6 m-4"
      >
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
          Upgrade User Plan
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Select a new plan for <strong>{selectedUser?.name}</strong>.
        </p>

        {upgradeError && (
          <Alert variant="error" title="Error" message={upgradeError} className="mb-4" />
        )}

        <div className="mb-6 space-y-2">
          <Label>Target Plan</Label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            disabled={upgradingPlan}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 focus:border-brand-500 focus:outline-hidden"
          >
            <option value="">-- Select a Plan --</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} (Tier {p.tier ?? "-"}, ₹{p.price?.toLocaleString?.() ?? p.price})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsUpgradeModalOpen(false)}
            disabled={upgradingPlan}
          >
            Cancel
          </Button>
          <Button
            disabled={upgradingPlan || !selectedPlanId}
            onClick={() => void handleUpgradePlan()}
          >
            {upgradingPlan ? "Upgrading..." : "Confirm Upgrade"}
          </Button>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="max-w-md w-full p-6 m-4"
      >
        <h3 className="mb-2 text-lg font-semibold text-error-600 dark:text-error-400">
          Delete User ID
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to permanently delete user{" "}
          <strong className="text-gray-900 dark:text-white">
            {selectedUser?.name}
          </strong>{" "}
          ({selectedUser?.email})? This action cannot be undone.
        </p>

        {deleteError && (
          <Alert variant="error" title="Error" message={deleteError} className="mb-4" />
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={deletingUser}
          >
            Cancel
          </Button>
          <Button
            color="error"
            disabled={deletingUser}
            onClick={() => void handleDeleteUser()}
          >
            {deletingUser ? "Deleting..." : "Delete User"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
