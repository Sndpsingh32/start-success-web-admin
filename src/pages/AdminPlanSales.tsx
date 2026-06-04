import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { DataTable } from "../components/common/DataTable";
import ComponentCard from "../components/common/ComponentCard";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import { api } from "../lib/api";

export default function AdminPlanSales() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.planSalesList({ limit: 50 });
      setItems(res.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plan sales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markPaid = async (id: string) => {
    setSavingId(id);
    try {
      await api.admin.planSaleMarkPaid(id);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to activate");
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
          </div>
        ),
      },
      {
        header: "Plan",
        accessor: (r: any) => r.planId?.name ?? "—",
      },
      {
        header: "Seller",
        accessor: (r: any) => r.sellerId?.name ?? "—",
      },
      {
        header: "Status",
        accessor: (r: any) => (
          <Badge color={r.status === "paid" ? "success" : "warning"}>
            {r.status === "paid" ? "Active" : "Pending payment"}
          </Badge>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (r: any) =>
          r.status === "pending_payment" ? (
            <Button size="sm" disabled={savingId === r._id} onClick={() => void markPaid(r._id)}>
              {savingId === r._id ? "…" : "Confirm payment & activate"}
            </Button>
          ) : (
            <span className="text-xs text-gray-500">Activated</span>
          ),
      },
    ],
    [savingId],
  );

  return (
    <>
      <PageMeta title="Plan sales | StartSuccess Admin" description="Pending plan registrations" />
      <PageBreadcrumb pageTitle="Plan sales" />
      {error ? (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      ) : null}
      <ComponentCard title="Registrations (inactive until paid)">
        <DataTable columns={columns} data={items} loading={loading} emptyMessage="No plan sales yet." />
      </ComponentCard>
    </>
  );
}
