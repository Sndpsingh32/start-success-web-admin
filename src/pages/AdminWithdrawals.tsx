import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { DataTable } from "../components/common/DataTable";
import ComponentCard from "../components/common/ComponentCard";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import Label from "../components/form/Label";
import TextArea from "../components/form/input/TextArea";
import { api } from "../lib/api";
import { subscribeAdminRealtime } from "../lib/realtime";

function normStatus(status?: string) {
  return (status ?? "").toLowerCase();
}

export default function AdminWithdrawals() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [status] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "details">("list");
  const [selectedW, setSelectedW] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.withdrawalsList({ page, status, limit: 10 });
      setItems(res.items || res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load withdrawal requests");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const unsub = subscribeAdminRealtime((p) => {
      if (p.event === "withdrawal_updated" && p.forAdmin) void load();
    });
    return unsub;
  }, [load]);

  const viewDetails = (item: any) => {
    setSelectedW(item);
    setAdminNote(item.adminNote || "");
    setView("details");
    window.scrollTo(0, 0);
  };

  const handleSendPayout = async () => {
    if (!selectedW) return;
    setSaving(true);
    try {
      const updated = await api.admin.withdrawalDecide(selectedW._id, true, adminNote);
      setSelectedW(updated);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Payout failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedW) return;
    setSaving(true);
    try {
      await api.admin.withdrawalDecide(selectedW._id, false, adminNote);
      setView("list");
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncPayout = async () => {
    if (!selectedW) return;
    setSaving(true);
    try {
      const updated = await api.admin.withdrawalSyncPayout(selectedW._id);
      setSelectedW(updated);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSaving(false);
    }
  };

  const statusTone = (s?: string) => {
    const st = normStatus(s);
    if (st === "approved") return "success" as const;
    if (st === "rejected") return "error" as const;
    if (st === "processing") return "info" as const;
    return "warning" as const;
  };

  const statusLabel = (s?: string) => {
    const st = normStatus(s);
    if (st === "approved") return "PAID";
    if (st === "processing") return "SENDING TO BANK";
    if (st === "rejected") return "REJECTED";
    return "PENDING";
  };

  const columns = useMemo(
    () => [
      {
        header: "User",
        accessor: (w: any) => (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {w.userId?.name ?? "Unknown"}
            </span>
            <span className="text-xs text-gray-500">{w.userId?.email ?? ""}</span>
          </div>
        ),
      },
      {
        header: "Amount",
        accessor: (w: any) => (
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            ₹{w.amount?.toLocaleString() ?? 0}
          </span>
        ),
      },
      {
        header: "Status",
        accessor: (w: any) => <Badge color={statusTone(w.status)}>{statusLabel(w.status)}</Badge>,
      },
      {
        header: "Date",
        accessor: (w: any) => (
          <span className="text-xs text-gray-500">{new Date(w.createdAt).toLocaleDateString()}</span>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (w: any) => (
          <Button variant="outline" size="sm" onClick={() => viewDetails(w)}>
            {normStatus(w.status) === "pending" ? "Send payout" : "View"}
          </Button>
        ),
      },
    ],
    [],
  );

  const st = normStatus(selectedW?.status);

  return (
    <>
      <PageMeta
        title="Withdrawal Management | StartSuccess Admin"
        description="RazorpayX bank payouts to affiliates"
      />
      <PageBreadcrumb pageTitle="Withdrawal Management" />

      <div className="space-y-6">
        {view === "list" ? (
          <ComponentCard title={`Withdrawal Requests (${total})`}>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Approve sends money via RazorpayX to the user&apos;s KYC bank account. Status updates
              automatically when the bank transfer completes.
            </p>
            {error && <Alert variant="error" title="Error" message={error} className="mb-4" />}

            <DataTable columns={columns} data={items} loading={loading} />
          </ComponentCard>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView("list")}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:hover:bg-white/5 transition-colors"
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Bank payout</h3>
            </div>

            {selectedW && (
              <div className="grid gap-6 lg:grid-cols-2">
                <ComponentCard title="Payout destination (user KYC bank)">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">Bank</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {selectedW.bankName}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">Account</span>
                        <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                          {selectedW.accountNumber}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">IFSC</span>
                        <span className="text-sm font-bold font-mono text-brand-500">
                          {selectedW.ifscCode}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">Holder</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {selectedW.accountHolderName}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium uppercase mb-1">
                        Transfer amount
                      </p>
                      <h3 className="text-2xl font-bold text-brand-700 dark:text-brand-300">
                        ₹{selectedW.amount?.toLocaleString() ?? 0}
                      </h3>
                    </div>

                    {selectedW.razorpayPayoutId && (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-xs space-y-1">
                        <p>
                          <span className="text-gray-500">Razorpay payout:</span>{" "}
                          <span className="font-mono">{selectedW.razorpayPayoutId}</span>
                        </p>
                        {selectedW.payoutProviderStatus && (
                          <p>
                            <span className="text-gray-500">Provider status:</span>{" "}
                            {selectedW.payoutProviderStatus}
                          </p>
                        )}
                        {selectedW.payoutError && (
                          <p className="text-red-600">{selectedW.payoutError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </ComponentCard>

                <div className="space-y-6">
                  <ComponentCard title="RazorpayX payout">
                    <div className="space-y-4">
                      <Alert
                        variant="info"
                        title="Automatic bank transfer"
                        message="Send payout triggers RazorpayX IMPS/NEFT to the account above. User wallet and status update when Razorpay confirms success (webhook or sync)."
                      />

                      <div>
                        <Label>Admin note / UTR (optional)</Label>
                        <TextArea
                          placeholder="Internal reference..."
                          value={adminNote}
                          onChange={setAdminNote}
                          rows={3}
                        />
                      </div>

                      {st === "pending" && (
                        <div className="flex flex-col gap-3 pt-2">
                          <Button
                            disabled={saving}
                            color="success"
                            onClick={() => void handleSendPayout()}
                          >
                            {saving ? "Sending…" : `Send ₹${selectedW.amount} to bank (RazorpayX)`}
                          </Button>
                          <Button
                            disabled={saving}
                            variant="outline"
                            color="error"
                            onClick={() => void handleReject()}
                          >
                            Reject & refund wallet
                          </Button>
                        </div>
                      )}

                      {st === "processing" && (
                        <div className="space-y-3">
                          <Badge color="info">Sending to bank…</Badge>
                          <Button disabled={saving} variant="outline" onClick={() => void handleSyncPayout()}>
                            Refresh payout status
                          </Button>
                        </div>
                      )}

                      {(st === "approved" || st === "rejected") && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
                          <p className="text-sm text-gray-500 mb-1">Status</p>
                          <Badge color={statusTone(selectedW.status)}>{statusLabel(selectedW.status)}</Badge>
                        </div>
                      )}
                    </div>
                  </ComponentCard>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
