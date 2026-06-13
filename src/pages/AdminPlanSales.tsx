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

function offlinePaymentLabel(pay: any): string {
  const method = pay?.providerPayload?.paymentMethod;
  const labels: Record<string, string> = {
    cash: "Cash",
    upi: "UPI",
    bank_transfer: "Bank transfer",
    card: "Card",
    other: "Other",
  };
  if (method && labels[method]) return labels[method];
  return pay?.provider === "manual" ? "Manual" : pay?.provider ?? "";
}

function paymentMeta(row: any) {
  const pay = row.paymentId;
  if (!pay || typeof pay === "string") {
    return { label: "Not paid", sub: "No payment record", color: "warning" as const };
  }
  if (pay.status === "completed") {
    const amount =
      typeof pay.amount === "number"
        ? `₹${Math.round(pay.amount).toLocaleString("en-IN")}`
        : "";
    const provider =
      pay.provider === "razorpay"
        ? "Razorpay"
        : offlinePaymentLabel(pay);
    return {
      label: amount ? `Paid ${amount}` : "Paid",
      sub: provider,
      color: "success" as const,
    };
  }
  if (pay.status === "failed") {
    return { label: "Payment failed", sub: pay.provider ?? "", color: "error" as const };
  }
  if (pay.status === "refunded") {
    return { label: "Refunded", sub: pay.provider ?? "", color: "error" as const };
  }
  return {
    label: "Payment pending",
    sub: pay.provider ? String(pay.provider) : "Awaiting Razorpay",
    color: "warning" as const,
  };
}

function planStatusMeta(status: string) {
  switch (status) {
    case "paid":
      return { label: "Plan active", color: "success" as const };
    case "paid_pending_approval":
      return { label: "Awaiting approval", color: "warning" as const };
    case "rejected":
      return { label: "Rejected", color: "error" as const };
    default:
      return { label: "Not activated", color: "warning" as const };
  }
}

export default function AdminPlanSales() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.planSalesList({
        limit: 100,
        status: filter || undefined,
      });
      setItems(res.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plan sales");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const markPaid = async (id: string) => {
    setSavingId(id);
    try {
      await api.admin.planSaleMarkPaid(id);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to confirm payment");
    } finally {
      setSavingId(null);
    }
  };

  const decide = async (id: string, approve: boolean) => {
    setSavingId(id);
    try {
      await api.admin.planSaleDecide(id, approve, adminNote);
      setSelected(null);
      setAdminNote("");
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSavingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Buyer",
        accessor: (r: any) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{r.fullName}</p>
            <p className="text-xs text-gray-500">{r.email}</p>
            {r.contactNumber ? (
              <p className="text-xs text-gray-400">{r.contactNumber}</p>
            ) : null}
          </div>
        ),
      },
      {
        header: "Plan",
        accessor: (r: any) => r.planId?.name ?? "—",
      },
      {
        header: "Seller",
        accessor: (r: any) => (
          <div>
            <p className="text-sm">{r.sellerId?.name ?? "—"}</p>
            {r.promoCode ? (
              <p className="font-mono text-xs text-gray-500">{r.promoCode}</p>
            ) : null}
          </div>
        ),
      },
      {
        header: "Payment",
        accessor: (r: any) => {
          const meta = paymentMeta(r);
          return (
            <div>
              <Badge color={meta.color}>{meta.label}</Badge>
              {meta.sub ? <p className="mt-1 text-xs text-gray-500">{meta.sub}</p> : null}
            </div>
          );
        },
      },
      {
        header: "Plan status",
        accessor: (r: any) => {
          const meta = planStatusMeta(r.status);
          return <Badge color={meta.color}>{meta.label}</Badge>;
        },
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (r: any) => {
          if (r.status === "pending_payment") {
            return (
              <Button size="sm" disabled={savingId === r._id} onClick={() => void markPaid(r._id)}>
                {savingId === r._id ? "…" : "Confirm payment"}
              </Button>
            );
          }
          if (r.status === "paid_pending_approval") {
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelected(r);
                  setAdminNote(r.adminNote || "");
                }}
              >
                Review
              </Button>
            );
          }
          if (r.status === "paid") {
            return <span className="text-xs text-success-600">Activated</span>;
          }
          return <span className="text-xs text-gray-500">—</span>;
        },
      },
    ],
    [savingId],
  );

  return (
    <>
      <PageMeta title="Plan sales | StartSuccess Admin" description="Plan sales and approvals" />
      <PageBreadcrumb pageTitle="Plan sales" />
      {error ? (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: "", label: "All" },
          { value: "pending_payment", label: "Pending payment" },
          { value: "paid_pending_approval", label: "Awaiting approval" },
          { value: "paid", label: "Active" },
          { value: "rejected", label: "Rejected" },
        ].map((opt) => (
          <Button
            key={opt.value || "all"}
            size="sm"
            variant={filter === opt.value ? "primary" : "outline"}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {selected ? (
        <ComponentCard title="Approve plan activation" className="mb-6">
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="font-semibold text-gray-900 dark:text-white">{selected.fullName}</p>
              <p className="text-sm text-gray-500">{selected.email}</p>
              <p className="mt-2 text-sm">
                Plan: <strong>{selected.planId?.name ?? "—"}</strong>
              </p>
              {(() => {
                const pay = paymentMeta(selected);
                return (
                  <p className="mt-2 text-sm">
                    Payment:{" "}
                    <Badge color={pay.color}>{pay.label}</Badge>
                    {pay.sub ? <span className="ml-2 text-xs text-gray-500">({pay.sub})</span> : null}
                  </p>
                );
              })()}
              <p className="mt-2 text-sm text-warning-600 dark:text-warning-400">
                Payment received — buyer can log in. Activate the plan only after you verify this sale.
              </p>
            </div>
            <div>
              <Label>Admin note (optional)</Label>
              <TextArea
                rows={3}
                value={adminNote}
                onChange={setAdminNote}
                placeholder="Reason for approval or rejection"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={savingId === selected._id}
                onClick={() => void decide(selected._id, true)}
              >
                {savingId === selected._id ? "…" : "Approve & activate plan"}
              </Button>
              <Button
                variant="outline"
                disabled={savingId === selected._id}
                onClick={() => void decide(selected._id, false)}
              >
                Reject
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </ComponentCard>
      ) : null}

      <ComponentCard title="Plan sales">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          After Razorpay payment, buyers can log in but their plan stays inactive until you approve here.
        </p>
        <DataTable columns={columns} data={items} loading={loading} emptyMessage="No plan sales yet." />
      </ComponentCard>
    </>
  );
}
