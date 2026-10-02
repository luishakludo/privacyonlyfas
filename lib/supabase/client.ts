import { createClient } from "@supabase/supabase-js"

// Credenciais fixas (hard-coded) — toda a aplicação usa esta mesma instância do Supabase.
export const SUPABASE_URL = "https://dyvfkwnhfboiypkzumxx.supabase.co"
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dmZrd25oZmJvaXlwa3p1bXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTI1MDYsImV4cCI6MjEwMjU2ODUwNn0.2Bh2iKAVyPWI-QjP0_pM8lKZDR9I1b1CGbcGzLZWmUM"

// Singleton para o navegador (client components).
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (browserClient) return browserClient
  browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  return browserClient
}

// Cliente pronto para uso direto.
export const supabase = getSupabaseClient()
