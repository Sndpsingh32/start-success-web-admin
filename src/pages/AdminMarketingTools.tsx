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
import { api, mediaUrl } from "../lib/api";
import { PencilIcon, TrashBinIcon } from "../icons";

type MarketingToolRow = {
  _id?: string;
  title: string;
  description: string;
  icon: string;
  assetCount: number;
  downloadUrl: string;
  previewUrl: string;
  tone: string;
  order: number;
  active: boolean;
};

const EMPTY: MarketingToolRow = {
  title: "",
  description: "",
  icon: "image",
  assetCount: 0,
  downloadUrl: "",
  previewUrl: "",
  tone: "from-primary/15 to-transparent border-primary/20",
  order: 0,
  active: true,
};

function isVideoFile(file: File) {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|mkv)$/i.test(file.name);
}

function isVideoUrl(url: string) {
  const u = url.trim().toLowerCase();
  return u.includes("/uploads/videos/") || /\.(mp4|webm|mov|m4v|mkv)(\?|$)/.test(u);
}

function UploadField({
  label,
  hint,
  value,
  onChange,
  onUpload,
  uploading,
  acceptVideo,
  acceptFile,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: (file: File, kind: "video" | "file") => void;
  uploading: boolean;
  acceptVideo?: boolean;
  acceptFile?: boolean;
}) {
  const resolved = mediaUrl(value) ?? value;
  const showVideo = resolved && isVideoUrl(resolved);

  return (
    <div>
      <Label>{label}</Label>
      <p className="mt-1 mb-2 text-xs text-gray-500">{hint}</p>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste URL or upload from your computer"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {acceptVideo !== false ? (
          <label className="cursor-pointer">
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v,.mkv"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f, "video");
                e.target.value = "";
              }}
            />
            <span className="inline-flex rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400">
              {uploading ? "Uploading…" : "Upload video"}
            </span>
          </label>
        ) : null}
        {acceptFile !== false ? (
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".zip,.pdf,.png,.jpg,.jpeg,.webp,.gif,.mp4,.webm,.mov"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f, isVideoFile(f) ? "video" : "file");
                e.target.value = "";
              }}
            />
            <span className="inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">
              {uploading ? "Uploading…" : "Upload file"}
            </span>
          </label>
        ) : null}
      </div>
      {showVideo ? (
        <video
          src={resolved}
          controls
          className="mt-3 max-h-48 w-full rounded-lg border border-gray-200 bg-black dark:border-gray-700"
        />
      ) : null}
    </div>
  );
}

