/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_AUTH_ENDPOINT: string
  readonly VITE_SYSTEM_ENDPOINT: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
  readonly VITE_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}