// Conteúdo padrão (hard code) da página inicial "/" (Privacy — Geovanna Nescau).
// Esses valores são o PADRÃO exibido quando NÃO existe um override salvo no banco.
// Ao editar pelo painel admin, salvamos um snapshot completo no Supabase que passa
// a ser carregado no servidor (sem "piscar" o hard code).

export type HomePost = {
  id: string
  type: "image" | "video"
  url: string
  blur?: boolean
  caption?: string
  imagesCount?: number
  videosCount?: number
  likes?: string
}

export type HomeSubscription = {
  id: string
  name: string
  price: string
  badge?: string
  discount?: string
}

export type HomeContent = {
  username: string
  handle: string
  forceGateway?: "nexuspag" | "hyzepay"
  isVerified: boolean
  bio: string
  avatar: string
  coverImage: string
  stats: {
    photos: number
    videos: number
    locked: number
    likes: string
  }
  postsCount: number
  mediasCount: number
  posts: HomePost[]
  medias: { id: string; url: string; type: "image" | "video"; blur?: boolean }[]
  socialLinks: {
    instagram?: string
    twitter?: string
    tiktok?: string
  }
  subscriptions: HomeSubscription[]
  principalId?: string
  promoEnabled?: boolean
  checkout: {
    title: string
    subtitle: string
    queueEnabled?: boolean
    queueHours?: number
    queueReason?: string
    priorityEnabled?: boolean
    priorityPrice?: string
    priorityText?: string
    callUpsellEnabled?: boolean
    callUpsellPrice?: string
    callUpsellTitle?: string
    callUpsellDescription?: string
    deliverableEnabled?: boolean
    deliverableTitle?: string
    deliverableDescription?: string
    deliverableButtonText?: string
    deliverableButtonUrl?: string
  }
}

// Nome da modelo desta página.
export const HOME_MODEL_NAME = "Geovanna Nescau"

// PADRÃO (hard code) — igual ao que estava embutido em app/page.tsx.
export const HOME_DEFAULT: HomeContent = {
  username: HOME_MODEL_NAME,
  handle: "@geovannanescau",
  // Esta página sempre gera o PIX pela AtenasPay, ignorando a gateway do painel.
  forceGateway: "nexuspag",
  isVerified: true,
  bio: "Seu docinho favorito 🍫 Conteúdo sem censura, atualizado toda semana. Vem viver essa experiência comigo por aqui.",
  avatar: "/models/geovanna-nescau/avatar-home.jpg",
  coverImage: "/models/geovanna-nescau/cover.jpg",
  stats: {
    photos: 214,
    videos: 68,
    locked: 47,
    likes: "38.2k",
  },
  postsCount: 283,
  mediasCount: 283,
  medias: [],
  posts: [
    {
      id: "post-video-1",
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4906709384033930427-TwvYQC4DHTNLPMWTQSceyf9BI3NtNN.jpg",
      caption: "acordei com vontade de aprontar 🙈 vem ver o resto...",
      imagesCount: 214,
      videosCount: 68,
      likes: "38.2k",
    },
    {
      id: "post-2",
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-tbsiEKteBbseC0EIln2RWlp2sr3E7L.png",
      caption: "day off no rio 🌿 tirei umas fotinhas bem safadinhas depois 🔥",
      imagesCount: 214,
      videosCount: 68,
      likes: "41.7k",
    },
    {
      id: "post-3",
      type: "image",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image%20%281%29-TW4VHQjaQvr4XzjLZpnc2okyI3huEr.png",
      caption: "só quem assina vê 🔒",
      imagesCount: 214,
      videosCount: 68,
      likes: "52.9k",
    },
  ],
  socialLinks: {
    instagram: "https://instagram.com/eu.geovanna334",
    // Ícones visíveis, porém não clicáveis (sem link).
    twitter: "disabled",
    tiktok: "disabled",
  },
  subscriptions: [
    { id: "1", name: "2 meses", price: "R$ 19,90", badge: "Mais popular" },
    { id: "2", name: "3 meses", price: "R$ 49,90", discount: "-16%" },
    { id: "3", name: "6 meses", price: "R$ 89,90", discount: "-25%" },
  ],
  principalId: "1",
  promoEnabled: true,
  checkout: {
    title: "Falta pouco!",
    subtitle: "Digite seu e-mail para receber o acesso ao conteúdo após o pagamento.",
    queueEnabled: true,
    queueHours: 3,
    queueReason:
      "Estamos com muitas pessoas comprando agora, por isso o envio automático pode levar até 3 horas.",
    priorityEnabled: true,
    priorityPrice: "R$ 9,00",
    priorityText: "Receber agora",
    callUpsellEnabled: true,
    callUpsellPrice: "R$ 15,90",
    callUpsellTitle: "Quer uma chamada de vídeo comigo?",
    callUpsellDescription:
      "Uma chamadinha de 10 minutos só nós dois pra gente gozar bem gostoso. Vem viver essa por só mais um pouquinho. Vaga limitada!",
    deliverableEnabled: true,
    deliverableTitle: "Aqui está meu conteúdo exclusivo",
    deliverableDescription: "Clique no botão abaixo para acessar.",
    deliverableButtonText: "Acessar",
    deliverableButtonUrl: "https://t.me/+UxuYArZGWiBjNjAx",
  },
}

// Mescla um override (snapshot parcial vindo do banco) sobre o padrão,
// garantindo que todos os campos existam mesmo em overrides antigos.
export function mergeHomeContent(override: Partial<HomeContent> | null | undefined): HomeContent {
  const d = HOME_DEFAULT
  if (!override) return d
  return {
    ...d,
    ...override,
    stats: { ...d.stats, ...(override.stats ?? {}) },
    socialLinks: { ...d.socialLinks, ...(override.socialLinks ?? {}) },
    posts: Array.isArray(override.posts) ? override.posts : d.posts,
    medias: Array.isArray(override.medias) ? override.medias : d.medias,
  // O plano principal da Geovanna Nescau é sempre de 2 meses.
  // Normaliza overrides antigos do painel que ainda possam estar salvos como "1 mês".
  subscriptions: (Array.isArray(override.subscriptions) ? override.subscriptions : d.subscriptions).map((subscription, index) =>
    index === 0 ? { ...subscription, name: "2 meses" } : subscription,
  ),
  checkout: { ...d.checkout, ...(override.checkout ?? {}) },
  }
}
