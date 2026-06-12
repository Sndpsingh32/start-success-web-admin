/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_MEDIA_BASE?: string;
  readonly VITE_S3_MEDIA_BASE?: string;
  /** Public marketing site (e.g. edupath-explorer) for “View course” preview */
  readonly VITE_PUBLIC_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
