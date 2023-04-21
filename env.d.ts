/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPE_API_KEY: string;
  readonly VITE_STRIPE_SECRET_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
