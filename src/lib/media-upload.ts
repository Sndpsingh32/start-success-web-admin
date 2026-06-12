import { api, mediaUrl } from "./api";

export type UploadResponse = { url?: string; path?: string; filename?: string; size?: number };

/** Normalize API upload response to a storable URL (full S3 URL when enabled). */
export function resolveUploadUrl(res: UploadResponse): string {
  const raw = (res.url || res.path || "").trim();
  if (!raw) throw new Error("Upload response missing url");
  return raw.startsWith("http") ? raw : (mediaUrl(raw) ?? raw);
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|mkv)$/i.test(file.name);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name);
}

export function isVideoUrl(url: string): boolean {
  const u = url.toLowerCase();
  if (u.includes("/images/") || /\.(jpe?g|png|webp|gif|avif)(\?|$)/.test(u)) return false;
  return u.includes("/videos/") || /\.(mp4|webm|mov|m4v|mkv)(\?|$)/.test(u);
}

export async function uploadVideo(file: File): Promise<string> {
  const res = (await api.admin.uploadCourseVideo(file)) as UploadResponse;
  return resolveUploadUrl(res);
}

export async function uploadImage(file: File): Promise<string> {
  const res = (await api.admin.uploadMedia(file)) as UploadResponse;
  return resolveUploadUrl(res);
}

/** Pick the right admin endpoint based on file type. */
export async function uploadMediaFile(file: File, kind?: "image" | "video"): Promise<string> {
  const asVideo = kind === "video" || (kind !== "image" && isVideoFile(file));
  return asVideo ? uploadVideo(file) : uploadImage(file);
}
