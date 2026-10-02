"use client"

import { useRef, useState } from "react"
import { CheckoutModal } from "./checkout-modal"
import { useExitRedirect } from "@/lib/landing/use-exit-redirect"
import type { OrderBump } from "@/lib/supabase/use-models"

type PrivacyPost = {
  id: string
  type: "image" | "video"
  url: string
  blur?: boolean
  likes?: string
  imagesCount?: number
  videosCount?: number
  /** Título/legenda curta exibida abaixo da foto (estilo Instagram) */
  caption?: string
}

type PrivacyPageData = {
  username: string
  handle: string
  bio: string
  avatar: string
  coverImage: string
  isVerified: boolean
  stats: {
    photos: number
    videos: number
    locked: number
    likes: string
  }
  socialLinks: {
    instagram?: string
    twitter?: string
    tiktok?: string
  }
  subscriptions: {
    id: string
    name: string
    price: string
    discount?: string
    badge?: string
  }[]
  // Id do plano principal (destaque no topo). Se ausente, usa o primeiro da lista.
  principalId?: string
  // Quando false, esconde o título "Promoções" e mostra os demais planos soltos abaixo do principal.
  promoEnabled?: boolean
  postsCount: number
  mediasCount: number
  posts: PrivacyPost[]
  gridSize: number
  medias: { id: string; url: string; type?: "image" | "video"; blur: boolean }[]
  colors: {
    background: string
    text: string
    subtext: string
    accent: string
    cardBg: string
  }
  // Checkout / PIX
  modelId?: string
  // Força uma gateway específica nesta página (ex.: /nescau sempre na AtenasPay).
  forceGateway?: "nexuspag" | "hyzepay"
  orderBumps?: OrderBump[]
  checkout?: {
    title: string
    subtitle: string
    mode?: "completo" | "direto"
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

// Inline SVG icons to avoid external library breakage
const IconLock = ({ className = "w-5 h-5" }: { className?: string; strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M256.1 32c53 0 96 43 96 96l0 64-192 0 0-64c0-53 43-96 96-96zm-128 96l0 64-16 0c-44.2 0-80 35.8-80 80l0 160c0 44.2 35.8 80 80 80l288 0c44.2 0 80-35.8 80-80l0-160c0-44.2-35.8-80-80-80l-16 0 0-64c0-70.7-57.3-128-128-128s-128 57.3-128 128zm-16 96l288 0c26.5 0 48 21.5 48 48l0 160c0 26.5-21.5 48-48 48l-288 0c-26.5 0-48-21.5-48-48l0-160c0-26.5 21.5-48 48-48zm160 88c0-8.8-7.2-16-16-16s-16 7.2-16 16l0 80c0 8.8 7.2 16 16 16s16-7.2 16-16l0-80z" />
  </svg>
)

const IconHeart = ({ className = "w-5 h-5" }: { className?: string; strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M244 130.6l-12-13.5-4.2-4.7c-26-29.2-65.3-42.8-103.8-35.8c-53.3 9.7-92 56.1-92 110.3v3.5c0 32.3 13.4 63.1 37.1 85.1L253 446.8c.8 .7 1.9 1.2 3 1.2s2.2-.4 3-1.2L443 275.5c23.6-22 37-52.8 37-85.1v-3.5c0-54.2-38.7-100.6-92-110.3c-38.5-7-77.8 6.6-103.8 35.8l-4.2 4.7-12 13.5c-3 3.4-7.4 5.4-12 5.4s-8.9-2-12-5.4zm34.9-57.1C311 48.4 352.7 37.7 393.7 45.1C462.2 57.6 512 117.3 512 186.9v3.5c0 36-13.1 70.6-36.6 97.5c-3.4 3.8-6.9 7.5-10.7 11l-184 171.3c-.8 .8-1.7 1.5-2.6 2.2c-6.3 4.9-14.1 7.5-22.1 7.5c-9.2 0-18-3.5-24.8-9.7L47.2 299c-3.8-3.5-7.3-7.2-10.7-11C13.1 261 0 226.4 0 190.4v-3.5C0 117.3 49.8 57.6 118.3 45.1c40.9-7.4 82.6 3.2 114.7 28.4c6.7 5.3 13 11.1 18.7 17.6l4.2 4.7 4.2-4.7c4.2-4.7 8.6-9.1 13.3-13.1c1.8-1.5 3.6-3 5.4-4.5z" />
  </svg>
)

const IconImage = ({ className = "w-5 h-5" }: { className?: string; strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M64 64C46.3 64 32 78.3 32 96V329.4l67.7-67.7c15.6-15.6 40.9-15.6 56.6 0L224 329.4 355.7 197.7c15.6-15.6 40.9-15.6 56.6 0L480 265.4V96c0-17.7-14.3-32-32-32H64zM32 374.6V416c0 17.7 14.3 32 32 32h41.4l96-96-67.7-67.7c-3.1-3.1-8.2-3.1-11.3 0L32 374.6zM389.7 220.3c-3.1-3.1-8.2-3.1-11.3 0L150.6 448H448c17.7 0 32-14.3 32-32V310.6l-90.3-90.3zM0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zm160 48a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zm-64 0a48 48 0 1 1 96 0 48 48 0 1 1 -96 0z" />
  </svg>
)

const IconClapperboard = ({ className = "w-5 h-5", strokeWidth = 1.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="currentColor" className={className}>
    <path d="M576 182.9l0 256c0 20.2-16.3 36.6-36.6 36.6l-438.9 0c-20.2 0-36.6-16.3-36.6-36.6l0-256 512 0zm0-36.6l-111.3 0 99.8-99.8c7.1 6.6 11.5 16.1 11.5 26.6l0 73.1zm-285 0l109.7-109.7 122.1 0-109.7 109.7-122.1 0zm-51.8 0l-121.9 0 109.7-109.7 122.1 0-109.7 109.7-.1 0zM100.5 36.6l74.7 0-109.7 109.7-1.6 0 0-73.1c0-20.2 16.3-36.6 36.6-36.6zm512 109.7l0-73.1C612.6 32.8 579.8 0 539.4 0L100.5 0C60.2 0 27.4 32.8 27.4 73.1l0 73.1 0 18.3 0 18.3 0 256c0 40.3 32.8 73.1 73.1 73.1l438.9 0c40.3 0 73.1-32.8 73.1-73.1l0-256 0-18.3 0-18.3zM274.4 221.9c-5.6-3.3-12.7-3.3-18.4-.1s-9.3 9.3-9.3 15.9l0 182.9c0 6.5 3.5 12.6 9.3 15.9s12.7 3.2 18.4-.1l155.4-91.4c5.6-3.3 9-9.3 9-15.8s-3.4-12.5-9-15.8L274.4 221.9zM384.4 329.1l-101 59.4 0-118.9 101 59.4z" />
  </svg>
)

const IconInstagram = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className={className}>
    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
  </svg>
)

const IconMoreVertical = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className={className}
    strokeWidth="2"
  >
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
)

const IconSmartphone = ({ className = "w-5 h-5", strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 308 512" fill="currentColor" className={className}>
    <path d="M62.8 96.3c-12.6 0-22.7 10.1-22.7 22.7l0 272.3c0 12.6 10.1 22.7 22.7 22.7l181.5 0c12.6 0 22.7-10.1 22.7-22.7l0-272.3c0-12.6-10.1-22.7-22.7-22.7l-181.5 0zM17.4 119c0-25 20.4-45.4 45.4-45.4l181.5 0c25 0 45.4 20.4 45.4 45.4l0 272.3c0 25-20.4 45.4-45.4 45.4l-181.5 0c-25 0-45.4-20.4-45.4-45.4l0-272.3zM258.3 10.6c0-5.9-4.7-10.6-10.5-10.6L59.3 0C53.6 0 48.9 4.8 48.9 10.6s4.7 10.6 10.5 10.6l188.5 0c5.8 0 10.5-4.8 10.5-10.6zm0 490.7c0-5.8-4.7-10.6-10.5-10.6l-188.5 0c-5.8 0-10.5 4.8-10.5 10.6S53.6 512 59.3 512l188.5 0c5.8 0 10.5-4.8 10.5-10.6z" />
  </svg>
)

const IconGlobe = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" fill="currentColor" className={className}>
    <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm193.2 152h-82.5c-9-44.4-24.1-82.2-43.2-109.1 55 18.2 100.2 57.9 125.7 109.1zM336 256c0 22.9-1.6 44.2-4.3 64H164.3c-2.7-19.8-4.3-41.1-4.3-64s1.6-44.2 4.3-64h167.4c2.7 19.8 4.3 41.1 4.3 64zM248 40c26.9 0 61.4 44.1 78.1 120H169.9C186.6 84.1 221.1 40 248 40zm-67.5 10.9c-19 26.8-34.2 64.6-43.2 109.1H54.8c25.5-51.2 70.7-90.9 125.7-109.1zM32 256c0-22.3 3.4-43.8 9.7-64h90.5c-2.6 20.5-4.2 41.8-4.2 64s1.5 43.5 4.2 64H41.7c-6.3-20.2-9.7-41.7-9.7-64zm22.8 96h82.5c9 44.4 24.1 82.2 43.2 109.1-55-18.2-100.2-57.9-125.7-109.1zM248 472c-26.9 0-61.4-44.1-78.1-120h156.2c-16.7 75.9-51.2 120-78.1 120zm67.5-10.9c19-26.8 34.2-64.6 43.2-109.1h82.5c-25.5 51.2-70.7 90.9-125.7 109.1zM363.8 320c2.6-20.5 4.2-41.8 4.2-64s-1.5-43.5-4.2-64h90.5c6.3 20.2 9.7 41.7 9.7 64s-3.4 43.8-9.7 64h-90.5z" />
  </svg>
)

const IconChevronUp = ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className={className}
    style={style}
    strokeWidth="2"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const VerifiedBadge = ({ className = "w-5 h-5", color = "#f97316" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    fill={color}
    aria-hidden="true"
    className={className}
  >
    <path d="M190.6 71.4C203 47.9 227.7 32 256 32s53 15.9 65.4 39.4c3.6 6.8 11.5 10.1 18.8 7.8c25.4-7.8 54.1-1.6 74.1 18.4s26.2 48.7 18.4 74.1c-2.3 7.3 1 15.2 7.8 18.8C464.1 203 480 227.7 480 256s-15.9 53-39.4 65.4c-6.8 3.6-10.1 11.5-7.8 18.8c7.8 25.4 1.6 54.1-18.4 74.1s-48.7 26.2-74.1 18.4c-7.3-2.3-15.2 1-18.8 7.8C309 464.1 284.3 480 256 480s-53-15.9-65.4-39.4c-3.6-6.8-11.5-10.1-18.8-7.8c-25.4 7.8-54.1 1.6-74.1-18.4s-26.2-48.7-18.4-74.1c2.3-7.3-1-15.2-7.8-18.8C47.9 309 32 284.3 32 256s15.9-53 39.4-65.4c6.8-3.6 10.1-11.5 7.8-18.8c-7.8-25.4-1.6-54.1 18.4-74.1s48.7-26.2 74.1-18.4c7.3 2.3 15.2-1 18.8-7.8zM256 0c-36.1 0-68 18.1-87.1 45.6c-33-6-68.3 3.8-93.9 29.4s-35.3 60.9-29.4 93.9C18.1 188 0 219.9 0 256s18.1 68 45.6 87.1c-6 33 3.8 68.3 29.4 93.9s60.9 35.3 93.9 29.4C188 493.9 219.9 512 256 512s68-18.1 87.1-45.6c33 6 68.3-3.8 93.9-29.4s35.3-60.9 29.4-93.9C493.9 324 512 292.1 512 256s-18.1-68-45.6-87.1c6-33-3.8-68.3-29.4-93.9s-60.9-35.3-93.9-29.4C324 18.1 292.1 0 256 0zM363.3 203.3c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0L224 297.4l-52.7-52.7c-6.2-6.2-16.4-6.2-22.6 0s-6.2 16.4 0 22.6l64 64c6.2 6.2 16.4 6.2 22.6 0l128-128z" />
  </svg>
)

export function PrivacyPage({
  data,
  exitRedirectUrl,
  callUpsellImage,
  checkoutModelName,
}: {
  data: Partial<PrivacyPageData>
  /** Quando definido, ao tentar sair (ou após 1 min na tela) redireciona para esta URL (funil de desconto). */
  exitRedirectUrl?: string
  callUpsellImage?: string
  /** Nome exibido no checkout e enviado à descrição do PIX. */
  checkoutModelName?: string
}) {
  const colors = data.colors || {
    background: "#f9f6f2",
    text: "#1a202c",
    subtext: "#4a5568",
    accent: "#f97316",
    cardBg: "#ffffff",
  }

  const username = data.username || "SeuNome"
  const handle = data.handle || "@seunome"
  const bio =
    data.bio ||
    "Adicione aqui a bio da modelo no painel administrativo."
  const avatar = data.avatar || ""
  const coverImage = data.coverImage || ""
  const isVerified = data.isVerified !== false
  const stats = data.stats || { photos: 0, videos: 0, locked: 0, likes: "0" }
  const socialLinks = data.socialLinks || { instagram: "#", twitter: "#", tiktok: "#" }
  const subscriptions = data.subscriptions || [
    { id: "1", name: "1 mês", price: "R$ 0,00" },
    { id: "2", name: "3 meses", price: "R$ 0,00" },
    { id: "3", name: "6 meses", price: "R$ 0,00" },
  ]
  // Plano principal (destaque) e os demais. Sem duplicar: o principal sai da lista de promoções.
  const promoEnabled = data.promoEnabled !== false
  const principalPlan = subscriptions.find((p) => p.id === data.principalId) || subscriptions[0]
  const otherPlans = subscriptions.filter((p) => p.id !== principalPlan?.id)
  const postsCount = data.postsCount || 0
  const mediasCount = data.mediasCount || 0
  const gridSize = data.gridSize || 18
  // Só as mídias com imagem entram no grid público, alinhadas à esquerda na ordem dos blocos.
  const filledMedias = (data.medias || []).filter((m) => m.url).map((m) => ({ ...m, type: m.type ?? "image" }))

  const posts: PrivacyPost[] = data.posts || [
    {
      id: "p1",
      type: "image",
      url: "",
      blur: true,
      imagesCount: stats.photos,
      videosCount: stats.videos,
      likes: stats.likes,
    },
  ]
  const galleryPosts = filledMedias.length ? filledMedias : posts

  const [promosOpen, setPromosOpen] = useState(true)
  const [bioExpanded, setBioExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<"posts" | "medias">("posts")
  const [langOpen, setLangOpen] = useState(false)
  const plansRef = useRef<HTMLDivElement>(null)

  // Dados do checkout (PIX).
  const orderBumps = data.orderBumps ?? []
  const checkoutCopy = data.checkout ?? {
    title: "Adquirir plano",
    subtitle: "Pagamento anônimo e acesso privado. Nenhum dado pessoal é necessário.",
    mode: "direto" as const,
    deliverableEnabled: false,
    deliverableTitle: "Seu acesso está liberado!",
    deliverableDescription: "",
    deliverableButtonText: "Acessar conteúdo",
    deliverableButtonUrl: "",
  }
  const privacyCheckoutMode = "completo" as const
  const privacyCheckoutSubtitle = "Pagamento anônimo e acesso privado. Nenhum dado pessoal é necessário."
  const [checkoutPlan, setCheckoutPlan] = useState<{ id: string; name: string; price: string } | null>(null)
  const [offerPlan, setOfferPlan] = useState<{ id: string; name: string; price: string } | null>(null)

  // Funil de desconto: se a pessoa tentar sair sem gerar PIX, redireciona para a oferta.
  // Desligado enquanto o checkout está aberto, para não interromper o pagamento.
  // Downsell desabilitado somente nesta página; o redirect permanece configurado para reativação futura.
  useExitRedirect(exitRedirectUrl, true)

  // O primeiro clique mostra uma oferta convidativa; o PIX só é criado após confirmar.
  const handlePlanClick = (plan?: { id: string; name: string; price: string }) => {
    if (plan) {
      setOfferPlan(plan)
      return
    }
    // Sem plano (ex: "Ver completo") -> abre a oferta do plano principal, ou rola até as assinaturas.
    if (principalPlan) {
      setOfferPlan(principalPlan)
      return
    }
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // Clicar numa rede social: com link preenchido => abre o link; sem link ("#") => arrasta a página para o início.
  const handleScrollTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSocialClick = (link?: string) => {
  if (link && link !== "#") {
  window.open(link, "_blank", "noopener,noreferrer")
  } else {
  handleScrollTop()
  }
  }

  const displayHandle = handle.startsWith("@") ? handle : `@${handle}`
  const bioIsLong = bio.length > 110
  const buttonGradient = "linear-gradient(90deg, #f3924c 0%, #f7b389 55%, #f6d2cb 100%)"

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: colors.background }}>
      <div className="max-w-md mx-auto pb-10" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-6" style={{ backgroundColor: colors.background }}>
          <div className="w-[22px]" />
          <svg width="100" height="21" viewBox="0 0 86 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="privacy">
            <path d="M5.80925 0.639434C6.59521 0.213146 7.48811 2.43232e-06 8.49328 2.43232e-06C9.66421 2.43232e-06 10.7228 0.293075 11.6746 0.873892C12.6209 1.46004 13.3748 2.2913 13.9255 3.36768C14.4762 4.44405 14.7542 5.69094 14.7542 7.11368C14.7542 8.53641 14.4762 9.78863 13.9255 10.881C13.3748 11.9734 12.6209 12.8206 11.6746 13.4227C10.7282 14.0249 9.66421 14.3233 8.49328 14.3233C7.48811 14.3233 6.60056 14.1155 5.83064 13.6998C5.48845 13.5133 5.173 13.3055 4.88428 13.071C4.51535 12.7726 3.96465 13.0337 3.96465 13.508V17.4352C3.96465 17.7442 3.71335 18 3.3979 18H1.06675C0.756641 18 0.5 17.7496 0.5 17.4352V0.788635C0.5 0.479576 0.751294 0.223803 1.06675 0.223803H3.3979C3.70801 0.223803 3.96465 0.474248 3.96465 0.788635V0.815278C3.96465 1.29485 4.5207 1.5453 4.88962 1.24689C5.1623 1.02309 5.46706 0.820606 5.8039 0.639434H5.80925ZM10.7924 4.92895C10.4502 4.32149 10.001 3.86323 9.43964 3.54352C8.87824 3.22913 8.27407 3.06927 7.62712 3.06927C6.98017 3.06927 6.39739 3.22913 5.83598 3.55418C5.27458 3.87922 4.82546 4.34814 4.48327 4.96093C4.14109 5.57371 3.96999 6.2984 3.96999 7.12966C3.96999 7.96093 4.14109 8.68562 4.48327 9.2984C4.82546 9.91119 5.27458 10.3854 5.83598 10.7052C6.39739 11.0302 6.99087 11.1901 7.62712 11.1901C8.26338 11.1901 8.88359 11.0249 9.43964 10.6892C10.001 10.3588 10.4502 9.88455 10.7924 9.26643C11.1345 8.65364 11.3056 7.9183 11.3056 7.07105C11.3056 6.2238 11.1345 5.52043 10.7924 4.91297V4.92895Z" fill="#23201F"/>
            <path d="M21.2398 0.612793C21.8012 0.293077 22.4214 0.101247 23.1058 0.026647C23.4479 -0.0106532 23.7474 0.255777 23.7474 0.596807V3.18118C23.7474 3.50089 23.4907 3.75666 23.1699 3.75666H22.8117C21.6996 3.75666 20.8655 4.01244 20.2987 4.52398C19.7373 5.03553 19.454 5.9254 19.454 7.19361V13.3641C19.454 13.6838 19.1973 13.9396 18.8765 13.9396H16.4545C16.1337 13.9396 15.877 13.6838 15.877 13.3641V0.761993C15.877 0.442278 16.1337 0.186505 16.4545 0.186505H18.8765C19.1973 0.186505 19.454 0.442278 19.454 0.761993C19.454 1.25222 20.0368 1.51865 20.4057 1.19361C20.657 0.969809 20.935 0.777979 21.2344 0.607464L21.2398 0.612793Z" fill="#23201F"/>
            <path d="M28.6663 0.831261V13.1616C28.6663 13.5879 28.3188 13.9343 27.891 13.9343H25.9395C25.5118 13.9343 25.1642 13.5879 25.1642 13.1616V0.831261C25.1642 0.404974 25.5118 0.0586149 25.9395 0.0586149H27.891C28.3188 0.0586149 28.6663 0.404974 28.6663 0.831261Z" fill="#23201F"/>
            <path d="M37.2958 7.55062L39.9638 0.511542C40.0654 0.213141 40.3434 0.0106543 40.6642 0.0106543H42.835C43.3483 0.0106543 43.7011 0.5222 43.5247 0.996444L38.8998 13.46C38.7929 13.7478 38.5149 13.9396 38.2101 13.9396H34.9486C34.6385 13.9396 34.3658 13.7478 34.2589 13.46L29.6501 0.991116C29.4736 0.511542 29.8265 0.00532567 30.3398 0.00532567H32.5373C32.8527 0.00532567 33.1361 0.207812 33.2377 0.506214L35.9057 7.54529C36.3655 8.71225 36.8413 8.74955 37.3012 7.54529L37.2958 7.55062Z" fill="#23201F"/>
            <path d="M44.717 3.34103C45.2677 2.26998 46.0109 1.44405 46.9519 0.868561C47.8929 0.293073 48.9462 0 50.1118 0C51.1277 0 52.0152 0.207815 52.7798 0.618117C53.1166 0.799289 53.4214 1.00178 53.6941 1.22558C54.063 1.52398 54.6084 1.26821 54.6084 0.793961V0.783304C54.6084 0.474245 54.8597 0.223801 55.1698 0.223801H57.5116C57.8217 0.223801 58.073 0.474245 58.073 0.783304V13.3748C58.073 13.6838 57.8217 13.9343 57.5116 13.9343H55.1698C54.8597 13.9343 54.6084 13.6838 54.6084 13.3748V13.3481C54.6084 12.8739 54.0577 12.6234 53.6887 12.9218C53.4161 13.1456 53.1113 13.3428 52.7798 13.524C51.9992 13.9449 51.1063 14.1528 50.0904 14.1528C48.9462 14.1528 47.8983 13.8543 46.9573 13.2629C46.0163 12.6714 45.2677 11.8295 44.7224 10.7531C44.1717 9.6714 43.899 8.42984 43.899 7.02842C43.899 5.627 44.1717 4.41208 44.7224 3.34103H44.717ZM54.0202 4.95027C53.6887 4.34281 53.2343 3.87922 52.6675 3.55417C52.1008 3.22913 51.4913 3.06927 50.839 3.06927C50.1867 3.06927 49.5878 3.22913 49.0371 3.54352C48.4864 3.8579 48.0426 4.32149 47.7005 4.92895C47.3583 5.53641 47.1872 6.25577 47.1872 7.08703C47.1872 7.91829 47.3583 8.64298 47.7005 9.26643C48.0426 9.88987 48.4918 10.3694 49.0532 10.6998C49.6146 11.0302 50.2081 11.2007 50.8443 11.2007C51.4806 11.2007 52.1061 11.0409 52.6729 10.7158C53.2396 10.3908 53.6887 9.92717 54.0256 9.31971C54.3571 8.71225 54.5282 7.98757 54.5282 7.14032C54.5282 6.29307 54.3624 5.56305 54.0256 4.95559L54.0202 4.95027Z" fill="#23201F"/>
            <path d="M60.2919 3.31972C60.8586 2.27531 61.6499 1.46537 62.6605 0.889877C63.671 0.314389 64.8259 0.0266446 66.1251 0.0266446C67.7986 0.0266446 69.1888 0.442275 70.2848 1.27886C71.012 1.83304 71.5841 2.53641 71.9958 3.38899C72.3112 4.03908 71.8247 4.79574 71.1029 4.79574H69.4561C69.0925 4.79574 68.761 4.59325 68.5846 4.27354C68.3921 3.93251 68.1408 3.64476 67.8253 3.42096C67.3602 3.09059 66.7881 2.92007 66.1037 2.92007C65.1253 2.92007 64.3554 3.27176 63.7833 3.98046C63.2112 4.68384 62.9278 5.68561 62.9278 6.98579C62.9278 8.28597 63.2112 9.2611 63.7833 9.96448C64.35 10.6679 65.1253 11.0249 66.1037 11.0249C67.28 11.0249 68.1141 10.5773 68.5953 9.68206C68.7664 9.36767 69.0979 9.17584 69.4561 9.17584H71.0708C71.8193 9.17584 72.2952 9.96448 71.953 10.6306C71.5466 11.4298 70.9852 12.1012 70.2741 12.6554C69.1674 13.5133 67.7826 13.9449 66.1251 13.9449C64.8205 13.9449 63.6656 13.6572 62.6605 13.0817C61.6499 12.5062 60.864 11.6963 60.2919 10.6519C59.7198 9.60746 59.4364 8.38721 59.4364 6.99112C59.4364 5.59503 59.7198 4.37478 60.2919 3.33037V3.31972Z" fill="#23201F"/>
            <path d="M85.2181 1.14032L78.246 17.4938C78.1177 17.7975 77.8183 17.9947 77.4868 17.9947H75.5085C74.915 17.9947 74.5194 17.3925 74.7547 16.849L76.7597 12.373C76.9468 11.8401 76.7971 11.5577 76.6046 11.1474L72.4449 1.12966C72.3326 0.857904 72.1936 0 73.2041 0H74.9739C75.2198 0 75.5299 0 75.7224 0.426288L78.2941 6.76199C78.6256 7.46003 78.754 7.52398 79.0641 6.76199L81.6732 0.447602C81.8925 0 82.1598 0 82.4913 0H84.4642C85.0523 0 85.448 0.596803 85.2234 1.13499L85.2181 1.14032Z" fill="#23201F"/>
            <path d="M81.6626 17.3446C81.2562 16.9556 81.0477 16.4654 81.0477 15.8845C81.0477 15.3037 81.2509 14.8188 81.6626 14.4245C82.0689 14.0355 82.5822 13.8384 83.2024 13.8384C83.8226 13.8384 84.3306 14.0355 84.7423 14.4245C85.1486 14.8135 85.3571 15.3037 85.3571 15.8845C85.3571 16.4654 85.154 16.9556 84.7423 17.3446C84.3359 17.7336 83.8226 17.9307 83.2024 17.9307C82.5822 17.9307 82.0743 17.7336 81.6626 17.3446Z" fill="#F68D3D"/>
          </svg>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-label="Selecionar idioma"
              className="cursor-pointer"
            >
              <IconGlobe className="w-[22px] h-[22px] text-[#676767]" />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 mt-2 z-20 w-40 rounded-sm border border-gray-300 bg-white">
                  {["English", "Portuguese", "Spanish"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLangOpen(false)}
                      className="block w-full px-4 py-2 text-left text-[15px] text-[#475569]"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        <div className="px-4 flex flex-col gap-4">
          {/* Profile Card */}
          <div className="rounded-3xl overflow-hidden border border-gray-200" style={{ backgroundColor: colors.cardBg }}>
            {/* Cover */}
            <div className="relative">
              {coverImage ? (
                <div className="w-full h-20 bg-cover bg-center" style={{ backgroundImage: `url(${coverImage})` }} />
              ) : (
                <div className="w-full h-20" style={{ backgroundColor: `${colors.accent}20` }} />
              )}
            </div>

            {/* Avatar + inline stats */}
            <div className="px-4 relative flex items-center min-h-[2.75rem]">
              <div className="absolute -top-10 left-4 z-10">
                {avatar ? (
                  <img
                    src={avatar || "/placeholder.svg"}
                    alt={username}
                    className="w-20 h-20 rounded-full border-4 object-cover bg-white"
                    style={{ borderColor: colors.cardBg }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-bold"
                    style={{ backgroundColor: colors.background, borderColor: colors.cardBg, color: colors.subtext }}
                  >
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div
                className="w-full flex items-center justify-end gap-4 pt-2 text-sm"
                style={{ color: colors.subtext }}
              >
                <div className="flex items-center gap-1 shrink-0">
                  <IconImage className="w-4 h-4" />
                  <span className="font-medium">{stats.photos}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <IconClapperboard className="w-4 h-4" />
                  <span className="font-medium">{stats.videos}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <IconLock className="w-4 h-4" />
                  <span className="font-medium">{stats.locked}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <IconHeart className="w-4 h-4" />
                  <span className="font-medium">{stats.likes}</span>
                </div>
              </div>
            </div>

            {/* Profile info */}
            <div className="px-4 pt-1 pb-4">
              <div className="flex items-center gap-1 mb-0.5">
                <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                  {username}
                </h1>
                {isVerified && <VerifiedBadge className="w-5 h-5 ml-1" color={colors.accent} />}
              </div>
              <p className="text-[15px] mb-2" style={{ color: colors.subtext }}>
                {displayHandle}
              </p>

              {bio && (
                <p
                  className={`text-[15px] leading-snug mb-1 whitespace-pre-line ${
                    bioExpanded ? "" : "line-clamp-2"
                  }`}
                  style={{ color: colors.text }}
                >
                  {bio}
                </p>
              )}
              {bioIsLong && (
                <button
                  onClick={() => setBioExpanded((v) => !v)}
                  className="text-[15px] font-medium"
                  style={{ color: colors.accent }}
                >
                  {bioExpanded ? "Ler menos" : "Ler mais"}
                </button>
              )}

              {/* Social Icons */}
              {(socialLinks.instagram || socialLinks.twitter || socialLinks.tiktok) && (
                <div className="flex items-center gap-3 mt-4">
                  {socialLinks.instagram &&
                    (socialLinks.instagram === "disabled" ? (
                      <span
                        aria-label="Instagram"
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
                        style={{ backgroundColor: "#f9f6f2" }}
                      >
                        <IconInstagram className="w-5 h-5" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSocialClick(socialLinks.instagram)}
                        aria-label="Instagram"
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
                        style={{ backgroundColor: "#f9f6f2" }}
                      >
                        <IconInstagram className="w-5 h-5" />
                      </button>
                    ))}
                  {socialLinks.twitter &&
                    (socialLinks.twitter === "disabled" ? (
                      <span
                        aria-label="X"
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
                        style={{ backgroundColor: "#f9f6f2" }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor">
                          <path d="M403.2 24L481.7 24 310.2 220 512 486.8 354 486.8 230.2 325.1 88.7 486.8 10 486.8 193.5 277.1 0 24 162 24 273.8 171.9 403.2 24zM375.6 439.9l43.5 0-280.8-371.4-46.7 0 284 371.4z" />
                        </svg>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSocialClick(socialLinks.twitter)}
                        aria-label="X"
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
                        style={{ backgroundColor: "#f9f6f2" }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor">
                          <path d="M403.2 24L481.7 24 310.2 220 512 486.8 354 486.8 230.2 325.1 88.7 486.8 10 486.8 193.5 277.1 0 24 162 24 273.8 171.9 403.2 24zM375.6 439.9l43.5 0-280.8-371.4-46.7 0 284 371.4z" />
                        </svg>
                      </button>
                    ))}
                  {socialLinks.tiktok &&
                    (socialLinks.tiktok === "disabled" ? (
                      <span
                        aria-label="TikTok"
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
                        style={{ backgroundColor: "#f9f6f2" }}
                      >
                        <svg className="w-[18px] h-[18px]" viewBox="0 0 448 512" fill="currentColor">
                          <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
                        </svg>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSocialClick(socialLinks.tiktok)}
                        aria-label="TikTok"
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
                        style={{ backgroundColor: "#f9f6f2" }}
                      >
                        <svg className="w-[18px] h-[18px]" viewBox="0 0 448 512" fill="currentColor">
                          <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
                        </svg>
                      </button>
                    ))}
                </div>
              )}

              {/* Assinaturas */}
              <div ref={plansRef} className="mt-6 scroll-mt-4">
                <h2 className="text-[17px] font-bold mb-3" style={{ color: colors.text }}>
                  Assinaturas
                </h2>
                {principalPlan && (
                  <div className="relative">
                    {principalPlan.badge && principalPlan.badge.trim() && (
                      <span className="absolute -top-2 left-3 z-10 rounded-full bg-[#16a34a] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                        {principalPlan.badge}
                      </span>
                    )}
                      <button
                        onClick={() => handlePlanClick(principalPlan)}
                        aria-label={`Adquirir plano ${principalPlan.name} por ${principalPlan.price}`}
                        className="w-full py-3 px-6 rounded-full flex items-center justify-between transition-transform active:scale-[0.98]"
                        style={{ background: buttonGradient, color: "#1a1a1a" }}
                      >
                        <span className="text-[17px] font-semibold">1 mês</span>
                        <span className="text-[17px] font-semibold">{principalPlan.price}</span>
                      </button>
                  </div>
                )}

                {otherPlans.length > 0 &&
                  (promoEnabled ? (
                    <div className="mt-4">
                      <button
                        onClick={() => setPromosOpen((v) => !v)}
                        className="w-full flex items-center justify-between mb-3"
                      >
                        <h2 className="text-[17px] font-bold" style={{ color: colors.text }}>
                          Promoções
                        </h2>
                        <IconChevronUp
                          className={`w-5 h-5 transition-transform ${promosOpen ? "" : "rotate-180"}`}
                          style={{ color: colors.subtext }}
                        />
                      </button>
                      {promosOpen && (
                        <div className="flex flex-col gap-3">
                          {otherPlans.map((plan) => (
                            <button
                              key={plan.id}
                              onClick={() => handlePlanClick(plan)}
                              className="w-full py-3 px-6 rounded-full flex items-center justify-between transition-transform active:scale-[0.98]"
                              style={{ background: buttonGradient, color: "#1a1a1a" }}
                            >
                              <span className="text-[17px] font-medium">{plan.name}</span>
                              <span className="text-[17px] font-semibold">{plan.price}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Promoções desativadas: botões soltos (flutuando) abaixo do principal, sem título.
                    <div className="mt-3 flex flex-col gap-3">
                      {otherPlans.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => handlePlanClick(plan)}
                          className="w-full py-3 px-6 rounded-full flex items-center justify-between transition-transform active:scale-[0.98]"
                          style={{ background: buttonGradient, color: "#1a1a1a" }}
                        >
                          <span className="text-[17px] font-medium">{plan.name}</span>
                          <span className="text-[17px] font-semibold">{plan.price}</span>
                        </button>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Status bar (tabs) */}
          <div className="rounded-2xl border border-gray-200 bg-white flex overflow-hidden"
            aria-label="Postagens">
            <button
              type="button"
              onClick={() => setActiveTab("posts")}
              className="flex-1 flex justify-center py-3 border-b-[3px] transition-colors"
              style={{ borderColor: activeTab === "posts" ? colors.accent : "transparent" }}
            >
              <div
                className="flex items-center gap-2"
                style={{ color: activeTab === "posts" ? colors.accent : "#374151" }}
              >
                <IconSmartphone className="w-[18px] h-[18px]" strokeWidth={2} />
                <span className="font-medium text-[17px]">{postsCount} Postagens</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("medias")}
              className="flex-1 flex justify-center py-3 border-b-[3px] transition-colors"
              style={{ borderColor: activeTab === "medias" ? colors.accent : "transparent" }}
            >
              <div
                className="flex items-center gap-2"
                style={{ color: activeTab === "medias" ? colors.accent : "#374151" }}
              >
                <IconImage className="w-[18px] h-[18px]" />
                <span className="font-medium text-[17px]">{mediasCount} Mídias</span>
              </div>
            </button>

          </div>

          {/* Media grid */}
          {activeTab === "medias" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-1.5">
                {(filledMedias.length > 0
                  ? filledMedias
                  : Array.from({ length: gridSize }).map((_, i) => ({ id: `ph${i}`, url: "", blur: true }))
                ).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handlePlanClick()}
                    className="relative aspect-square bg-[#f4efe8] flex items-center justify-center overflow-hidden rounded-xl cursor-pointer"
                  >
  {item.url ? (item as { type?: "image" | "video" }).type === "video" ? (
  <video src={item.url} muted playsInline loop autoPlay className={`absolute inset-0 h-full w-full object-cover ${item.blur ? "blur-md scale-110" : ""}`} />
  ) : (
  <img
    src={item.url || "/placeholder.svg"}
    alt="Mídia da galeria"
    className={`absolute inset-0 h-full w-full object-cover ${item.blur ? "blur-md scale-110" : ""}`}
  />
  ) : null}
                    {(item.blur || !item.url) && (
                      <div className="relative z-10 flex items-center justify-center">
                        <IconLock className="w-7 h-7 text-[#64748b]" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Ver completo (fixo) -> abre o checkout do plano principal */}
              <button
                onClick={() => handlePlanClick()}
                className="w-full py-3 px-6 rounded-full text-[17px] font-semibold transition-transform active:scale-[0.98]"
                style={{ background: buttonGradient, color: "#1a1a1a" }}
              >
                Ver completo
              </button>
            </div>
          )}

          {/* Posts feed */}
          {activeTab === "posts" && (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: colors.cardBg }}
              >
                {/* Post header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      <img src={avatar || "/placeholder.svg"} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                        style={{ backgroundColor: colors.background, color: colors.subtext }}
                      >
                        {username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[15px]" style={{ color: colors.text }}>
                          {username}
                        </span>
                        {isVerified && <VerifiedBadge className="w-4 h-4" color={colors.accent} />}
                      </div>
                      <span className="text-sm text-gray-500">{displayHandle}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePlanClick()}
                    aria-label="Mais opções"
                    className="cursor-pointer"
                  >
                    <IconMoreVertical className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                {/* Conteúdo do post: 
                    - Com foto + sem blur: só a foto limpa
                    - Com foto + blur: foto de fundo blur + cadeado + estatísticas
                    - Sem foto: cadeado + estatísticas (fundo sólido)
                */}
                {post.url && !post.blur ? (
                  /* Foto sem blur: mostra só a imagem limpa */
                  <div
                    className={`relative w-full overflow-hidden cursor-pointer ${post.type === "video" ? "" : "aspect-square"}`}
                    onClick={() => handlePlanClick()}
                  >
  {post.type === "video" ? (
    <video
      src={post.url}
      controls
      playsInline
      preload="metadata"
      className="block h-auto w-full"
      aria-label="Vídeo da postagem"
      onClick={(event) => event.stopPropagation()}
    />
  ) : (
    <img
      src={post.url || "/placeholder.svg"}
      alt="Mídia da postagem"
      className="h-full w-full object-cover"
    />
  )}
                  </div>
                ) : (
                  /* Com blur ou sem foto: mostra cadeado + estatísticas */
                  <div
                    className="relative w-full aspect-square bg-[#f4efe8] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => handlePlanClick()}
                  >
                    {/* Imagem de fundo com blur (se tiver foto) */}
                    {post.url && (
                      <img
                        src={post.url || "/placeholder.svg"}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover blur-md scale-110"
                      />
                    )}
                    {/* Círculo só aparece quando NÃO tem foto */}
                    {!post.url && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] aspect-square rounded-full border-[12px] border-white/50" />
                    )}
                    <div className="z-10 flex flex-col items-center gap-6">
                      <IconLock className="w-14 h-14 text-[#64748b]" strokeWidth={1.5} />
                      <div className="flex items-center gap-5 text-[#64748b] text-[15px] font-medium">
                        <div className="flex items-center gap-2">
                          <IconImage className="w-[18px] h-[18px]" strokeWidth={1.5} />
                          <span>{post.imagesCount ?? stats.photos}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconClapperboard className="w-[18px] h-[18px]" strokeWidth={1.5} />
                          <span>{post.videosCount ?? stats.videos}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconHeart className="w-[18px] h-[18px]" strokeWidth={1.5} />
                          <span>{post.likes ?? stats.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Post footer actions */}
                <div
                  className="p-4 flex items-center justify-between text-[#64748b] cursor-pointer"
                  onClick={() => handlePlanClick()}
                >
                  <div className="flex items-center gap-5">
                    <svg
                      viewBox="0 0 512 512"
                      className="w-[22px] h-[22px] cursor-pointer hover:text-gray-800 transition-colors"
                    >
                      <path
                        fill="currentColor"
                        d="M244 130.6l-12-13.5-4.2-4.7c-26-29.2-65.3-42.8-103.8-35.8c-53.3 9.7-92 56.1-92 110.3v3.5c0 32.3 13.4 63.1 37.1 85.1L253 446.8c.8 .7 1.9 1.2 3 1.2s2.2-.4 3-1.2L443 275.5c23.6-22 37-52.8 37-85.1v-3.5c0-54.2-38.7-100.6-92-110.3c-38.5-7-77.8 6.6-103.8 35.8l-4.2 4.7-12 13.5c-3 3.4-7.4 5.4-12 5.4s-8.9-2-12-5.4zm34.9-57.1C311 48.4 352.7 37.7 393.7 45.1C462.2 57.6 512 117.3 512 186.9v3.5c0 36-13.1 70.6-36.6 97.5c-3.4 3.8-6.9 7.5-10.7 11l-184 171.3c-.8 .8-1.7 1.5-2.6 2.2c-6.3 4.9-14.1 7.5-22.1 7.5c-9.2 0-18-3.5-24.8-9.7L47.2 299c-3.8-3.5-7.3-7.2-10.7-11C13.1 261 0 226.4 0 190.4v-3.5C0 117.3 49.8 57.6 118.3 45.1c40.9-7.4 82.6 3.2 114.7 28.4c6.7 5.3 13 11.1 18.7 17.6l4.2 4.7 4.2-4.7c4.2-4.7 8.6-9.1 13.3-13.1c1.8-1.5 3.6-3 5.4-4.5z"
                      />
                    </svg>
                    <svg
                      viewBox="0 0 486 512"
                      className="w-[21px] h-[21px] cursor-pointer hover:text-gray-800 transition-colors"
                    >
                      <path
                        fill="currentColor"
                        d="M442.4 256c0-110.1-89.3-199.4-199.4-199.4S43.6 145.9 43.6 256c0 42.2 13.1 81.2 35.4 113.4c4.9 7.1 6.5 16.2 3.9 24.7l-1.4 3.6L54.7 455.4H243c110.1 0 199.4-89.3 199.4-199.4zm32.3 0C474.7 384 371 487.7 243 487.7H48.1c-21.2 0-34.5-22.4-25-40.9H23l28.2-60.8C26 349 11.3 304.2 11.3 256C11.3 128 115 24.3 243 24.3S474.7 128 474.7 256z"
                      />
                    </svg>
                    <svg
                      viewBox="0 0 512 512"
                      className="w-[22px] h-[22px] cursor-pointer hover:text-gray-800 transition-colors"
                    >
                      <path
                        fill="currentColor"
                        d="M480 256A224 224 0 1 0 32 256a224 224 0 1 0 448 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM272 120v23c13.5 1 26.6 4.6 39.6 8.3c1.5 .4 3.1 .9 4.6 1.3c8.5 2.4 13.5 11.2 11.2 19.7s-11.2 13.5-19.7 11.2c-2.4-.7-4.8-1.4-7.2-2.1c-7.5-2.2-15.2-4.4-22.9-5.5c-19.1-2.8-36.6-.4-49.3 5.1c-12.9 5.6-18.6 13.1-19.8 19.5c-1.8 9.8 2.1 16.5 10.2 21.7c10.6 6.8 26.5 11.3 45.8 16.8l.3 .1c17.7 5 38.9 11.1 54.3 21.7c19 13 27.8 33.8 23.6 56.5c-4 21.6-18.9 36-37.8 43.6c-9.9 4-21.1 6.3-33.1 6.9l0 24.2c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-25.9c-8.1-1.3-21.8-5.2-32.4-8.4c-6.9-2.1-13.8-4.3-20.7-6.5c-8.4-2.8-12.9-11.8-10.2-20.2s11.8-12.9 20.2-10.2c6.6 2.2 13.2 4.3 19.9 6.3c11.2 3.4 22.7 6.6 28.1 7.4c19.8 2.9 36.5 1.3 48-3.4c11.2-4.5 16.8-11.3 18.3-19.7c1.9-10.5-1.5-18.4-10.2-24.4c-12-8.2-26.8-12.3-40.9-16.2c-2.3-.6-4.7-1.3-6.9-1.9c-17.1-4.8-37-10.5-51.7-19.9c-8.1-5.2-15.7-12.1-20.5-21.7c-4.9-9.8-6.2-20.8-4-32.8c3.8-20.7 20-35.1 38.6-43.1c7.4-3.2 15.6-5.6 24.3-7.1V120c0-8.8 7.2-16 16-16s16 7.2 16 16z"
                      />
                    </svg>
                  </div>
                  <svg
                    viewBox="0 0 405 512"
                    className="w-[18px] h-[22px] cursor-pointer hover:text-gray-800 transition-colors"
                  >
                    <path
                      fill="currentColor"
                      d="M341.5 0H89.2C54.5 0 26.2 28.7 26.2 64V495.1c0 5.8 3.1 11.2 8.2 14c5.1 2.8 11.2 2.6 16-.5l165-106.5 165 106.5c2.6 2.6 5.5 3.4 8.5 3.4c2.6 0 5.2-.7 7.6-2c5-2.8 8.2-8.2 8.2-14.9V64c0-35.3-28.3-64-63.1-64zm31.5 466.9L223.9 370.5c-3.4-1.7-5.5-2.5-8.5-2.5s-5.9 .8-8.5 2.5L57.7 466.9V64c0-17.6 14.1-32 31.5-32H341.5c17.4 0 31.5 14.4 31.5 32V466.9z"
                    />
                  </svg>
                </div>

                {/* Legenda curta (estilo Instagram) */}
                {post.caption && (
                  <p className="px-4 pb-4 -mt-1 text-[14px] leading-snug" style={{ color: colors.text }}>
                    <span className="font-semibold">{displayHandle}</span>{" "}
                    <span style={{ color: colors.subtext }}>{post.caption}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {offerPlan && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="offer-title">
          <button
            type="button"
            aria-label="Fechar oferta"
            className="absolute inset-0 cursor-default"
            onClick={() => setOfferPlan(null)}
          />
          <div className="relative z-10 w-full max-w-[330px] overflow-hidden rounded-[20px] bg-white text-center shadow-[0_20px_60px_rgba(28,22,18,0.28)]">
            <div className="h-2 w-full bg-[#f47d32]" />
            <button
              type="button"
              aria-label="Fechar oferta"
              onClick={() => setOfferPlan(null)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#fff7f1] text-xl leading-none text-[#7b6d64] transition hover:bg-[#ffe9d8]"
            >
              ×
            </button>
            <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
              <h2 id="offer-title" className="text-left text-lg font-extrabold text-[#25211f]">O que você recebe</h2>
              <div className="mt-3 rounded-[16px] border border-[#f3e4d8] bg-[#fffaf6] p-3 text-left">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-medium text-[#433a35]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f47d32] text-xs font-bold text-white">✓</span>Vídeos e fotos exclusivos, sem censura</div>
                  <div className="flex items-center gap-3 text-sm font-medium text-[#433a35]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f47d32] text-xs font-bold text-white">✓</span>Cenas íntimas, fetiches e momentos especiais</div>
                  <div className="flex items-center gap-3 text-sm font-medium text-[#433a35]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f47d32] text-xs font-bold text-white">✓</span>Entrega discreta pelo Privacy ou Telegram</div>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between rounded-[18px] border border-[#eee4dc] bg-[#f8f3ef] px-5 py-4 text-left">
                <div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9a8d84]">Plano selecionado</p><p className="mt-1 text-lg font-bold text-[#25211f]">{offerPlan.name}</p></div>
                <div className="text-right"><p className="text-xs text-[#9a8d84]">A partir de</p><p className="text-2xl font-extrabold tracking-[-0.03em] text-[#25211f]">{offerPlan.price}</p></div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckoutPlan(offerPlan)
                  setOfferPlan(null)
                }}
                className="mt-3 w-full rounded-xl bg-[#f47d32] py-3 text-[15px] font-extrabold text-white shadow-[0_10px_22px_rgba(244,125,50,0.28)] transition hover:bg-[#df681f] active:scale-[0.98]"
              >
                Quero ver tudo
              </button>
              <button type="button" onClick={() => setOfferPlan(null)} className="mt-3 text-sm font-medium text-[#756b65] underline underline-offset-2">Agora não</button>
            </div>
          </div>
        </div>
      )}

      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          modelId={data.modelId}
  forceGateway={data.forceGateway}
  startWithCallUpsell
  callUpsellImage={callUpsellImage}
modelName={checkoutModelName || username}
      orderBumps={orderBumps}
          title={checkoutCopy.title || "Adquirir plano"}
          subtitle={privacyCheckoutSubtitle}
          checkoutConfig={{
            title: checkoutCopy.title || "Adquirir plano",
            subtitle: privacyCheckoutSubtitle,
            mode: privacyCheckoutMode,
                queueEnabled: checkoutCopy.queueEnabled ?? false,
                queueHours: checkoutCopy.queueHours ?? 3,
                queueReason: checkoutCopy.queueReason ?? "",
                priorityEnabled: checkoutCopy.priorityEnabled ?? false,
            priorityPrice: checkoutCopy.priorityPrice ?? "R$ 9,90",
            priorityText: checkoutCopy.priorityText ?? "Receber agora",
            callUpsellEnabled: checkoutCopy.callUpsellEnabled ?? true,
            callUpsellPrice: checkoutCopy.callUpsellPrice ?? "R$ 15,90",
            callUpsellTitle: checkoutCopy.callUpsellTitle ?? "Quer uma chamada de vídeo comigo?",
            callUpsellDescription:
              checkoutCopy.callUpsellDescription ??
              "Adicione uma chamada de vídeo de 10 minutos só nós dois. Vaga limitada!",
            deliverableEnabled: checkoutCopy.deliverableEnabled ?? false,
            deliverableTitle: checkoutCopy.deliverableTitle ?? "Seu acesso está liberado!",
            deliverableDescription: checkoutCopy.deliverableDescription ?? "",
            deliverableButtonText: checkoutCopy.deliverableButtonText ?? "Acessar conteúdo",
            deliverableButtonUrl: checkoutCopy.deliverableButtonUrl ?? "",
          }}
          colors={colors}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
    </div>
  )
}
