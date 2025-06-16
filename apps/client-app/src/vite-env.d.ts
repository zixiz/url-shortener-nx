// apps/client-app/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MANAGEMENT_API_URL: string;
  readonly VITE_APP_BASE_URL: string;
  // Add other VITE_ variables you use here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}