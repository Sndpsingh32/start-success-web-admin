import { useRef, useState } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { mediaUrl } from "../../lib/api";
import { isVideoUrl, uploadMediaFile } from "../../lib/media-upload";

type MediaUrlFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind: "image" | "video";
  hint?: string;
  placeholder?: string;
  required?: boolean;
};

export function MediaUrlField({
  label,
  value,
  onChange,
  kind,
  hint,
  placeholder,
  required,
}: MediaUrlFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const preview = mediaUrl(value) ?? value;
  const accept =
    kind === "video"
      ? "video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
      : "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadMediaFile(file, kind);
      onChange(url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      {hint ? <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? (kind === "video" ? "S3 video URL or upload below" : "S3 image URL or upload below")}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
            }}
          />
          {uploading
            ? "Uploading to AWS S3…"
            : kind === "video"
              ? "Upload video"
              : "Upload image"}
        </label>
        {value ? (
          <button
            type="button"
            className="text-xs text-red-500 hover:underline"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        ) : null}
      </div>
      {uploadError ? (
        <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
      ) : null}
      {preview && kind === "image" ? (
        <img
          src={preview}
          alt=""
          className="mt-2 max-h-40 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
        />
      ) : null}
      {preview && kind === "video" && isVideoUrl(preview) ? (
        <video
          src={preview}
          controls
          className="mt-2 max-h-48 w-full rounded-lg border border-gray-200 dark:border-gray-700"
        />
      ) : null}
    </div>
  );
}