export default function AdminMarketingTools() {
  const [items, setItems] = useState<MarketingToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<"downloadUrl" | "previewUrl" | null>(null);

  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MarketingToolRow>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.marketingToolsList();
      setItems(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load marketing tools");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleEdit = (item: MarketingToolRow) => {
    setEditingId(item._id!);
    setDraft({ ...item });
    setView("form");
  };

  const handleCreate = () => {
    setEditingId(null);
    setDraft({ ...EMPTY, order: items.length });
    setView("form");
  };

  const handleSave = async () => {
    if (!draft.title.trim() || !draft.description.trim()) {
      alert("Title and description are required.");
      return;
    }
    try {
      const body = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        icon: draft.icon,
        assetCount: Number(draft.assetCount) || 0,
        downloadUrl: draft.downloadUrl.trim(),
        previewUrl: draft.previewUrl.trim(),
        tone: draft.tone.trim(),
        order: Number(draft.order) || 0,
        active: draft.active,
      };
      if (editingId) {
        await api.admin.marketingToolUpdate(editingId, body);
      } else {
        await api.admin.marketingToolCreate(body);
      }
      setView("list");
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this marketing tool?")) return;
    try {
      await api.admin.marketingToolDelete(id);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleUpload = async (
    file: File,
    field: "downloadUrl" | "previewUrl",
    kind: "video" | "file",
  ) => {
    setUploadingField(field);
    try {
      const res =
        kind === "video" || isVideoFile(file)
          ? ((await api.admin.uploadCourseVideo(file)) as { url?: string; path?: string })
          : ((await api.admin.uploadMedia(file)) as { url?: string; path?: string });
      const stored = res.path || res.url || "";
      if (stored) {
        setDraft((d) => ({ ...d, [field]: stored }));
      } else {
        alert("Upload succeeded but no URL was returned.");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingField(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Resource",
        accessor: (t: MarketingToolRow) => (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.title}</span>
            <span className="text-xs text-gray-500 truncate max-w-[280px]">{t.description}</span>
          </div>
        ),
      },
      {
        header: "Icon",
        accessor: (t: MarketingToolRow) => (
          <span className="text-xs font-medium uppercase text-gray-600 dark:text-gray-300">{t.icon}</span>
        ),
      },
      {
        header: "Assets",
        accessor: (t: MarketingToolRow) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">{t.assetCount}</span>
        ),
      },
      {
        header: "Links",
        accessor: (t: MarketingToolRow) => (
          <span className="text-xs text-gray-500">
            {t.downloadUrl ? "Download ✓" : "—"} · {t.previewUrl ? "Preview ✓" : "—"}
          </span>
        ),
      },
      {
        header: "Status",
        accessor: (t: MarketingToolRow) => (
          <Badge color={t.active ? "success" : "light"}>{t.active ? "Active" : "Inactive"}</Badge>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (t: MarketingToolRow) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleEdit(t)}
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <PencilIcon className="size-5" />
            </button>
            <button
              onClick={() => t._id && handleDelete(t._id)}
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
      <PageMeta title="Marketing Tools | StartSuccess Admin" description="Manage M-Tools resources" />
      <PageBreadcrumb pageTitle="Marketing Tools (M-Tools)" />

      <div className="space-y-6">
        {view === "list" ? (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleCreate}>Add resource</Button>
            </div>

            {error && <Alert variant="error" title="Error" message={error} />}

            <ComponentCard title="Member M-Tools resources">
              <DataTable columns={columns} data={items} loading={loading} />
            </ComponentCard>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingId ? "Edit resource" : "New resource"}
              </h3>
              <Button variant="outline" onClick={() => setView("list")}>
                Cancel
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ComponentCard title="General info">
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="Promotional Banners"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <textarea
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      rows={3}
                      placeholder="High-quality banners for Instagram and Facebook stories."
                      className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label>Icon</Label>
                    <select
                      value={draft.icon}
                      onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:text-white"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="file">File</option>
                      <option value="folder">Folder</option>
                    </select>
                  </div>
                  <div>
                    <Label>Asset count</Label>
                    <Input
                      type="number"
                      value={String(draft.assetCount)}
                      onChange={(e) => setDraft({ ...draft, assetCount: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </ComponentCard>

              <ComponentCard title="Links & display">
                <div className="space-y-5">
                  <UploadField
                    label="Download file / video"
                    hint="Members download this asset. Upload a video or zip from your computer, or paste a URL."
                    value={draft.downloadUrl}
                    onChange={(v) => setDraft({ ...draft, downloadUrl: v })}
                    onUpload={(file, kind) => void handleUpload(file, "downloadUrl", kind)}
                    uploading={uploadingField === "downloadUrl"}
                  />
                  <UploadField
                    label="Preview video / link"
                    hint="Shown when members click Preview. Upload your marketing video here (MP4, WebM, MOV)."
                    value={draft.previewUrl}
                    onChange={(v) => setDraft({ ...draft, previewUrl: v })}
                    onUpload={(file, kind) => void handleUpload(file, "previewUrl", kind)}
                    uploading={uploadingField === "previewUrl"}
                  />
                  <div>
                    <Label>Card style (Tailwind classes)</Label>
                    <Input
                      value={draft.tone}
                      onChange={(e) => setDraft({ ...draft, tone: e.target.value })}
                      placeholder="from-primary/15 to-transparent border-primary/20"
                    />
                  </div>
                  <div>
                    <Label>Display order</Label>
                    <Input
                      type="number"
                      value={String(draft.order)}
                      onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="tool-active"
                      checked={draft.active}
                      onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                      className="size-4 rounded border-gray-300 text-brand-500"
                    />
                    <Label htmlFor="tool-active" className="mb-0 cursor-pointer">
                      Visible to members
                    </Label>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      className="w-full"
                      onClick={handleSave}
                      disabled={uploadingField !== null}
                    >
                      {editingId ? "Update resource" : "Create resource"}
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
