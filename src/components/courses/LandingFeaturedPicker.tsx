import { useCallback, useEffect, useMemo, useState } from "react";
import ComponentCard from "../common/ComponentCard";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import Alert from "../ui/alert/Alert";
import Badge from "../ui/badge/Badge";
import { api, mediaUrl } from "../../lib/api";

type CourseOption = {
  _id: string;
  title: string;
  slug?: string;
  isPublished?: boolean;
  thumbnailUrl?: string;
};

type FeaturedItem = CourseOption & {
  heroOrder?: number;
  featuredOnHero?: boolean;
};

const MAX = 6;

function idOf(c: { _id?: unknown }): string {
  const raw = c._id;
  if (raw && typeof raw === "object" && raw !== null && "toString" in raw) return String(raw);
  return String(raw ?? "");
}

export function LandingFeaturedPicker({
  courses,
  onSaved,
}: {
  courses: CourseOption[];
  onSaved?: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const publishedCourses = useMemo(
    () => courses.filter((c) => c.isPublished !== false && idOf(c)),
    [courses],
  );

  const courseById = useMemo(() => {
    const map = new Map<string, CourseOption>();
    for (const c of courses) map.set(idOf(c), { ...c, _id: idOf(c) });
    return map;
  }, [courses]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.admin.landingFeaturedGet()) as {
        items?: FeaturedItem[];
      };
      const ids = (res.items ?? []).map((item) => idOf(item)).filter(Boolean);
      setSelectedIds(ids.slice(0, MAX));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load landing featured courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const availableToAdd = useMemo(() => {
    const picked = new Set(selectedIds);
    return publishedCourses.filter((c) => !picked.has(idOf(c)));
  }, [publishedCourses, selectedIds]);

  const addCourse = (courseId: string) => {
    if (!courseId || selectedIds.includes(courseId) || selectedIds.length >= MAX) return;
    setSelectedIds((prev) => [...prev, courseId]);
    setSuccess(null);
  };

  const removeAt = (index: number) => {
    setSelectedIds((prev) => prev.filter((_, i) => i !== index));
    setSuccess(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    setSelectedIds((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.admin.landingFeaturedPut(selectedIds);
      setSuccess(`Landing page will show ${selectedIds.length} featured course(s).`);
      await load();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ComponentCard title={`Landing page — top ${MAX} courses`}>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Choose up to {MAX} published courses for the homepage grid and hero carousel. The full catalog page still
        shows every course.
      </p>

      {error ? <Alert variant="error" title="Error" message={error} className="mb-4" /> : null}
      {success ? <Alert variant="success" title="Saved" message={success} className="mb-4" /> : null}

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge size="sm" color={selectedIds.length >= MAX ? "warning" : "primary"}>
                {selectedIds.length}/{MAX} selected
              </Badge>
            </div>
            <Button disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Save landing featured"}
            </Button>
          </div>

          {selectedIds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No featured courses yet. Add up to {MAX} below — or leave empty to auto-pick top sellers on the site.
            </div>
          ) : (
            <ul className="space-y-3">
              {selectedIds.map((id, index) => {
                const course = courseById.get(id);
                const thumb = course?.thumbnailUrl ?? "";
                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/40"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600 dark:bg-brand-500/10">
                      #{index + 1}
                    </span>
                    {thumb ? (
                      <img
                        src={mediaUrl(thumb) ?? thumb}
                        alt=""
                        className="h-12 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-16 shrink-0 rounded-lg bg-gray-100 dark:bg-white/5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {course?.title ?? "Unknown course"}
                      </p>
                      <p className="truncate text-xs text-gray-500">{course?.slug ?? id}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === selectedIds.length - 1}
                        onClick={() => move(index, 1)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAt(index)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label>Add course</Label>
              <select
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                defaultValue=""
                disabled={selectedIds.length >= MAX || availableToAdd.length === 0}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) addCourse(value);
                  e.currentTarget.value = "";
                }}
              >
                <option value="">
                  {selectedIds.length >= MAX
                    ? "Maximum 6 reached"
                    : availableToAdd.length
                      ? "Select a published course…"
                      : "No more published courses"}
                </option>
                {availableToAdd.map((c) => (
                  <option key={idOf(c)} value={idOf(c)}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </ComponentCard>
  );
}
