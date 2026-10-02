"use client"

import { use } from "react"
import useSWR from "swr"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { PrivacyPage } from "@/components/landing/privacy-page"
import { PixelScripts } from "@/components/landing/pixel-scripts"
import { normalizeConfig, mediasTotal, planTitle, type ModelConfig } from "@/lib/supabase/use-models"

type ModelRow = {
  id: string
  name: string
  handle: string
  slug: string
  status: "online" | "rascunho"
  active: boolean
  avatar_url: string | null
  pixel_facebook: string | null
  pixel_utmify: string | null
  config: ModelConfig
}

async function fetchModelBySlug(slug: string): Promise<ModelRow | null> {
  let { data, error } = await supabase
    .from("models")
    .select("id, name, handle, slug, status, active, avatar_url, pixel_facebook, pixel_utmify, config")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    // Fallback caso a coluna config ainda não exista.
    const fb = await supabase
      .from("models")
      .select("id, name, handle, slug, status, active, avatar_url, pixel_facebook, pixel_utmify")
      .eq("slug", slug)
      .maybeSingle()
    if (fb.error) throw fb.error
    data = fb.data
  }
  if (!data) return null
  return { ...(data as any), config: normalizeConfig((data as any).config) } as ModelRow
}

export default function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data: model, error, isLoading } = useSWR(["model-page", slug], () => fetchModelBySlug(slug))

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9f6f2] text-[#4a5568]">Carregando...</main>
    )
  }

  // Página desligada (switch off) ou inexistente => 404. O switch "Ativa" controla a publicação.
  if (error || !model || !model.active) {
    notFound()
  }

  const c = model.config
  // Redes: desativada => não exibe o botão. Ativada com link => redireciona. Ativada sem link => "#" (rola para o topo).
  const social = (s: { url: string; disabled: boolean }) => (s.disabled ? undefined : s.url || "#")

  return (
    <main className="mx-auto max-w-md">
      <PixelScripts facebook={model.pixel_facebook} utmify={model.pixel_utmify} />
      <PrivacyPage
        data={{
          username: model.name,
          handle: model.handle,
          avatar: model.avatar_url || "",
          coverImage: c.coverUrl,
          bio: c.bio,
          isVerified: c.verified,
          stats: c.stats,
          socialLinks: {
            instagram: social(c.socials.instagram),
            twitter: social(c.socials.twitter),
            tiktok: social(c.socials.tiktok),
          },
          subscriptions: c.plans.map((p) => ({ id: p.id, name: planTitle(p), price: p.price, badge: p.badge })),
          principalId: c.plansSettings.principalId ?? undefined,
          promoEnabled: c.plansSettings.promoEnabled,
          postsCount: c.postsCount,
          mediasCount: mediasTotal(c),
          posts: c.posts.length > 0 ? c.posts.map((p) => ({ id: p.id, type: "image" as const, url: p.url, blur: p.blur, imagesCount: p.imagesCount, videosCount: p.videosCount, likes: p.likes })) : undefined,
          gridSize: c.gridSize,
          medias: c.medias,
          modelId: model.id,
          orderBumps: c.orderBumps,
          checkout: c.checkout,
        }}
      />
    </main>
  )
}
