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

type BannerRow = {
  _id?: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  order: number;
  active: boolean;
};

export default function AdminBanners() {
  const [items, setItems] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BannerRow>({
    title: "",
    imageUrl: "",
    linkUrl: "",
    order: 0,
    active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.bannersList();
      setItems(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleEdit = (item: BannerRow) => {
    setEditingId(item._id!);
    setDraft({ ...item });
    setView("form");
  };

  const handleCreate = () => {
    setEditingId(null);
    setDraft({
      title: "",
      imageUrl: "",
      linkUrl: "",
      order: items.length,
      active: true,
    });
    setView("form");
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.admin.bannerUpdate(editingId, draft);
      } else {
        await api.admin.bannerCreate(draft);
      }
      setView("list");
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await api.admin.bannerDelete(id);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Banner",
        accessor: (b: BannerRow) => (
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img src={b.imageUrl} alt={b.title} className="size-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {b.title}
              </span>
              <span className="text-xs text-gray-500 truncate max-w-[200px]">
                {b.linkUrl || "No link"}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: "Order",
        accessor: (b: BannerRow) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">{b.order}</span>
        ),
      },
      {
        header: "Status",
        accessor: (b: BannerRow) => (
          <Badge color={b.active ? "success" : "light"}>{b.active ? "Active" : "Inactive"}</Badge>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (b: BannerRow) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleEdit(b)}
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <PencilIcon className="size-5" />
            </button>
            <button
              onClick={() => b._id && handleDelete(b._id)}
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
      <PageMeta title="Banners Management | StartSuccess Admin" description="Manage app banners" />
      <PageBreadcrumb pageTitle="Banners" />

      <div className="space-y-6">
        {view === "list" ? (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleCreate}>Add Banner</Button>
            </div>

            {error && <Alert variant="error" title="Error" message={error} />}

            <ComponentCard title="Active Banners">
              <DataTable columns={columns} data={items} loading={loading} />
            </ComponentCard>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingId ? "Edit Banner" : "New Banner"}
              </h3>
              <Button variant="outline" onClick={() => setView("list")}>
                Cancel
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ComponentCard title="General Info">
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="e.g. Summer Sale"
                    />
                  </div>
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={draft.imageUrl}
                      onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={draft.linkUrl}
                      onChange={(e) => setDraft({ ...draft, linkUrl: e.target.value })}
                      placeholder="/courses/id or https://..."
                    />
                  </div>
                </div>
              </ComponentCard>

              <ComponentCard title="Settings">
                <div className="space-y-4">
                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={String(draft.order)}
                      onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="banner-active"
                      checked={draft.active}
                      onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                      className="size-4 rounded border-gray-300 text-brand-500"
                    />
                    <Label htmlFor="banner-active" className="mb-0 cursor-pointer">
                      Is Active
                    </Label>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button className="w-full" onClick={handleSave}>
                      {editingId ? "Update Banner" : "Create Banner"}
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
