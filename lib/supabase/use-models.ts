"use client"

import useSWR from "swr"
import { supabase } from "./client"

// ---------- Tipos de configuração visual da modelo ----------

export type SocialLink = {
  url: string
  // Quando true, o ícone vira um link inerte (#) que volta ao topo da página.
  disabled: boolean
}

export type Plan = {
  id: string
  months: number
  price: string
  // Título editável do botão (ex: "1 mês", "Acesso vitalício"). Se vazio, usa o padrão a partir dos meses.
  label?: string
  // Tagzinha verde exibida no canto superior esquerdo do botão (ex: "Economize 20%"). Se vazio, não aparece.
  badge?: string
}

// Texto padrão do plano a partir do número de meses.
export const planLabel = (months: number) => (months === 1 ? "1 mês" : `${months} meses`)

// Título exibido: usa o texto personalizado se houver, senão o padrão.
export const planTitle = (p: Plan) => (p.label && p.label.trim() ? p.label : planLabel(p.months))

export type MediaItem = {
  id: string
  url: string
  blur: boolean
}

export type PostItem = {
  id: string
  url: string
  blur?: boolean
  imagesCount?: number
  videosCount?: number
  likes?: string
}

// "Mimos" (order bumps) que aparecem no checkout para aumentar o ticket médio.
export type OrderBump = {
  id: string
  title: string
  description: string
  price: string // formato "R$ 0,00"
  imageUrl: string
  active: boolean
}

