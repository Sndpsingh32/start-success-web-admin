import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { DataTable } from "../components/common/DataTable";
import ComponentCard from "../components/common/ComponentCard";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import { api } from "../lib/api";
import { PencilIcon, TrashBinIcon } from "../icons";

type CouponRow = {
  _id?: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase?: number;
  maxUsage?: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
};

export default function AdminCoupons() {
  const [items, setItems] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CouponRow>({
    code: "",
    discountType: "percentage",
    discountValue: 10,
    usedCount: 0,
    active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.couponsList();
      setItems(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleEdit = (item: CouponRow) => {
    setEditingId(item._id!);
    setDraft({ ...item });
    setView("form");
  };

  const handleCreate = () => {
    setEditingId(null);
    setDraft({
      code: "",
      discountType: "percentage",
      discountValue: 10,
      usedCount: 0,
      active: true,
    });
    setView("form");
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.admin.couponUpdate(editingId, draft);
      } else {
        await api.admin.couponCreate(draft);
      }
      setView("list");
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.admin.couponDelete(id);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Code",
        accessor: (c: CouponRow) => (
          <span className="font-mono font-bold text-brand-500 uppercase">{c.code}</span>
        ),
      },
      {
        header: "Discount",
        accessor: (c: CouponRow) => (
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}
          </span>
        ),
      },
      {
        header: "Usage",
        accessor: (c: CouponRow) => (
          <div className="flex flex-col">
            <span className="text-sm text-gray-900 dark:text-white">
              {c.usedCount} / {c.maxUsage || "∞"}
            </span>
            <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-brand-500"
                style={{
                  width: c.maxUsage ? `${(c.usedCount / c.maxUsage) * 100}%` : "10%",
                }}
              />
            </div>
          </div>
        ),
      },
      {
        header: "Expiry",
        accessor: (c: CouponRow) => (
          <span className="text-xs text-gray-500">
            {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
          </span>
        ),
      },
      {
        header: "Status",
        accessor: (c: CouponRow) => (
          <Badge color={c.active ? "success" : "light"}>{c.active ? "Active" : "Inactive"}</Badge>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (c: CouponRow) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleEdit(c)}
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <PencilIcon className="size-5" />
            </button>
            <button
              onClick={() => c._id && handleDelete(c._id)}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <TrashBinIcon className="size-5" />
            </button>
          </div>
        ),
      },
    ],
    [items]
  );

  return (
    <>
      <PageMeta title="Coupons Management | StartSuccess Admin" description="Manage discount codes" />
      <PageBreadcrumb pageTitle="Coupons" />

      <div className="space-y-6">
        {view === "list" ? (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleCreate}>Create Coupon</Button>
            </div>

            {error && <Alert variant="error" title="Error" message={error} />}

            <ComponentCard title="Active Coupons">
              <DataTable columns={columns} data={items} loading={loading} />
            </ComponentCard>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingId ? "Edit Coupon" : "New Coupon"}
              </h3>
              <Button variant="outline" onClick={() => setView("list")}>
                Cancel
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ComponentCard title="Coupon Details">
                <div className="space-y-4">
                  <div>
                    <Label>Coupon Code</Label>
                    <Input
                      value={draft.code}
                      onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. WELCOME50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <select
                        className="w-full h-11 px-4 border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-800 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                        value={draft.discountType}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            discountType: e.target.value as "percentage" | "fixed",
                          })
                        }
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed (₹)</option>
                      </select>
                    </div>
                    <div>
                      <Label>Value</Label>
                      <Input
                        type="number"
                        value={String(draft.discountValue)}
                        onChange={(e) =>
                          setDraft({ ...draft, discountValue: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                </div>
              </ComponentCard>

              <ComponentCard title="Limits & Expiry">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Purchase (₹)</Label>
                      <Input
                        type="number"
                        value={String(draft.minPurchase || 0)}
                        onChange={(e) =>
                          setDraft({ ...draft, minPurchase: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label>Max Usage</Label>
                      <Input
                        type="number"
                        value={String(draft.maxUsage || 0)}
                        onChange={(e) =>
                          setDraft({ ...draft, maxUsage: Number(e.target.value) || 0 })
                        }
                        placeholder="Leave 0 for unlimited"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={draft.expiresAt ? draft.expiresAt.split("T")[0] : ""}
                      onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="coupon-active"
                      checked={draft.active}
                      onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                      className="size-4 rounded border-gray-300 text-brand-500"
                    />
                    <Label htmlFor="coupon-active" className="mb-0 cursor-pointer">
                      Is Active
                    </Label>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button className="w-full" onClick={handleSave}>
                      {editingId ? "Update Coupon" : "Create Coupon"}
                    </Button>
                  </div>
                </div>
              </ComponentCard>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
