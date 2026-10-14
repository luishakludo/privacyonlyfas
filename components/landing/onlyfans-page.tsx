"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckoutModal } from "./checkout-modal"
import { StripeCheckoutModal } from "./stripe-checkout-modal"
import { useExitRedirect } from "@/lib/landing/use-exit-redirect"
import type { OrderBump } from "@/lib/supabase/use-models"
import type { StripeLabels } from "@/lib/i18n/onlyfans-content"

type Subscription = {
  id: string
  name: string
  price: string
  discount?: string
  badge?: string
  benefit?: string
  /** Texto à direita do botão principal (ex: "for 31 days" / "por 31 dias") */
  period?: string
  /** Valor em centavos para a Stripe (ex: 1500 = $15.00) */
  amountCents?: number
  /** Quantidade de meses por ciclo de cobrança na Stripe */
  intervalCount?: number
}

type FeedPost = {
  id: string
  url: string
  type?: "image" | "video"
  route?: string
  blur?: boolean
  caption?: string
  likes?: string
}

type Labels = {
  availableNow: string
  moreInfo: string
  lessInfo: string
  subscribe: string
  packages: string
  regularPrice: string
  perMonth: string
  posts: string
  media: string
  subscribeToSee: string
}

type OnlyFansPageData = {
  username: string
  handle: string
  bio: string
  avatar: string
  coverImage: string
  isVerified: boolean
  availableNow?: boolean
  stats: {
    photos: number
    videos: number
    locked: number
    likes: string
  }
  subscriptions: Subscription[]
  /** Prévias exibidas na aba de publicações (estilo feed) */
  posts?: FeedPost[]
  principalId?: string
  // Cabeçalho da oferta (estilo OnlyFans)
  offerLabel?: string
  offerTitle?: string
  offerSubtitle?: string
  offerCardText?: string
  /** Preço "normal" exibido abaixo do botão principal (ex: "$20") */
  regularPrice?: string
  /** Contagens exibidas nas abas e na área bloqueada */
  postsCount?: number
  mediaCount?: number
  lockedStats?: {
    posts: number
    photos: number
    videos: number
    audio: number
  }
  labels?: Partial<Labels>
  colors?: {
    background: string
    text: string
    subtext: string
    accent: string
    cardBg: string
  }
  modelId?: string
  forceGateway?: "nexuspag" | "hyzepay"
  /** Provedor de pagamento: "pix" (padrão) usa o checkout brasileiro; "stripe" usa a Stripe */
  paymentProvider?: "pix" | "stripe"
  /** Textos traduzidos do modal de checkout da Stripe (EN/ES/PT-PT) */
  stripeLabels?: StripeLabels
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

const DEFAULT_LABELS: Labels = {
  availableNow: "Disponível agora",
  moreInfo: "Mais informações",
  lessInfo: "Menos informações",
  subscribe: "Assinar",
  packages: "PACOTES DE ASSINATURA",
  regularPrice: "Preço Normal",
  perMonth: "/ mês",
  posts: "POSTAGENS",
  media: "MÍDIA",
  subscribeToSee: "INSCREVA-SE PARA VER AS PUBLICAÇÕES DO USUÁRIO",
}

/* Ícones inline */
const IconArrowLeft = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className={className}>
    <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
  </svg>
)

const IconShare = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" x2="12" y1="2" y2="15" />
  </svg>
)

const IconImage = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
)

const IconVideo = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
    <rect x="2" y="6" width="14" height="12" rx="2" />
  </svg>
)

const IconStream = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
  </svg>
)

const IconHeart = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
)

const IconChevron = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m18 15-6-6-6 6" />
  </svg>
)

const IconList = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9h10M7 13h10M7 17h6" />
  </svg>
)

const IconMic = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
  </svg>
)

const IconLock = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconHome = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </svg>
)

const IconEllipsis = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
)

