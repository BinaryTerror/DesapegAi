/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  // adicione outras variáveis aqui se precisar
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}