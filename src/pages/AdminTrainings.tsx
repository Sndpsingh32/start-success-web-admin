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

type TrainingRow = {
  _id?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  lessonCount: number;
  rating: number;
  order: number;
  active: boolean;
};

const EMPTY: TrainingRow = {
  title: "",
  description: "",
  thumbnailUrl: "",
  videoUrl: "",
  duration: "1 Hour",
  lessonCount: 0,
  rating: 4.8,
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

export default function AdminTrainings() {
  const [items, setItems] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<"thumbnailUrl" | "videoUrl" | null>(null);

  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TrainingRow>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.trainingsList();
      setItems(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load trainings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleEdit = (item: TrainingRow) => {
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
    if (!draft.videoUrl.trim()) {
      alert("Training video is required. Upload a video or paste a URL.");
      return;
    }
    try {
      const body = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        thumbnailUrl: draft.thumbnailUrl.trim(),
        videoUrl: draft.videoUrl.trim(),
        duration: draft.duration.trim() || "1 Hour",
        lessonCount: Number(draft.lessonCount) || 0,
        rating: Number(draft.rating) || 0,
        order: Number(draft.order) || 0,
        active: draft.active,
      };
      if (editingId) {
        await api.admin.trainingUpdate(editingId, body);
      } else {
        await api.admin.trainingCreate(body);
      }
      setView("list");
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this training?")) return;
    try {
      await api.admin.trainingDelete(id);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleUpload = async (
    file: File,
    field: "thumbnailUrl" | "videoUrl",
    kind: "video" | "image",
  ) => {
    setUploadingField(field);
    try {
      const res =
        kind === "video" || isVideoFile(file)
          ? ((await api.admin.uploadCourseVideo(file)) as { url?: string; path?: string })
          : ((await api.admin.uploadMedia(file)) as { url?: string; path?: string });
      const stored = res.path || res.url || "";
      if (stored) setDraft((d) => ({ ...d, [field]: stored }));
      else alert("Upload succeeded but no URL was returned.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingField(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Training",
        accessor: (t: TrainingRow) => (
          <div className="flex items-center gap-3">
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              {t.thumbnailUrl ? (
                <img
                  src={mediaUrl(t.thumbnailUrl) ?? t.thumbnailUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-[10px] text-gray-400">No img</div>
              )}
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">{t.title}</span>
              <span className="block truncate text-xs text-gray-500 max-w-[240px]">{t.description}</span>
            </div>
          </div>
        ),
      },
      {
        header: "Duration",
        accessor: (t: TrainingRow) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{t.duration}</span>
        ),
      },
      {
        header: "Lessons",
        accessor: (t: TrainingRow) => (
          <span className="text-sm font-medium">{t.lessonCount}</span>
        ),
      },
      {
        header: "Video",
        accessor: (t: TrainingRow) => (
          <span className="text-xs text-gray-500">{t.videoUrl ? "✓ Ready" : "Missing"}</span>
        ),
      },
      {
        header: "Status",
        accessor: (t: TrainingRow) => (
          <Badge color={t.active ? "success" : "light"}>{t.active ? "Active" : "Inactive"}</Badge>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (t: TrainingRow) => (
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
    [items],
  );

  const videoPreview = mediaUrl(draft.videoUrl) ?? draft.videoUrl;

  return (
    <>
      <PageMeta title="Affiliate Trainings | StartSuccess Admin" description="Manage member training videos" />
      <PageBreadcrumb pageTitle="Affiliate Trainings" />

      <div className="space-y-6">
        {view === "list" ? (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleCreate}>Add training</Button>
            </div>
            {error && <Alert variant="error" title="Error" message={error} />}
            <ComponentCard title="Trainings shown on member dashboard">
              <DataTable columns={columns} data={items} loading={loading} />
            </ComponentCard>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingId ? "Edit training" : "New training"}
              </h3>
              <Button variant="outline" onClick={() => setView("list")}>
                Cancel
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ComponentCard title="Details">
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="Affiliate Marketing Mastery"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <textarea
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Duration label</Label>
                      <Input
                        value={draft.duration}
                        onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                        placeholder="2.5 Hours"
                      />
                    </div>
                    <div>
                      <Label>Lesson count</Label>
                      <Input
                        type="number"
                        min={0}
                        value={String(draft.lessonCount)}
                        onChange={(e) =>
                          setDraft({ ...draft, lessonCount: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Rating (0–5)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={String(draft.rating)}
                        onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) || 0 })}
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
                  </div>
                </div>
              </ComponentCard>

              <ComponentCard title="Media">
                <div className="space-y-5">
                  <div>
                    <Label>Cover thumbnail</Label>
                    <p className="mt-1 mb-2 text-xs text-gray-500">Card image on the trainings page.</p>
                    <Input
                      value={draft.thumbnailUrl}
                      onChange={(e) => setDraft({ ...draft, thumbnailUrl: e.target.value })}
                      placeholder="Image URL or upload"
                    />
                    <label className="mt-2 inline-block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingField === "thumbnailUrl"}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleUpload(f, "thumbnailUrl", "image");
                          e.target.value = "";
                        }}
                      />
                      <span className="inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">
                        {uploadingField === "thumbnailUrl" ? "Uploading…" : "Upload thumbnail"}
                      </span>
                    </label>
                    {draft.thumbnailUrl ? (
                      <img
                        src={mediaUrl(draft.thumbnailUrl) ?? draft.thumbnailUrl}
                        alt=""
                        className="mt-3 max-h-32 rounded-lg object-cover"
                      />
                    ) : null}
                  </div>

                  <div>
                    <Label>Training video *</Label>
                    <p className="mt-1 mb-2 text-xs text-gray-500">
                      Plays when member clicks Start learning.
                    </p>
                    <Input
                      value={draft.videoUrl}
                      onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
                      placeholder="/uploads/videos/... or https://..."
                    />
                    <label className="mt-2 inline-block cursor-pointer">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        className="hidden"
                        disabled={uploadingField === "videoUrl"}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleUpload(f, "videoUrl", "video");
                          e.target.value = "";
                        }}
                      />
                      <span className="inline-flex rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-600">
                        {uploadingField === "videoUrl" ? "Uploading video…" : "Upload training video"}
                      </span>
                    </label>
                    {videoPreview && isVideoUrl(videoPreview) ? (
                      <video
                        src={videoPreview}
                        controls
                        className="mt-3 max-h-48 w-full rounded-lg border bg-black"
                      />
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="training-active"
                      checked={draft.active}
                      onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                      className="size-4 rounded border-gray-300 text-brand-500"
                    />
                    <Label htmlFor="training-active" className="mb-0 cursor-pointer">
                      Visible to members
                    </Label>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={uploadingField !== null}
                  >
                    {editingId ? "Update training" : "Create training"}
                  </Button>
                </div>
              </ComponentCard>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
