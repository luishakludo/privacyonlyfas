"use client"

import useSWR from "swr"
import { supabase } from "@/lib/supabase/client"
import { HOME_DEFAULT, mergeHomeContent, type HomeContent } from "./home-content"
import { EN_DEFAULT, mergeEnContent, type EnEditable } from "@/lib/i18n/onlyfans-content"

export const HOME_KEY = "landing_home"
export const EN_KEY = "landing_en"

type LandingState<T> = {
  // Conteúdo atual (override mesclado sobre o padrão, ou o próprio padrão).
  content: T
  // Existe um override salvo no banco? (true = personalizado; false = usando o hard code)
  customized: boolean
}

async function fetchRaw(key: string): Promise<any | null> {
  const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle()
  if (error) throw error
  if (!data?.value) return null
  try {
    return JSON.parse(data.value as string)
  } catch {
    return null
  }
}

async function saveRaw(key: string, value: unknown) {
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: "key" })
  if (error) throw error
}

async function deleteRaw(key: string) {
  const { error } = await supabase.from("settings").delete().eq("key", key)
  if (error) throw error
}

// ---------- HOME ----------

export function useHomeContent() {
  const { data, error, isLoading, mutate } = useSWR<LandingState<HomeContent>>(HOME_KEY, async () => {
    const raw = await fetchRaw(HOME_KEY)
    return { content: raw ? mergeHomeContent(raw) : HOME_DEFAULT, customized: !!raw }
  })

  async function save(next: HomeContent) {
    await saveRaw(HOME_KEY, next)
    await mutate({ content: mergeHomeContent(next), customized: true }, { revalidate: false })
  }

  async function reset() {
    await deleteRaw(HOME_KEY)
    await mutate({ content: HOME_DEFAULT, customized: false }, { revalidate: false })
  }

  return {
    content: data?.content ?? HOME_DEFAULT,
    customized: data?.customized ?? false,
    isLoading,
    error,
    save,
    reset,
  }
}

// ---------- /en ----------

export function useEnContent() {
  const { data, error, isLoading, mutate } = useSWR<LandingState<EnEditable>>(EN_KEY, async () => {
    const raw = await fetchRaw(EN_KEY)
    return { content: raw ? mergeEnContent(raw) : EN_DEFAULT, customized: !!raw }
  })

  async function save(next: EnEditable) {
    await saveRaw(EN_KEY, next)
    await mutate({ content: mergeEnContent(next), customized: true }, { revalidate: false })
  }

  async function reset() {
    await deleteRaw(EN_KEY)
    await mutate({ content: EN_DEFAULT, customized: false }, { revalidate: false })
  }

  return {
    content: data?.content ?? EN_DEFAULT,
    customized: data?.customized ?? false,
    isLoading,
    error,
    save,
    reset,
  }
}

// Upload de imagens e vídeos para o Storage (bucket "model-media", pasta "landing").
export async function uploadLandingImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    throw new Error("Formato de mídia não suportado")
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || (file.type.startsWith("video/") ? "mp4" : "jpg")
  const path = `landing/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from("model-media").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    // O nome é único; sem upsert evitamos exigir a policy UPDATE do Storage.
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from("model-media").getPublicUrl(path)
  return data.publicUrl
}
