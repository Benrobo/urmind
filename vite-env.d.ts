/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly WXT_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
