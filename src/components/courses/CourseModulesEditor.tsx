import { useState } from "react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { mediaUrl } from "../../lib/api";
import { isVideoUrl, uploadVideo } from "../../lib/media-upload";

/** Matches `startsuccess-backend` course.modules shape */
export type AdminLesson = {
  title: string;
  slug?: string;
  videoUrl: string;
  durationSec: number;
  freePreview: boolean;
  notes?: string;
  order: number;
};

export type AdminModule = {
  title: string;
  order: number;
  lessons: AdminLesson[];
};

function emptyLesson(order: number): AdminLesson {
  return {
    title: "",
    videoUrl: "",
    durationSec: 600,
    freePreview: false,
    order,
  };
}

function emptyModule(order: number): AdminModule {
  return {
    title: `Module ${order + 1}`,
    order,
    lessons: [emptyLesson(0)],
  };
}

export function normalizeModulesFromApi(raw: unknown): AdminModule[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [emptyModule(0)];
  }
  return raw.map((mod: any, mi: number) => ({
    title: String(mod?.title ?? `Module ${mi + 1}`),
    order: Number(mod?.order) >= 0 ? Number(mod.order) : mi,
    lessons: Array.isArray(mod?.lessons)
      ? mod.lessons.map((les: any, li: number) => ({
          title: String(les?.title ?? ""),
          slug: typeof les?.slug === "string" ? les.slug : undefined,
          videoUrl: String(les?.videoUrl ?? ""),
          durationSec: Math.max(0, Number(les?.durationSec) || 0),
          freePreview: Boolean(les?.freePreview),
          notes: typeof les?.notes === "string" ? les.notes : undefined,
          order: Number(les?.order) >= 0 ? Number(les.order) : li,
        }))
      : [emptyLesson(0)],
  }));
}

export function serializeModulesForApi(mods: AdminModule[]): AdminModule[] {
  return mods.map((mod, mi) => ({
    title: mod.title.trim() || `Module ${mi + 1}`,
    order: mi,
    lessons: mod.lessons.map((les, li) => ({
      title: les.title.trim() || `Lesson ${li + 1}`,
      slug: les.slug?.trim() || undefined,
      videoUrl: les.videoUrl.trim(),
      durationSec: Math.max(0, Number(les.durationSec) || 0),
      freePreview: Boolean(les.freePreview),
      notes: les.notes?.trim() || undefined,
      order: li,
    })),
  }));
}

type Props = {
  modules: AdminModule[];
  onChange: (next: AdminModule[]) => void;
};

