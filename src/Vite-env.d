/// <reference types="vite/client" />

/**
 * Declare the shape of import.meta.env for Vite projects.
 * Add any custom VITE_* variables your app uses here.
 */
interface ImportMetaEnv {
  /** Google OAuth client ID — set in .env as VITE_GOOGLE_CLIENT_ID */
  readonly VITE_GOOGLE_CLIENT_ID: string;
  // Add more VITE_* vars below as needed, e.g.:
  // readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}