export const emptyBump = (): OrderBump => ({
  id: `b${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  title: "",
  description: "",
  price: "R$ 0,00",
  imageUrl: "",
  active: true,
})

// Converte uma string "R$ 24,89" em número 24.89.
// Também aceita números (retorna como está se for decimal, ou divide por 100 se parecer centavos).
export function priceToNumber(price: string | number): number {
  // Se já for número
  if (typeof price === "number") {
    // Se for um número grande (provavelmente centavos), divide por 100
    // Exemplo: 2488 -> 24.88
    // Se for um número pequeno com decimais, retorna como está
    // Exemplo: 24.88 -> 24.88
    return price > 100 && Number.isInteger(price) ? price / 100 : price
  }
  
  const str = String(price || "")
  const digits = str.replace(/\D/g, "")
  return digits ? Number.parseInt(digits, 10) / 100 : 0
}

// Tamanhos de grid disponíveis para a aba de Mídias.
export const GRID_SIZES = [6, 9, 12, 18] as const
export type GridSize = (typeof GRID_SIZES)[number]

export type ModelConfig = {
  coverUrl: string
  bio: string
  verified: boolean
  stats: {
    photos: number
    videos: number
    locked: number
    likes: string
  }
  socials: {
    instagram: SocialLink
    twitter: SocialLink
    tiktok: SocialLink
  }
  plans: Plan[]
  // Configurações de exibição dos planos na página pública.
  plansSettings: {
    // Id do plano que aparece em destaque no topo (principal). Se null/ausente, usa o primeiro.
    principalId: string | null
    // Quando false, esconde o título "Promoções" e mostra os demais planos soltos (flutuando) abaixo do principal.
    promoEnabled: boolean
  }
  postsCount: number
  posts: PostItem[]
  gridSize: GridSize
  medias: MediaItem[]
  // Order bumps / mimos exibidos no checkout.
  orderBumps: OrderBump[]
  // Configurações do checkout e pós-pagamento.
  checkout: {
    title: string
    subtitle: string
    // Comportamento do checkout:
    // "completo" = mostra mimos (order bumps) antes de gerar o PIX.
    // "direto" = vai direto pro PIX, sem mostrar mimos.
    mode: "completo" | "direto"
    // Liga/desliga o fluxo de pós-pagamento com fila (upsell). Desligado = mostra só "obrigada pela compra".
    queueEnabled: boolean
    // Tempo de fila em horas (ex: 3 = "seu pedido está numa fila de 3 horas")
    queueHours: number
    // Upsell de entrega prioritária
    priorityEnabled: boolean
    priorityPrice: string // formato "R$ 0,00"
    priorityText: string
    // Entregável: popup que aparece após o pagamento com link para o produto
    deliverableEnabled: boolean
    deliverableTitle: string
    deliverableButtonText: string
    deliverableButtonUrl: string
  }
}

// Cria um slot de mídia vazio (sem imagem). Usado para preencher posições do grid.
export const emptyMedia = (i = 0): MediaItem => ({
  id: `m${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
  url: "",
  blur: true,
})

// Garante que o array de mídias tenha exatamente `size` posições (mantém as preenchidas no começo).
export function resizeMedias(medias: MediaItem[], size: number): MediaItem[] {
  const out = medias.slice(0, size)
  while (out.length < size) out.push(emptyMedia(out.length))
  return out
}

// Novas redes começam desativadas: só aparecem na página depois que a pessoa ativa o switch e preenche o link.
export const emptySocial = (): SocialLink => ({ url: "", disabled: true })

export const defaultConfig = (): ModelConfig => ({
  coverUrl: "",
  bio: "",
  verified: true,
  stats: { photos: 0, videos: 0, locked: 0, likes: "0" },
  socials: { instagram: emptySocial(), twitter: emptySocial(), tiktok: emptySocial() },
  plans: [
    { id: "p1", months: 1, price: "R$ 0,00", label: "" },
    { id: "p2", months: 3, price: "R$ 0,00", label: "" },
    { id: "p3", months: 6, price: "R$ 0,00", label: "" },
  ],
  plansSettings: { principalId: "p1", promoEnabled: true },
  postsCount: 0,
  posts: [],
  gridSize: 18,
  medias: resizeMedias([], 18),
  orderBumps: [],
  checkout: {
    title: "Falta pouco!",
    subtitle: "Digite seu e-mail para receber o acesso ao conteúdo após o pagamento.",
    mode: "completo",
    queueEnabled: false,
    queueHours: 3,
    priorityEnabled: false,
    priorityPrice: "R$ 9,90",
    priorityText: "Receber agora",
    deliverableEnabled: false,
    deliverableTitle: "Seu acesso está liberado!",
    deliverableButtonText: "Acessar conteúdo",
    deliverableButtonUrl: "",
  },
})

// Mescla a config salva (parcial) com os defaults, garantindo todos os campos.
export function normalizeConfig(raw: Partial<ModelConfig> | null | undefined): ModelConfig {
  const d = defaultConfig()
  if (!raw) return d
  return {
    ...d,
    ...raw,
    stats: { ...d.stats, ...(raw.stats ?? {}) },
    socials: {
      instagram: { ...d.socials.instagram, ...(raw.socials?.instagram ?? {}) },
      twitter: { ...d.socials.twitter, ...(raw.socials?.twitter ?? {}) },
      tiktok: { ...d.socials.tiktok, ...(raw.socials?.tiktok ?? {}) },
    },
    plans: raw.plans && raw.plans.length > 0 ? raw.plans : d.plans,
    plansSettings: (() => {
      const plans = raw.plans && raw.plans.length > 0 ? raw.plans : d.plans
      const rs = raw.plansSettings ?? {}
      // Garante que o principal aponta para um plano existente; senão, usa o primeiro.
      const principalId =
        rs.principalId && plans.some((p) => p.id === rs.principalId) ? rs.principalId : (plans[0]?.id ?? null)
      return { principalId, promoEnabled: rs.promoEnabled !== false }
    })(),
    posts: raw.posts ?? [],
    gridSize: (GRID_SIZES as readonly number[]).includes(raw.gridSize as number) ? (raw.gridSize as GridSize) : 18,
    // Padroniza o array de mídias para o tamanho exato do grid escolhido.
    medias: resizeMedias(raw.medias ?? [], (GRID_SIZES as readonly number[]).includes(raw.gridSize as number) ? (raw.gridSize as number) : 18),
    orderBumps: Array.isArray(raw.orderBumps) ? raw.orderBumps : [],
    checkout: { ...d.checkout, ...(raw.checkout ?? {}) },
  }
}

// "Mídias" exibidas = soma de fotos + vídeos (mantém a linearidade dos números).
export const mediasTotal = (c: ModelConfig) => c.stats.photos + c.stats.videos

// ---------- Modelo ----------

export type Model = {
  id: string
  name: string
  handle: string
  slug: string
  status: "online" | "rascunho"
  active: boolean
  views: number
  revenue: number
  pixPendingAmount: number
  avatar_url: string | null
  bio: string | null
  pixel_facebook: string | null
  pixel_utmify: string | null
  config: ModelConfig
}

export type ModelStats = {
  pixCount: number
  pixPaid: number
  pixPaidAmount: number
  pixPendingAmount: number
  visits: number
  revenue: number
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

async function fetchModels(): Promise<Model[]> {
  // Tenta com a coluna config; se ela ainda não existir, faz fallback sem ela.
  let { data, error } = await supabase
    .from("models")
    .select(
      "id, name, handle, slug, status, active, views, revenue, avatar_url, bio, pixel_facebook, pixel_utmify, config",
    )
    .order("created_at", { ascending: true })

  if (error) {
    const fallback = await supabase
      .from("models")
      .select("id, name, handle, slug, status, active, views, revenue, avatar_url, bio, pixel_facebook, pixel_utmify")
      .order("created_at", { ascending: true })
    if (fallback.error) throw fallback.error
    data = fallback.data
  }

  // Busca pix pendentes de cada modelo
  const modelIds = (data ?? []).map((m: any) => m.id)
  const { data: payments } = await supabase
    .from("payments")
    .select("model_id, amount, status")
    .in("model_id", modelIds)
    .eq("status", "pendente")

  // Calcula pix pendente por modelo
  const pendingByModel: Record<string, number> = {}
  for (const p of payments ?? []) {
    if (!pendingByModel[p.model_id]) pendingByModel[p.model_id] = 0
    pendingByModel[p.model_id] += Number(p.amount || 0)
  }

  return (data ?? [])
    // Esconde os modelos "apagados" via soft-delete (quando o RLS bloqueia o DELETE real).
    .filter((m: any) => !(m.config && typeof m.config === "object" && m.config.__deleted === true))
    .map((m: any) => ({ 
      ...m, 
      config: normalizeConfig(m.config),
      pixPendingAmount: pendingByModel[m.id] ?? 0
    })) as Model[]
}

export function useModels() {
  const { data, error, isLoading, mutate } = useSWR<Model[]>("models", fetchModels)

  async function createModel(input: { name: string; handle: string }) {
    const handle = input.handle.startsWith("@") ? input.handle : `@${input.handle}`
    const slug = slugify(input.name) || slugify(handle)
    const base = { name: input.name, handle, slug, status: "online" as const, active: true }
    let { error: err } = await supabase.from("models").insert({ ...base, config: defaultConfig() })
    if (err) {
      // Fallback caso a coluna config ainda não exista.
      const retry = await supabase.from("models").insert(base)
      if (retry.error) throw retry.error
    }
    await mutate()
  }

  async function deleteModel(id: string) {
    // Remove primeiro os registros vinculados que NÃO têm "on delete cascade"
    // (payments usa "on delete set null", então pode sobrar e travar a UI).
    // Ignoramos erros aqui de propósito: o que importa é apagar o modelo.
    await supabase.from("payments").delete().eq("model_id", id)
    await supabase.from("visits").delete().eq("model_id", id)

    // O .select() devolve as linhas apagadas. Se o RLS bloquear, o Supabase
    // NÃO retorna erro — apenas apaga 0 linhas. Por isso checamos o retorno.
    const { data, error: err } = await supabase.from("models").delete().eq("id", id).select("id")
    if (err) throw err

    // DELETE funcionou (RLS permitiu): removeu de verdade.
    if (data && data.length > 0) {
      await mutate()
      return
    }

    // Fallback: o RLS bloqueou o DELETE (apagou 0 linhas). Como UPDATE é
    // permitido, marcamos o modelo como apagado dentro do próprio config
    // (jsonb) e desligamos a flag "active". O fetch filtra esses registros,
    // então o modelo some da lista sem precisar rodar nenhum script SQL.
    const { data: cfgRow } = await supabase.from("models").select("config").eq("id", id).single()
    const baseConfig =
      cfgRow && typeof (cfgRow as any).config === "object" && (cfgRow as any).config !== null
        ? (cfgRow as any).config
        : {}
    const deletedConfig = { ...baseConfig, __deleted: true }

    const { error: softErr } = await supabase
      .from("models")
      .update({ active: false, status: "rascunho", config: deletedConfig })
      .eq("id", id)

    if (softErr) {
      // Sem coluna config: ainda assim tentamos esconder via active/status.
      const retry = await supabase.from("models").update({ active: false, status: "rascunho" }).eq("id", id)
      if (retry.error) {
        throw new Error("Não foi possível apagar o modelo. Verifique a conexão com o Supabase.")
      }
    }
    await mutate()
  }

  async function updateModel(id: string, patch: Partial<Model>) {
    const { error: err } = await supabase.from("models").update(patch).eq("id", id)
    if (err) {
      // Fallback: a coluna "config" ainda não existe no banco.
      // Salva os demais campos para o painel não travar (config só persiste após rodar o script SQL).
      if ("config" in patch) {
        const { config, ...rest } = patch
        const retry = await supabase.from("models").update(rest).eq("id", id)
        if (retry.error) throw retry.error
        await mutate()
        throw new Error("CONFIG_COLUMN_MISSING")
      }
      throw err
    }
    await mutate()
  }

  return { models: data ?? [], error, isLoading, mutate, createModel, deleteModel, updateModel }
}

// Faz upload de uma imagem para o Storage e devolve a URL pública.
export async function uploadModelImage(modelId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg"
  const path = `${modelId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from("model-media").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  })
  if (error) throw error
  const { data } = supabase.storage.from("model-media").getPublicUrl(path)
  return data.publicUrl
}

async function fetchModelStats(modelId: string): Promise<ModelStats> {
  const [payments, visits] = await Promise.all([
    supabase.from("payments").select("amount, status").eq("model_id", modelId),
    supabase.from("visits").select("id", { count: "exact", head: true }).eq("model_id", modelId),
  ])

  if (payments.error) throw payments.error

  const rows = (payments.data ?? []) as { amount: number; status: string }[]
  const pixPaid = rows.filter((r) => r.status === "pago")
  const pixPending = rows.filter((r) => r.status === "pendente")

  return {
    pixCount: rows.length,
    pixPaid: pixPaid.length,
    pixPaidAmount: pixPaid.reduce((s, r) => s + Number(r.amount || 0), 0),
    pixPendingAmount: pixPending.reduce((s, r) => s + Number(r.amount || 0), 0),
    visits: visits.count ?? 0,
    revenue: pixPaid.reduce((s, r) => s + Number(r.amount || 0), 0),
  }
}

export function useModelStats(modelId: string | null) {
  const { data, error, isLoading } = useSWR<ModelStats>(
    modelId ? ["model-stats", modelId] : null,
    () => fetchModelStats(modelId as string),
  )
  return { stats: data, error, isLoading }
}

// ---------- Configurações (chaves de Gateway) ----------

export type GatewayType = "hyzepay" | "nexuspag"

export type GatewaySettings = {
  activeGateway: GatewayType
  hyzepay: {
    publicKey: string
    secretKey: string
  }
  nexuspag: {
    secretKey: string
  }
}

async function fetchSettings(): Promise<GatewaySettings> {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["hyzepay_public_key", "hyzepay_secret_key", "nexuspag_secret_key", "active_gateway"])
  if (error) throw error
  const map = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value])) as Record<string, string>
  return {
    activeGateway: (map.active_gateway as GatewayType) || "hyzepay",
    hyzepay: {
      publicKey: map.hyzepay_public_key ?? "",
      secretKey: map.hyzepay_secret_key ?? "",
    },
    nexuspag: {
      secretKey: map.nexuspag_secret_key ?? "",
    },
  }
}

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<GatewaySettings>("settings", fetchSettings)

  async function saveSettings(next: GatewaySettings) {
    const rows = [
      { key: "active_gateway", value: next.activeGateway, updated_at: new Date().toISOString() },
      { key: "hyzepay_public_key", value: next.hyzepay.publicKey, updated_at: new Date().toISOString() },
      { key: "hyzepay_secret_key", value: next.hyzepay.secretKey, updated_at: new Date().toISOString() },
      { key: "nexuspag_secret_key", value: next.nexuspag.secretKey, updated_at: new Date().toISOString() },
    ]
    const { error: err } = await supabase.from("settings").upsert(rows, { onConflict: "key" })
    if (err) throw err
    await mutate(next, { revalidate: false })
  }

  return { settings: data, error, isLoading, saveSettings }
}

// ---------- Pagamentos ----------

export type Payment = {
  id: string
  model_id: string | null
  email: string | null
  amount: number
  status: string
  plan_name: string | null
  bumps: { title: string; price: number }[]
  transaction_id: string | null
  external_id: string | null
  created_at: string
  paid_at: string | null
  model_name?: string
}

async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("id, model_id, email, amount, status, plan_name, bumps, transaction_id, external_id, created_at, paid_at, models(name)")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((p: any) => ({
    ...p,
    bumps: Array.isArray(p.bumps) ? p.bumps : [],
    model_name: p.models?.name ?? null,
  })) as Payment[]
}

export function usePayments() {
  const { data, error, isLoading, mutate } = useSWR<Payment[]>("payments", fetchPayments, {
    refreshInterval: 15000,
  })
  return { payments: data ?? [], error, isLoading, mutate }
}

// ---------- Stats Gerais do Dashboard ----------

export type DashboardStats = {
  totalRevenue: number
  totalPixPending: number
  activeModels: number
  conversion: number
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const [models, payments] = await Promise.all([
    supabase.from("models").select("id, active, status, views"),
    supabase.from("payments").select("amount, status"),
  ])

  if (models.error) throw models.error
  if (payments.error) throw payments.error

  const modelsData = (models.data ?? []) as { id: string; active: boolean; status: string; views: number }[]
  const paymentsData = (payments.data ?? []) as { amount: number; status: string }[]

  // Soma apenas pagamentos com status "pago"
  const paidPayments = paymentsData.filter((p) => p.status === "pago")
  const totalRevenue = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0)

  // Soma pagamentos pendentes
  const pendingPayments = paymentsData.filter((p) => p.status === "pendente")
  const totalPixPending = pendingPayments.reduce((s, p) => s + Number(p.amount || 0), 0)

  const totalViews = modelsData.reduce((s, m) => s + Number(m.views || 0), 0)
  const activeModels = modelsData.filter((m) => m.active && m.status === "online").length
  const conversion = totalViews > 0 ? (paidPayments.length / totalViews) * 100 : 0

  return { totalRevenue, totalPixPending, activeModels, conversion }
}

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR<DashboardStats>("dashboard-stats", fetchDashboardStats, {
    refreshInterval: 15000,
  })
  return { stats: data, error, isLoading }
}
