import "server-only"
import { getServerSupabase } from "@/lib/supabase/server"
import { HOME_DEFAULT, mergeHomeContent, type HomeContent } from "./home-content"
import { EN_DEFAULT, mergeEnContent, type EnEditable } from "@/lib/i18n/onlyfans-content"

// Chaves na tabela `settings` (value TEXT) onde guardamos o snapshot em JSON.
export const HOME_KEY = "landing_home"
export const EN_KEY = "landing_en"

// Lê e faz o parse do override salvo (ou null se não existir / erro).
async function readOverride(key: string): Promise<any | null> {
  try {
    const supabase = getServerSupabase()
    const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle()
    if (error || !data?.value) return null
    return JSON.parse(data.value as string)
  } catch {
    return null
  }
}

// Conteúdo final da HOME: override do banco (se houver) mesclado sobre o padrão.
export async function getHomeContentServer(): Promise<HomeContent> {
  const override = await readOverride(HOME_KEY)
  return override ? mergeHomeContent(override) : HOME_DEFAULT
}

// Snapshot editável final da /en: override do banco (se houver) sobre o padrão.
export async function getEnContentServer(): Promise<EnEditable> {
  const override = await readOverride(EN_KEY)
  return override ? mergeEnContent(override) : EN_DEFAULT
}
