import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import TextArea from "../components/form/input/TextArea";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { Modal } from "../components/ui/modal";
import Alert from "../components/ui/alert/Alert";
import { api, mediaUrl } from "../lib/api";
import { GridIcon, EyeIcon, PencilIcon, TrashBinIcon } from "../icons";
import { DataTable } from "../components/common/DataTable";
import CourseModulesEditor, {
  normalizeModulesFromApi,
  serializeModulesForApi,
  type AdminModule,
} from "../components/courses/CourseModulesEditor";
import { MediaUrlField } from "../components/media/MediaUrlField";

type CategoryRow = { _id: string; name: string };

type CourseRow = Record<string, unknown> & {
  _id?: string;
  title?: string;
  slug?: string;
  price?: number;
  isPublished?: boolean;
  salesCount?: number;
  categoryId?: string | { toString(): string } | null;
};

function idOf(c: CourseRow): string {
  const raw = c._id;
  if (raw && typeof raw === "object" && "toString" in raw) return String(raw);
  return String(raw ?? "");
}

function categoryLabel(cats: CategoryRow[], c: CourseRow): string {
  const cid = c.categoryId;
  const id = cid && typeof cid === "object" && "toString" in cid ? String(cid) : cid ? String(cid) : "";
  if (!id) return "—";
  return cats.find((x) => x._id === id)?.name ?? id.slice(0, 8);
}

