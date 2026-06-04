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
import { api, mediaUrl } from "../lib/api";

export default function AdminKyc() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [status] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "details">("list");
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.kycList({ page, status, limit: 10 });
      setItems(res.items || res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load KYC requests");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const viewDetails = (item: any) => {
    setSelectedKyc(item);
    setAdminNote(item.adminNote || "");
    setView("details");
    window.scrollTo(0, 0);
  };

  const handleDecide = async (approve: boolean) => {
    if (!selectedKyc) return;
    setSaving(true);
    try {
      await api.admin.kycDecide(selectedKyc._id, approve, adminNote);
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
        header: "User Details",
        accessor: (k: any) => (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {k.userId?.name || "Unknown"}
            </span>
            <span className="text-xs text-gray-500 font-mono italic">
              {k.userId?.email || k.userId || "No ID"}
            </span>
          </div>
        ),
      },
      {
        header: "Identity Proof",
        accessor: (k: any) => (
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium uppercase">
              Aadhar: {k.aadharNumber}
            </span>
            <span className="text-xs text-gray-500 font-medium uppercase">PAN: {k.panNumber}</span>
          </div>
        ),
      },
      {
        header: "Bank Details",
        accessor: (k: any) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{k.bankName}</span>
            <span className="text-xs text-gray-500 font-mono">{k.accountNumber}</span>
          </div>
        ),
      },
      {
        header: "Status",
        accessor: (k: any) => (
          <Badge
            color={
              k.status === "APPROVED" ? "success" : k.status === "REJECTED" ? "error" : "warning"
            }
          >
            {k.status}
          </Badge>
        ),
      },
      {
        header: "Submitted",
        accessor: (k: any) => (
          <span className="text-xs text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</span>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (k: any) => (
          <Button variant="outline" size="sm" onClick={() => viewDetails(k)}>
            Review
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageMeta
        title="KYC Management | StartSuccess Admin"
        description="Approve or reject user KYC"
      />
      <PageBreadcrumb pageTitle="KYC Management" />

      <div className="space-y-6">
        {view === "list" ? (
          <ComponentCard title={`KYC Requests (${total})`}>
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
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Review KYC Request</h3>
            </div>

            {selectedKyc && (
              <div className="grid gap-6 lg:grid-cols-2">
                <ComponentCard title="Verification Documents">
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2">Aadhar Card ({selectedKyc.aadharNumber})</Label>
                      {mediaUrl(selectedKyc.aadharImage) ? (
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <img
                            src={mediaUrl(selectedKyc.aadharImage)!}
                            alt="Aadhar"
                            className="size-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-500">
                          No image uploaded
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="mb-2">PAN Card ({selectedKyc.panNumber})</Label>
                      {mediaUrl(selectedKyc.panImage) ? (
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <img
                            src={mediaUrl(selectedKyc.panImage)!}
                            alt="PAN"
                            className="size-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-500">
                          No image uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </ComponentCard>

                <div className="space-y-6">
                  <ComponentCard title="Bank Details">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">Account Holder</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {selectedKyc.accountHolderName}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">Bank Name</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {selectedKyc.bankName}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">Account Number</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                          {selectedKyc.accountNumber}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500">IFSC Code</span>
                        <span className="text-sm font-bold text-brand-500 font-mono">
                          {selectedKyc.ifscCode}
                        </span>
                      </div>
                    </div>
                  </ComponentCard>

                  <ComponentCard title="Admin Action">
                    <div className="space-y-4">
                      <div>
                        <Label>Admin Note (Visible to user)</Label>
                        <TextArea
                          placeholder="Explain reason for approval or rejection..."
                          value={adminNote}
                          onChange={setAdminNote}
                          rows={4}
                        />
                      </div>

                      {selectedKyc.status === "PENDING" ? (
                        <div className="flex gap-3 pt-2">
                          <Button
                            disabled={saving}
                            color="success"
                            className="flex-1"
                            onClick={() => void handleDecide(true)}
                          >
                            Approve KYC
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
                          <p className="text-sm text-gray-500 mb-1">Decision already made</p>
                          <Badge color={selectedKyc.status === "APPROVED" ? "success" : "error"}>
                            {selectedKyc.status}
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