const VerifiedBadge = ({ className = "w-5 h-5", color = "#00aff0" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={color} aria-hidden="true" className={className}>
    <path d="M256 0c36.8 0 68.8 20.7 84.9 51.1C373.8 41 411 49 437 75s34 63.3 23.9 96.1C491.3 187.2 512 219.2 512 256s-20.7 68.8-51.1 84.9C471 373.8 463 411 437 437s-63.3 34-96.1 23.9C324.8 491.3 292.8 512 256 512s-68.8-20.7-84.9-51.1C138.2 471 101 463 75 437s-34-63.3-23.9-96.1C20.7 324.8 0 292.8 0 256s20.7-68.8 51.1-84.9C41 138.2 49 101 75 75s63.3-34 96.1-23.9C187.2 20.7 219.2 0 256 0zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z" />
  </svg>
)

export function OnlyFansPage({
  data,
  exitRedirectUrl,
}: {
  data: Partial<OnlyFansPageData>
  /** Ao tentar sair da página, redireciona para esta URL (funil de desconto). */
  exitRedirectUrl?: string
}) {
  const colors = data.colors || {
    background: "#ffffff",
    text: "#12181f",
    subtext: "#8a96a3",
    accent: "#00aff0",
    cardBg: "#ffffff",
  }

  const labels: Labels = { ...DEFAULT_LABELS, ...(data.labels || {}) }

  const username = data.username || "SeuNome"
  const handle = data.handle || "@seunome"
  const displayHandle = handle.startsWith("@") ? handle : `@${handle}`
  const bio = data.bio || ""
  const avatar = data.avatar || ""
  const coverImage = data.coverImage || ""
  const isVerified = data.isVerified !== false
  const availableNow = data.availableNow !== false
  const stats = data.stats || { photos: 0, videos: 0, locked: 0, likes: "0" }
  const subscriptions = data.subscriptions || []
  const posts = data.posts || []
  const principalPlan = subscriptions.find((p) => p.id === data.principalId) || subscriptions[0]
  const otherPlans = subscriptions.filter((p) => p.id !== principalPlan?.id)

  const offerLabel = data.offerLabel || "ASSINATURA"
  const offerTitle = data.offerTitle || "Oferta limitada: conteúdo sem censura toda semana!"
  const offerSubtitle = data.offerSubtitle || "Vagas limitadas • aproveite antes que acabe"
  const offerCardText =
    data.offerCardText || "Assine agora e receba acesso imediato a todo o meu conteúdo exclusivo. 🔥"

  const postsCount = data.postsCount ?? stats.photos + stats.videos
  const mediaCount = data.mediaCount ?? stats.photos
  const lockedStats = data.lockedStats ?? {
    posts: postsCount,
    photos: stats.photos,
    videos: stats.videos,
    audio: 0,
  }

  const [bioExpanded, setBioExpanded] = useState(false)
  const bioIsLong = bio.length > 60
  const [packagesOpen, setPackagesOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<"posts" | "media">("posts")
  const router = useRouter()

  const orderBumps = data.orderBumps ?? []
  const checkoutCopy = data.checkout ?? {
    title: "Falta pouco!",
    subtitle: "Digite seu e-mail para receber o acesso ao conteúdo após o pagamento.",
  }
  const [checkoutPlan, setCheckoutPlan] = useState<Subscription | null>(null)

  // Funil de desconto: ao tentar sair sem pagar, redireciona para a oferta.
  // Desligado enquanto o checkout está aberto, para não interromper o pagamento.
  useExitRedirect(exitRedirectUrl, !checkoutPlan)

  const handlePlanClick = (plan?: Subscription) => {
    if (plan) {
      setCheckoutPlan(plan)
      return
    }
    if (principalPlan) setCheckoutPlan(principalPlan)
  }

  const useStripe = data.paymentProvider === "stripe"

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: colors.background }}>
      <div className="relative mx-auto max-w-md pb-16" style={{ backgroundColor: colors.cardBg }}>
        {/* Capa com stats e nome sobrepostos */}
        <div className="relative">
          <div className="relative h-56 w-full overflow-hidden">
            {coverImage ? (
              <img src={coverImage || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ backgroundColor: `${colors.accent}30` }} />
            )}
            {/* Escurece o topo para leitura do texto branco */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />

            {/* Voltar + nome */}
            <div className="absolute left-0 right-0 top-0 flex items-center gap-3 px-4 pt-3 text-white">
              <IconArrowLeft className="h-5 w-5 drop-shadow" />
              <div className="flex items-center gap-1">
                <span className="text-[18px] font-bold drop-shadow">{username}</span>
                {isVerified && <VerifiedBadge className="h-[18px] w-[18px]" color="#ffffff" />}
              </div>
            </div>

            {/* Stats sobre a capa */}
            <div className="absolute left-4 top-11 flex items-center gap-2 text-[13px] font-semibold text-white">
              <span className="flex items-center gap-1.5 drop-shadow">
                <IconImage className="h-[18px] w-[18px]" />
                {stats.photos}
              </span>
              <span className="drop-shadow opacity-90">•</span>
              <span className="flex items-center gap-1.5 drop-shadow">
                <IconVideo className="h-[18px] w-[18px]" />
                {stats.videos}
              </span>
              <span className="drop-shadow opacity-90">•</span>
              <span className="flex items-center gap-1.5 drop-shadow">
                <IconStream className="h-[18px] w-[18px]" />
                {stats.locked}
              </span>
              <span className="drop-shadow opacity-90">•</span>
              <span className="flex items-center gap-1.5 drop-shadow">
                <IconHeart className="h-[18px] w-[18px]" />
                {stats.likes}
              </span>
            </div>
          </div>

          {/* Avatar sobreposto + bolinha online */}
          <div className="absolute -bottom-10 left-4">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar || "/placeholder.svg"}
                  alt={username}
                  className="h-24 w-24 rounded-full border-4 object-cover"
                  style={{ borderColor: colors.cardBg }}
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full border-4 text-3xl font-bold"
                  style={{ borderColor: colors.cardBg, backgroundColor: colors.background, color: colors.subtext }}
                >
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              {availableNow && (
                <span
                  className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-2"
                  style={{ backgroundColor: "#22c55e", borderColor: colors.cardBg }}
                />
              )}
            </div>
          </div>

          {/* Botão compartilhar */}
          <button
            type="button"
            aria-label={labels.subscribe}
            className="absolute -bottom-6 right-4 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm"
            style={{ borderColor: `${colors.subtext}33`, backgroundColor: colors.cardBg, color: colors.accent }}
          >
            <IconShare className="h-5 w-5" />
          </button>
        </div>

        {/* Info do perfil */}
        <div className="px-4 pt-12">
          <div className="flex items-center gap-1">
            <h1 className="text-[22px] font-bold" style={{ color: colors.text }}>
              {username}
            </h1>
            {isVerified && <VerifiedBadge className="h-5 w-5" color={colors.accent} />}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[15px]" style={{ color: colors.subtext }}>
            <span>{displayHandle}</span>
            {availableNow && (
              <>
                <span>•</span>
                <span>{labels.availableNow}</span>
              </>
            )}
          </div>

          {bio && (
            <p
              className={`mt-3 text-[15px] leading-snug whitespace-pre-line ${bioExpanded ? "" : "line-clamp-2"}`}
              style={{ color: colors.text }}
            >
              {bio}
            </p>
          )}
          {bioIsLong && (
            <button
              onClick={() => setBioExpanded((v) => !v)}
              className="mt-1 text-[15px] font-medium"
              style={{ color: colors.accent }}
            >
              {bioExpanded ? labels.lessInfo : labels.moreInfo}
            </button>
          )}
        </div>

        {/* Divisor */}
        <div className="mt-4 h-2" style={{ backgroundColor: `${colors.subtext}12` }} />

        {/* Assinatura / Oferta */}
        <div className="px-4 py-5">
          <p className="text-[13px] font-bold tracking-wide" style={{ color: colors.subtext }}>
            {offerLabel}
          </p>
          <h2 className="mt-2 text-[19px] font-bold leading-snug text-balance" style={{ color: colors.text }}>
            {offerTitle}
          </h2>
          <p className="mt-1 text-[13px]" style={{ color: colors.subtext }}>
            {offerSubtitle}
          </p>

          {/* Card da oferta */}
          <div
            className="mt-3 flex items-start gap-3 rounded-xl p-3"
            style={{ backgroundColor: `${colors.subtext}0f` }}
          >
            {avatar && (
              <img src={avatar || "/placeholder.svg"} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            )}
            <p className="text-[14px] leading-snug" style={{ color: colors.text }}>
              {offerCardText}
            </p>
          </div>

          {/* Botão principal de assinatura (estilo OnlyFans) */}
          {principalPlan && (
            <>
              <button
                onClick={() => handlePlanClick(principalPlan)}
                className="mt-4 flex w-full items-center justify-between rounded-full px-6 py-3.5 text-[15px] font-bold uppercase tracking-wide text-white transition-transform active:scale-[0.98]"
                style={{ backgroundColor: colors.accent }}
              >
                <span>{labels.subscribe}</span>
                <span>
                  {principalPlan.price} {principalPlan.period || labels.perMonth}
                </span>
              </button>
              {data.regularPrice && (
                <p className="mt-2 text-[14px]" style={{ color: colors.subtext }}>
                  {labels.regularPrice} {data.regularPrice} {labels.perMonth}
                </p>
              )}
            </>
          )}

          {/* Pacotes / promoções */}
          {otherPlans.length > 0 && (
            <div className="mt-5 border-t pt-4" style={{ borderColor: `${colors.subtext}1f` }}>
              <button
                onClick={() => setPackagesOpen((v) => !v)}
                className="mb-3 flex w-full items-center justify-between"
              >
                <span className="text-[13px] font-bold tracking-wide" style={{ color: colors.subtext }}>
                  {labels.packages}
                </span>
                <span style={{ color: colors.subtext }}>
                  <IconChevron className={`h-5 w-5 transition-transform ${packagesOpen ? "" : "rotate-180"}`} />
                </span>
              </button>
              {packagesOpen && (
                <div className="flex flex-col gap-2.5">
                  {otherPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handlePlanClick(plan)}
                      className="flex w-full items-center justify-between gap-4 rounded-full px-6 py-4 text-white transition-transform active:scale-[0.98]"
                      style={{ backgroundColor: colors.accent }}
                    >
                      <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                        <span className="flex items-center gap-2 text-[15px] font-semibold uppercase">
                          {plan.name}
                          {plan.discount && <span className="text-[13px] font-bold">({plan.discount})</span>}
                        </span>
                        {plan.benefit && <span className="mt-1 rounded-md bg-white/25 px-2.5 py-1 text-[12px] font-bold normal-case leading-snug tracking-normal text-white shadow-sm">{plan.benefit}</span>}
                      </span>
                      <span className="shrink-0 text-[15px] font-bold">{plan.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divisor */}
        <div className="h-px w-full" style={{ backgroundColor: `${colors.subtext}1f` }} />

        {/* Abas Posts / Mídia */}
        <div className="grid grid-cols-2">
          <button
            onClick={() => setActiveTab("posts")}
            className="relative py-3.5 text-center text-[15px] font-bold tracking-wide"
            style={{ color: activeTab === "posts" ? colors.text : colors.subtext }}
          >
            {postsCount} {labels.posts}
            {activeTab === "posts" && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: colors.text }} />
            )}
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className="relative py-3.5 text-center text-[15px] font-bold tracking-wide"
            style={{ color: activeTab === "media" ? colors.text : colors.subtext }}
          >
            {mediaCount} {labels.media}
            {activeTab === "media" && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: colors.text }} />
            )}
          </button>
        </div>

        {/* Feed de publicações (prévias) */}
        {activeTab === "posts" && posts.length > 0 && (
          <div className="flex flex-col gap-4 px-4 pt-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="overflow-hidden rounded-2xl border"
                style={{ borderColor: `${colors.subtext}1f`, backgroundColor: colors.cardBg }}
              >
                {/* Cabeçalho do post */}
                <div className="flex items-center gap-3 px-3 py-3">
                  {avatar && (
                    <img src={avatar || "/placeholder.svg"} alt="" className="h-9 w-9 rounded-full object-cover" />
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-bold" style={{ color: colors.text }}>
                      {username}
                    </span>
                    {isVerified && <VerifiedBadge className="h-[14px] w-[14px]" color={colors.accent} />}
                  </div>
                </div>

                {/* Imagem (clicável -> checkout) */}
                <button
                  type="button"
                  onClick={() => {
                    if (post.route) {
                      router.push(post.route)
                      return
                    }
                    handlePlanClick(principalPlan)
                  }}
                  className="relative block aspect-square w-full overflow-hidden"
                >
                  {post.type === "video" ? (
                    <video
                      src={post.url}
                      controls
                      playsInline
                      preload="metadata"
                      aria-label={`Vídeo da postagem de ${username}`}
                      className={`h-full w-full object-cover ${post.blur ? "scale-110 blur-xl" : ""}`}
                    />
                  ) : (
                    <img
                      src={post.url || "/placeholder.svg"}
                      alt={`Imagem da postagem de ${username}`}
                      className={`h-full w-full object-cover ${post.blur ? "scale-110 blur-xl" : ""}`}
                    />
                  )}
                  {post.blur && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30">
                      <span className="text-white">
                        <IconLock className="h-12 w-12" />
                      </span>
                      <span className="rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: colors.accent }}>
                        {labels.subscribe}
                      </span>
                    </div>
                  )}
                </button>

                {/* Ações + curtidas */}
                <div className="flex items-center gap-4 px-3 pt-3" style={{ color: colors.subtext }}>
                  <IconHeart className="h-6 w-6" />
                  <span className="text-[13px] font-semibold" style={{ color: colors.text }}>
                    {post.likes ?? stats.likes}
                  </span>
                </div>

                {/* Legenda curta (estilo Instagram) */}
                {post.caption && (
                  <p className="px-3 pb-4 pt-2 text-[13px] leading-snug" style={{ color: colors.text }}>
                    <span className="font-semibold">{displayHandle}</span>{" "}
                    <span style={{ color: colors.subtext }}>{post.caption}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Barra inferior fixa */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t px-8 py-3"
          style={{ borderColor: `${colors.subtext}1f`, backgroundColor: colors.cardBg, color: colors.subtext }}
        >
          <span style={{ color: colors.text }}>
            <IconHome className="h-6 w-6" />
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border"
            style={{ borderColor: `${colors.subtext}40` }}
          >
            <IconEllipsis className="h-5 w-5" />
          </span>
        </div>
      </div>

      {checkoutPlan && !useStripe && (
        <CheckoutModal
          plan={{ id: checkoutPlan.id, name: checkoutPlan.name, price: checkoutPlan.price }}
          modelId={data.modelId}
          forceGateway={data.forceGateway}
          modelName={username}
          orderBumps={orderBumps}
          title={checkoutCopy.title}
          subtitle={checkoutCopy.subtitle}
          checkoutConfig={{
            title: checkoutCopy.title,
            subtitle: checkoutCopy.subtitle,
            mode: checkoutCopy.mode ?? "completo",
            queueEnabled: checkoutCopy.queueEnabled ?? false,
            queueHours: checkoutCopy.queueHours ?? 3,
            queueReason: checkoutCopy.queueReason ?? "",
            priorityEnabled: checkoutCopy.priorityEnabled ?? false,
            priorityPrice: checkoutCopy.priorityPrice ?? "R$ 9,90",
            priorityText: checkoutCopy.priorityText ?? "Receber agora",
            callUpsellEnabled: checkoutCopy.callUpsellEnabled ?? false,
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

      {checkoutPlan && useStripe && (
        <StripeCheckoutModal
          plan={checkoutPlan}
          modelName={username}
          colors={colors}
          labels={data.stripeLabels}
          downsell={false}
          deliverable={{
            enabled: checkoutCopy.deliverableEnabled ?? false,
            title: checkoutCopy.deliverableTitle ?? "Seu acesso está liberado!",
            description: checkoutCopy.deliverableDescription ?? "",
            buttonText: checkoutCopy.deliverableButtonText ?? "Acessar conteúdo",
            buttonUrl: checkoutCopy.deliverableButtonUrl ?? "",
          }}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
    </div>
  )
}
