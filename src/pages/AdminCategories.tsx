import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import Alert from "../components/ui/alert/Alert";
import { api } from "../lib/api";
import { PencilIcon, TrashBinIcon } from "../icons";
import { DataTable } from "../components/common/DataTable";

type CategoryRow = {
  _id?: string;
  name?: string;
  slug?: string;
  order?: number;
};

function idOf(c: CategoryRow): string {
  const raw = c._id;
  if (raw && typeof raw === "object" && "toString" in raw) return String(raw);
  return String(raw ?? "");
}

export default function AdminCategories() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState("0");

  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = (await api.admin.categoriesList()) as CategoryRow[];
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((c) => {
      const n = String(c.name ?? "").toLowerCase();
      const sl = String(c.slug ?? "").toLowerCase();
      return n.includes(s) || sl.includes(s);
    });
  }, [rows, q]);

  const [page, setPage] = useState(0);
  const pageSize = 10;

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Reset page when search changes
  useEffect(() => {
    setPage(0);
  }, [q]);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setOrder(String(rows.length));
    setView("form");
    setSuccess(null);
    setError(null);
  };

  const openEdit = (c: CategoryRow) => {
    setEditingId(idOf(c));
    setName(String(c.name ?? ""));
    setSlug(String(c.slug ?? ""));
    setOrder(String(c.order ?? 0));
    setView("form");
    setSuccess(null);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const nm = name.trim();
      if (!nm) throw new Error("Name is required");
      const ord = Number(order) || 0;
      const sl = slug.trim();
      if (editingId) {
        await api.admin.categoryUpdate(editingId, {
          name: nm,
          ...(sl ? { slug: sl.toLowerCase() } : {}),
          order: ord,
        });
        setSuccess("Category updated.");
      } else {
        await api.admin.categoryCreate({
          name: nm,
          ...(sl ? { slug: sl.toLowerCase() } : {}),
          order: ord,
        });
        setSuccess("Category created.");
      }
      setView("list");
      await load();
      window.scrollTo(0, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await api.admin.categoryDelete(idOf(deleteTarget));
      setSuccess("Category deleted.");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Order",
        accessor: (c: any) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300">
            {Number(c.order ?? 0)}
          </span>
        ),
        align: "left" as const,
      },
      {
        header: "Category Name",
        accessor: (c: any) => String(c.name ?? ""),
        className: "font-semibold text-gray-900 dark:text-white",
      },
      {
        header: "Slug",
        accessor: (c: any) => String(c.slug ?? ""),
        className: "font-mono text-xs text-gray-500 dark:text-gray-400",
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (c: any) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => openEdit(c)}
              title="Edit category"
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-500/10 dark:text-gray-400"
            >
              <PencilIcon className="size-5" />
            </button>
            <button
              onClick={() => setDeleteTarget(c)}
              title="Delete category"
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 dark:text-gray-400"
            >
              <TrashBinIcon className="size-5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageMeta title="Categories | StartSuccess Admin" description="Course catalog categories" />
      <PageBreadcrumb pageTitle="Categories" />
      <div className="space-y-6">
        {view === "list" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Categories appear in the course form and on the storefront filters. Slug is optional on create.
              </p>
              <Button onClick={openCreate} startIcon={<span className="text-lg">+</span>}>
                New category
              </Button>
            </div>

            {error ? <Alert variant="error" title="Error" message={error} /> : null}
            {success ? <Alert variant="success" title="Done" message={success} /> : null}

            <ComponentCard title={`All categories (${filtered.length})`}>
              <DataTable
                columns={columns}
                data={paginatedData}
                loading={loading}
                onSearch={setQ}
                searchPlaceholder="Search categories..."
                currentPage={page}
                totalPages={Math.ceil(filtered.length / pageSize)}
                onPageChange={setPage}
              />
            </ComponentCard>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("list")}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:hover:bg-white/5 transition-colors"
                >
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingId ? "Edit category" : "New category"}
                </h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setView("list")}>
                  Cancel
                </Button>
                <Button disabled={saving} onClick={() => void handleSave()}>
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </div>

            {error ? <Alert variant="error" title="Error" message={error} /> : null}

            <ComponentCard title="Category Details">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Web Development" />
                </div>
                <div>
                  <Label>Slug (optional)</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from name" />
                </div>
              </div>
              <div className="max-w-[200px] mt-6">
                <Label>Sort order</Label>
                <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
              </div>
            </ComponentCard>

            {/* Sticky Action Bar */}
            <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-6 px-4 sm:px-6 lg:px-6 py-4 bg-white/80 backdrop-blur-md border-t border-gray-200 dark:bg-gray-900/80 dark:border-gray-800 flex items-center justify-end gap-3 z-10">
              <Button
                variant="outline"
                onClick={() => {
                  setView("list");
                  window.scrollTo(0, 0);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                disabled={saving}
                onClick={() => void handleSave()}
                className="w-full sm:w-auto min-w-[140px]"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : editingId ? (
                  "Save Changes"
                ) : (
                  "Create Category"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md w-full p-6 m-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">Delete category?</h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Remove <strong>{deleteTarget ? String(deleteTarget.name ?? "") : ""}</strong>.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button disabled={deleting} onClick={() => void handleDelete()}>
            {deleting ? "…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
