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
      setItems(res.data || []);
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

  const viewDetails = (item: any) => {
    setSelectedW(item);
    setAdminNote(item.adminNote || "");
    setView("details");
    window.scrollTo(0, 0);
  };

  const handleDecide = async (approve: boolean) => {
    if (!selectedW) return;
    setSaving(true);
    try {
      await api.admin.withdrawalDecide(selectedW._id, approve, adminNote);
      setView("list");
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSaving(false);
    }
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
        accessor: (w: any) => (
          <Badge
            color={
              w.status === "APPROVED" ? "success" : w.status === "REJECTED" ? "error" : "warning"
            }
          >
            {w.status}
          </Badge>
        ),
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
            Process
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageMeta
        title="Withdrawal Management | StartSuccess Admin"
        description="Approve or reject payouts"
      />
      <PageBreadcrumb pageTitle="Withdrawal Management" />

      <div className="space-y-6">
        {view === "list" ? (
          <ComponentCard title={`Withdrawal Requests (${total})`}>
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
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Process Withdrawal</h3>
            </div>

            {selectedW && (
              <div className="grid gap-6 lg:grid-cols-2">
                <ComponentCard title="Payout Destination">
                  <div className="space-y-4">
                    {selectedW.method === "bank" ? (
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-sm text-gray-500">Bank Name</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {selectedW.bankName}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-sm text-gray-500">Account Number</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                            {selectedW.accountNumber}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-sm text-gray-500">IFSC Code</span>
                          <span className="text-sm font-bold text-brand-500 font-mono">
                            {selectedW.ifscCode}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-sm text-gray-500">Holder Name</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {selectedW.accountHolderName}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">
                          {selectedW.method === "upi" ? "UPI ID" : "PayPal Email"}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {selectedW.upiId || selectedW.paypalEmail}
                        </span>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 mt-4">
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium uppercase mb-1">
                        Withdrawal Amount
                      </p>
                      <h3 className="text-2xl font-bold text-brand-700 dark:text-brand-300">
                        ₹{selectedW.amount?.toLocaleString() ?? 0}
                      </h3>
                    </div>
                  </div>
                </ComponentCard>

                <div className="space-y-6">
                  <ComponentCard title="Review & Decide">
                    <div className="space-y-4">
                      <div>
                        <Label>Internal / Admin Note</Label>
                        <TextArea
                          placeholder="Add reference number or rejection reason..."
                          value={adminNote}
                          onChange={setAdminNote}
                          rows={4}
                        />
                      </div>

                      {selectedW.status === "PENDING" ? (
                        <div className="flex gap-3 pt-2">
                          <Button
                            disabled={saving}
                            color="success"
                            className="flex-1"
                            onClick={() => void handleDecide(true)}
                          >
                            Approve & Paid
                          </Button>
                          <Button
                            disabled={saving}
                            variant="outline"
                            color="error"
                            className="flex-1"
                            onClick={() => void handleDecide(false)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
                          <p className="text-sm text-gray-500 mb-1">Status</p>
                          <Badge color={selectedW.status === "APPROVED" ? "success" : "error"}>
                            {selectedW.status}
                          </Badge>
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
