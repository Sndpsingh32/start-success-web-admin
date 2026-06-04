import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { DataTable } from "../components/common/DataTable";
import ComponentCard from "../components/common/ComponentCard";
import Alert from "../components/ui/alert/Alert";
import Input from "../components/form/input/InputField";
import { api } from "../lib/api";

export default function AdminIncome() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.incomeUsers({ limit: 100, search: search.trim() || undefined });
      setItems(res.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load income data");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const columns = useMemo(
    () => [
      { header: "Name", accessor: (u: any) => u.name },
      { header: "Email", accessor: (u: any) => u.email },
      {
        header: "Active ₹",
        accessor: (u: any) => (
          <span className="font-semibold text-emerald-600">₹{(u.activeIncome || 0).toLocaleString("en-IN")}</span>
        ),
      },
      {
        header: "Passive ₹",
        accessor: (u: any) => (
          <span className="font-semibold text-sky-600">₹{(u.passiveIncome || 0).toLocaleString("en-IN")}</span>
        ),
      },
      {
        header: "Total ₹",
        accessor: (u: any) => (
          <span className="font-bold">₹{(u.totalIncome || 0).toLocaleString("en-IN")}</span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageMeta title="Income dashboard | StartSuccess Admin" description="Active and passive income by user" />
      <PageBreadcrumb pageTitle="Income dashboard" />
      {error ? (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      ) : null}
      <ComponentCard title="All users — active & passive income">
        <div className="mb-4 max-w-sm">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <DataTable columns={columns} data={items} loading={loading} emptyMessage="No users found." />
      </ComponentCard>
    </>
  );
}