export default function CourseModulesEditor({ modules, onChange }: Props) {
  const update = (next: AdminModule[]) => onChange(next);
  const [uploadKey, setUploadKey] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const runUpload = async (mi: number, li: number, file: File) => {
    const key = `${mi}-${li}`;
    setUploadKey(key);
    setUploadErr(null);
    try {
      const url = await uploadVideo(file);
      update(
        modules.map((m, i) => {
          if (i !== mi) return m;
          const lessons = m.lessons.map((l, j) => (j === li ? { ...l, videoUrl: url } : l));
          return { ...m, lessons };
        }),
      );
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadKey(null);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>Course content (modules & lessons)</Label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Paste a video URL or use <strong>Upload from PC</strong> to send the file to{" "}
            <strong>AWS S3</strong> (<code className="text-[10px]">videos/</code>). Mark “Free preview” for lessons
            guests can watch before buying.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => update([...modules, emptyModule(modules.length)])}
        >
          + Module
        </Button>
      </div>

      <div className="space-y-4">
        {uploadErr ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {uploadErr}
          </p>
        ) : null}
        {modules.map((mod, mi) => (
          <div
            key={`mod-${mi}`}
            className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <div className="min-w-[180px] flex-1">
                <Label>Module title</Label>
                <Input
                  value={mod.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(modules.map((m, i) => (i === mi ? { ...m, title: v } : m)));
                  }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  const next = modules.filter((_, i) => i !== mi).map((m, i) => ({ ...m, order: i }));
                  update(next.length ? next : [emptyModule(0)]);
                }}
              >
                Remove module
              </Button>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-gray-500">Lessons</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const next = modules.map((m, i) => {
                      if (i !== mi) return m;
                      const lessons = [...m.lessons, emptyLesson(m.lessons.length)];
                      return { ...m, lessons };
                    });
                    update(next);
                  }}
                >
                  + Lesson
                </Button>
              </div>

              {mod.lessons.map((les, li) => (
                <div
                  key={`les-${mi}-${li}`}
                  className="grid gap-2 rounded-md border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-950/50 sm:grid-cols-12"
                >
                  <div className="sm:col-span-4">
                    <Label>Lesson title</Label>
                    <Input
                      value={les.title}
                      onChange={(e) => {
                        const v = e.target.value;
                        update(
                          modules.map((m, i) => {
                            if (i !== mi) return m;
                            const lessons = m.lessons.map((l, j) => (j === li ? { ...l, title: v } : l));
                            return { ...m, lessons };
                          }),
                        );
                      }}
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <Label>Video URL</Label>
                    <Input
                      value={les.videoUrl}
                      onChange={(e) => {
                        const v = e.target.value;
                        update(
                          modules.map((m, i) => {
                            if (i !== mi) return m;
                            const lessons = m.lessons.map((l, j) => (j === li ? { ...l, videoUrl: v } : l));
                            return { ...m, lessons };
                          }),
                        );
                      }}
                      placeholder="S3 video URL or upload below"
                    />
                    {(() => {
                      const resolved = les.videoUrl.trim() ? mediaUrl(les.videoUrl) : null;
                      if (!resolved) return null;
                      if (isVideoUrl(resolved)) {
                        return (
                          <video
                            key={`${mi}-${li}-${resolved}`}
                            src={resolved}
                            controls
                            preload="metadata"
                            className="mt-2 max-h-36 w-full rounded-md border border-gray-200 bg-black object-contain dark:border-gray-700"
                          />
                        );
                      }
                      return (
                        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
                          <p className="text-xs text-amber-900 dark:text-amber-200">
                            This URL is not a lesson video (looks like an image or wrong path). Use{" "}
                            <strong>Upload from PC</strong> to attach an MP4 — course thumbnail is separate above.
                          </p>
                        </div>
                      );
                    })()}
                    <div className="mt-1.5">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
                          className="sr-only"
                          disabled={uploadKey === `${mi}-${li}`}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (f) void runUpload(mi, li, f);
                          }}
                        />
                        {uploadKey === `${mi}-${li}` ? "Uploading…" : "Upload from PC"}
                      </label>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Minutes</Label>
                    <Input
                      type="number"
                      min="0"
                      value={Math.round(les.durationSec / 60)}
                      onChange={(e) => {
                        const min = Math.max(0, Number(e.target.value) || 0);
                        update(
                          modules.map((m, i) => {
                            if (i !== mi) return m;
                            const lessons = m.lessons.map((l, j) =>
                              j === li ? { ...l, durationSec: min * 60 } : l,
                            );
                            return { ...m, lessons };
                          }),
                        );
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-end gap-2 sm:col-span-1">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={les.freePreview}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          update(
                            modules.map((m, i) => {
                              if (i !== mi) return m;
                              const lessons = m.lessons.map((l, j) =>
                                j === li ? { ...l, freePreview: checked } : l,
                              );
                              return { ...m, lessons };
                            }),
                          );
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Preview
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        update(
                          modules.map((m, i) => {
                            if (i !== mi) return m;
                            const lessons = m.lessons.filter((_, j) => j !== li).map((l, j) => ({ ...l, order: j }));
                            return { ...m, lessons: lessons.length ? lessons : [emptyLesson(0)] };
                          }),
                        );
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