export default function AdminCourses() {
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [discountPrice, setDiscountPrice] = useState("0");
  const [originalPrice, setOriginalPrice] = useState("0");
  const [offerPercent, setOfferPercent] = useState("0");
  const [level, setLevel] = useState("Beginner");
  const [durationLabel, setDurationLabel] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [highlightsText, setHighlightsText] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [isPublished, setIsPublished] = useState(true);
  const [modules, setModules] = useState<AdminModule[]>(() => normalizeModulesFromApi([]));

  const [deleteTarget, setDeleteTarget] = useState<CourseRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, catsRes] = await Promise.allSettled([
        api.admin.coursesList() as Promise<CourseRow[]>,
        api.admin.categoriesList() as Promise<unknown[]>,
      ]);
      const errs: string[] = [];
      if (coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value)) {
        setRows(coursesRes.value);
      } else {
        setRows([]);
        if (coursesRes.status === "rejected") {
          errs.push(
            coursesRes.reason instanceof Error ? coursesRes.reason.message : "Failed to load courses",
          );
        } else {
          errs.push("Failed to load courses");
        }
      }
      if (catsRes.status === "fulfilled" && Array.isArray(catsRes.value)) {
        const normalized: CategoryRow[] = catsRes.value
          .map((raw: unknown) => {
            const c = raw as Record<string, unknown>;
            const id = c._id ?? c.id;
            const idStr =
              id && typeof id === "object" && id !== null && "toString" in id
                ? String(id)
                : id != null
                  ? String(id)
                  : "";
            return { _id: idStr, name: String(c.name ?? "") };
          })
          .filter((x) => x._id);
        setCategories(normalized);
      } else {
        setCategories([]);
        if (catsRes.status === "rejected") {
          errs.push(
            catsRes.reason instanceof Error ? catsRes.reason.message : "Failed to load categories",
          );
        } else if (catsRes.status === "fulfilled") {
          errs.push("Categories response was not an array");
        }
      }
      setError(errs.length ? errs.join(" · ") : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setRows([]);
      setCategories([]);
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
      const t = String(c.title ?? "").toLowerCase();
      const sl = String(c.slug ?? "").toLowerCase();
      return t.includes(s) || sl.includes(s);
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

  const columns = useMemo(
    () => [
      {
        header: "Course Info",
        accessor: (c: CourseRow) => {
          const thumb = String(c.thumbnailUrl ?? "");
          return (
            <div className="flex items-center">
              <div className="h-10 w-10 flex-shrink-0">
                {thumb ? (
                  <img
                    className="h-10 w-10 rounded-lg object-cover shadow-sm border border-gray-100 dark:border-white/10"
                    src={mediaUrl(thumb) ?? thumb}
                    alt=""
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 dark:bg-brand-500/10">
                    <GridIcon className="size-5" />
                  </div>
                )}
              </div>
              <div className="ml-4">
                <div className="text-sm font-semibold text-gray-900 dark:text-white max-w-[180px] truncate">
                  {String(c.title ?? "")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {String(c.slug ?? "")}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        header: "Category",
        accessor: (c: CourseRow) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300">
            {categoryLabel(categories, c)}
          </span>
        ),
      },
      {
        header: "Pricing",
        accessor: (c: CourseRow) => (
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            ₹{Number(c.price ?? 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Analytics",
        accessor: (c: CourseRow) => (
          <div className="text-sm text-gray-900 dark:text-white font-medium">
            {Number(c.salesCount ?? 0).toLocaleString()}
            <span className="text-xs text-gray-500 font-normal ml-1">students</span>
          </div>
        ),
      },
      {
        header: "Status",
        accessor: (c: CourseRow) => (
          <Badge size="sm" color={c.isPublished ? "success" : "warning"}>
            {c.isPublished ? "Published" : "Draft"}
          </Badge>
        ),
      },
      {
        header: "Actions",
        align: "right" as const,
        accessor: (c: CourseRow) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => {
                const slug = String(c.slug ?? "");
                const base = (import.meta.env.VITE_PUBLIC_APP_URL || "").replace(/\/$/, "");
                const url = base
                  ? `${base}/courses/${encodeURIComponent(slug)}`
                  : `/courses/${encodeURIComponent(slug)}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              title="View on site"
              className="p-1.5 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10 dark:text-gray-400"
            >
              <EyeIcon className="size-5" />
            </button>
            <button
              onClick={() => openEdit(c)}
              title="Edit course"
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-500/10 dark:text-gray-400"
            >
              <PencilIcon className="size-5" />
            </button>
            <button
              onClick={() => setDeleteTarget(c)}
              title="Delete course"
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 dark:text-gray-400"
            >
              <TrashBinIcon className="size-5" />
            </button>
          </div>
        ),
      },
    ],
    [categories]
  );

  const openCreate = () => {
    setEditingId(null);
    setTitle("New course");
    setSlug("");
    setShortDescription("");
    setFullDescription("");
    setPrice("999");
    setDiscountPrice("0");
    setOriginalPrice("0");
    setOfferPercent("0");
    setLevel("Beginner");
    setDurationLabel("10h");
    setInstructorName("");
    setThumbnailUrl("");
    setHighlightsText("");
    setBenefitsText("");
    setCategoryId("none");
    setIsPublished(false);
    setModules(normalizeModulesFromApi([]));
    setView("form");
    setSuccess(null);
    setError(null);
  };

  const openEdit = (c: CourseRow) => {
    setEditingId(idOf(c));
    setTitle(String(c.title ?? ""));
    setSlug(String(c.slug ?? ""));
    setShortDescription(String(c.shortDescription ?? ""));
    setFullDescription(String(c.fullDescription ?? ""));
    setPrice(String(c.price ?? 0));
    setDiscountPrice(String(c.discountPrice ?? 0));
    setOriginalPrice(String(c.originalPrice ?? 0));
    setOfferPercent(String(c.offerPercent ?? 0));
    setLevel(String(c.level ?? "Beginner"));
    setDurationLabel(String(c.durationLabel ?? ""));
    setInstructorName(String(c.instructorName ?? ""));
    setThumbnailUrl(String(c.thumbnailUrl ?? ""));
    const hid = c.categoryId;
    const hidStr = hid && typeof hid === "object" && "toString" in hid ? String(hid) : hid ? String(hid) : "";
    setCategoryId(hidStr || "none");
    setIsPublished(Boolean(c.isPublished));
    const hl = c.highlights;
    setHighlightsText(Array.isArray(hl) ? (hl as string[]).join("\n") : "");
    const ben = c.benefits;
    setBenefitsText(Array.isArray(ben) ? (ben as string[]).join("\n") : "");
    setModules(normalizeModulesFromApi(c.modules));
    setView("form");
    setSuccess(null);
    setError(null);
  };

  const buildPayload = (): Record<string, unknown> => {
    const modulesPayload = serializeModulesForApi(modules);
    const lessonTotal = modulesPayload.reduce((n, m) => n + m.lessons.length, 0);
    const highlights = highlightsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const benefits = benefitsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return {
      title: title.trim(),
      slug: slug.trim() || undefined,
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      price: Number(price) || 0,
      discountPrice: Number(discountPrice) || 0,
      originalPrice: Number(originalPrice) || 0,
      offerPercent: Number(offerPercent) || 0,
      level: level.trim() || "Beginner",
      durationLabel: durationLabel.trim(),
      lessonCount: lessonTotal,
      instructorName: instructorName.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
      highlights,
      benefits,
      categoryId: categoryId === "none" ? null : categoryId,
      isPublished,
      modules: modulesPayload,
    };
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildPayload();
      if (!String(payload.title).trim()) throw new Error("Title is required");
      if (editingId) {
        await api.admin.courseUpdate(editingId, payload);
        setSuccess("Course updated.");
      } else {
        await api.admin.courseCreate(payload);
        setSuccess("Course created.");
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
      await api.admin.courseDelete(idOf(deleteTarget));
      setSuccess("Course deleted.");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageMeta title="Courses | StartSuccess Admin" description="Manage course catalog" />
      <PageBreadcrumb pageTitle="Courses" />
      <div className="space-y-6">
        {view === "list" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Full CRUD against <code className="text-xs">startsuccess-backend</code>. Use an admin JWT.
              </p>
              <Button onClick={openCreate} startIcon={<span className="text-lg">+</span>}>
                New course
              </Button>
            </div>

            {error ? <Alert variant="error" title="Error" message={error} /> : null}
            {success ? <Alert variant="success" title="Done" message={success} /> : null}

            <ComponentCard title={`All courses (${filtered.length})`}>
              <DataTable
                columns={columns}
                data={paginatedData}
                loading={loading}
                onSearch={setQ}
                searchPlaceholder="Search courses..."
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
                  {editingId ? "Edit course" : "New course"}
                </h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setView("list")}>
                  Cancel
                </Button>
                <Button disabled={saving} onClick={() => void handleSave()}>
                  {saving ? "Saving…" : editingId ? "Save" : "Create"}
                </Button>
              </div>
            </div>

            {error ? <Alert variant="error" title="Error" message={error} /> : null}

            <ComponentCard title="General Information">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Slug (optional)</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from title" />
                </div>
              </div>
              <div>
                <Label>Short description</Label>
                <TextArea rows={2} value={shortDescription} onChange={setShortDescription} />
              </div>
              <div>
                <Label>Full description</Label>
                <TextArea rows={5} value={fullDescription} onChange={setFullDescription} />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label>Category</Label>
                  <select
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="none">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="pub"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <Label htmlFor="pub" className="cursor-pointer">
                    Published
                  </Label>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Pricing & Details">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <Label>Price (₹)</Label>
                  <Input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div>
                  <Label>Discount price</Label>
                  <Input type="number" min="0" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} />
                </div>
                <div>
                  <Label>List / original price</Label>
                  <Input type="number" min="0" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
                </div>
                <div>
                  <Label>Offer %</Label>
                  <Input type="number" min="0" value={offerPercent} onChange={(e) => setOfferPercent(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 mt-6">
                <div>
                  <Label>Level</Label>
                  <Input value={level} onChange={(e) => setLevel(e.target.value)} />
                </div>
                <div>
                  <Label>Duration label</Label>
                  <Input value={durationLabel} onChange={(e) => setDurationLabel(e.target.value)} placeholder="32h" />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Instructor & Assets">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label>Instructor name</Label>
                  <Input value={instructorName} onChange={(e) => setInstructorName(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <MediaUrlField
                    label="Course thumbnail"
                    value={thumbnailUrl}
                    onChange={setThumbnailUrl}
                    kind="image"
                    hint="Uploads to AWS S3 (images/). Used on course cards and catalog."
                    placeholder="https://startsuccess-media.s3…/images/…"
                  />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Benefits & Highlights">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label>Highlights (one per line)</Label>
                  <TextArea rows={5} value={highlightsText} onChange={setHighlightsText} />
                </div>
                <div>
                  <Label>Benefits (one per line)</Label>
                  <TextArea rows={5} value={benefitsText} onChange={setBenefitsText} />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Curriculum (Modules & Lessons)">
              <CourseModulesEditor modules={modules} onChange={setModules} />
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
                  "Create Course"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md w-full p-6 m-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">Delete course?</h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Remove <strong>{deleteTarget ? String(deleteTarget.title ?? "") : ""}</strong> from the catalog.
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
