// Conteúdo internacional da página /en (OnlyFans).
// Idiomas suportados: inglês (padrão), espanhol e português de Portugal.
// Os preços permanecem em dólar (USD) para todos os idiomas.

export type Locale = "en" | "es" | "pt"

export type StripeLabels = {
  subscribeTo: string
  emailLabel: string
  emailPlaceholder: string
  emailHelp: string
  enterEmail: string
  continue: string
  loading: string
  processing: string
  pay: string
  securedBy: string
  checkDetails: string
  paymentFailed: string
  networkError: string
  somethingWrong: string
  successTitle: string
  successBodyPre: string
  successBodyPost: string
  done: string
  close: string
}

/**
 * Detecta o idioma preferido do visitante da página /en.
 * Prioriza o idioma do dispositivo (navigator.languages) e usa o fuso
 * horário como reforço para o português de Portugal.
 * Como usuários pt-BR já foram redirecionados na home, qualquer "pt" aqui
 * é tratado como português de Portugal.
 */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en"

  const langs =
    navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""]

  for (const raw of langs) {
    const l = raw.toLowerCase()
    if (l.startsWith("es")) return "es"
    if (l.startsWith("pt")) return "pt"
    if (l.startsWith("en")) return "en"
  }

  // Reforço por fuso horário (Portugal e ilhas).
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    if (tz === "Europe/Lisbon" || tz === "Atlantic/Madeira" || tz === "Atlantic/Azores") return "pt"
    if (tz === "Europe/Madrid") return "es"
  } catch {
    // ignora
  }

  return "en"
}

export const MODEL_NAME = "Geovanna Nescau"

// Campos constantes (não dependem do idioma).
export const BASE = {
  username: MODEL_NAME,
  handle: "@geovannanescau",
  paymentProvider: "stripe" as const,
  isVerified: true,
  availableNow: true,
  avatar: "/models/geovanna-nescau/avatar-home.jpg",
  coverImage: "/models/geovanna-nescau/cover.jpg",
  stats: { photos: 214, videos: 68, locked: 47, likes: "38.2k" },
  postsCount: 282,
  mediaCount: 214,
  lockedStats: { posts: 282, photos: 214, videos: 68, audio: 3 },
  regularPrice: "$20",
  principalId: "1m",
  colors: {
    background: "#f0faff",
    text: "#0b1f33",
    subtext: "#5c7891",
    accent: "#00aeef",
    cardBg: "#ffffff",
  },
}

export type LocaleContent = {
  bio: string
  offerLabel: string
  offerTitle: string
  offerSubtitle: string
  offerCardText: string
  subscriptions: Array<{
    id: string
    name: string
    price: string
    period?: string
    badge?: string
    discount?: string
    amountCents: number
    intervalCount: number
  }>
  labels: {
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
  postCaptions: [string, string]
  stripeLabels: StripeLabels
}

// Prévias exibidas na aba de publicações (imagens iguais para todos os idiomas).
export const POST_IMAGES = [
  { id: "post-1", url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4906709384033930427-TwvYQC4DHTNLPMWTQSceyf9BI3NtNN.jpg", likes: "38.2k" },
  { id: "post-2", url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-tbsiEKteBbseC0EIln2RWlp2sr3E7L.png", likes: "41.7k" },
]

export const CONTENT: Record<Locale, LocaleContent> = {
  en: {
    bio: "Want to find out if my pussy and little ass are really pink? 😈 Uncensored content, anal, cumshots, and exclusive live streams await you.",
    offerLabel: "SUBSCRIPTION",
    offerTitle: "Limited offer: 25% off for the first 31 days!",
    offerSubtitle: "Offer ends soon • limited spots left",
    offerCardText:
      "Only $5 for the next few fans 🙊 Subscribe now and get instant access to all my exclusive content. 🔥",
    subscriptions: [
      { id: "1m", name: "1 Month", price: "$5", period: "for 31 days", badge: "Most popular", amountCents: 500, intervalCount: 1 },
      { id: "3m", name: "3 Months", price: "$25 total", amountCents: 2500, intervalCount: 3 },
      { id: "6m", name: "6 Months", price: "$41 total", amountCents: 4100, intervalCount: 6 },
    ],
    labels: {
      availableNow: "Available now",
      moreInfo: "More info",
      lessInfo: "Less info",
      subscribe: "Subscribe",
      packages: "SUBSCRIPTION BUNDLES",
      regularPrice: "Regular Price",
      perMonth: "/ month",
      posts: "POSTS",
      media: "MEDIA",
      subscribeToSee: "SUBSCRIBE TO SEE USER'S POSTS",
    },
    postCaptions: [
      "woke up feeling naughty 🙈 come see the rest...",
      "day off by the river 🌿 took some very spicy pics after 🔥",
        ],
    stripeLabels: {
      subscribeTo: "Subscribe to",
      emailLabel: "Email",
      emailPlaceholder: "you@email.com",
      emailHelp: "We'll send your access details to this email.",
      enterEmail: "Please enter your email.",
      continue: "Continue to payment",
      loading: "Loading...",
      processing: "Processing...",
      pay: "Pay",
      securedBy: "Secured by Stripe",
      checkDetails: "Please check your payment details.",
      paymentFailed: "Payment failed. Please try again.",
      networkError: "Network error. Please try again.",
      somethingWrong: "Something went wrong. Please try again.",
      successTitle: "You're in!",
      successBodyPre: "Your subscription is active. Check ",
      successBodyPost: " for your access details.",
      done: "Done",
      close: "Close",
    },
  },
  es: {
    bio: "Tu antojito favorito 🍫 Contenido sin censura, actualizado cada semana. Ven a vivir esta experiencia conmigo por aquí.",
    offerLabel: "SUSCRIPCIÓN",
    offerTitle: "¡Oferta limitada: 25% de descuento los primeros 31 días!",
    offerSubtitle: "La oferta termina pronto • plazas limitadas",
    offerCardText:
      "Solo $5 para los próximos fans 🙊 Suscríbete ahora y obtén acceso inmediato a todo mi contenido exclusivo. 🔥",
    subscriptions: [
      { id: "1m", name: "1 Mes", price: "$5", period: "por 31 días", badge: "Más popular", amountCents: 500, intervalCount: 1 },
      { id: "3m", name: "3 Meses", price: "$25 en total", amountCents: 2500, intervalCount: 3 },
      { id: "6m", name: "6 Meses", price: "$41 en total", amountCents: 4100, intervalCount: 6 },
    ],
    labels: {
      availableNow: "Disponible ahora",
      moreInfo: "Más información",
      lessInfo: "Menos información",
      subscribe: "Suscribirse",
      packages: "PAQUETES DE SUSCRIPCIÓN",
      regularPrice: "Precio normal",
      perMonth: "/ mes",
      posts: "PUBLICACIONES",
      media: "MULTIMEDIA",
      subscribeToSee: "SUSCRÍBETE PARA VER LAS PUBLICACIONES",
    },
    postCaptions: [
      "amanecí con ganas de travesuras 🙈 ven a ver el resto...",
      "día libre en el río 🌿 después me tomé unas fotos bien picantes 🔥",
        ],
    stripeLabels: {
      subscribeTo: "Suscríbete a",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@correo.com",
      emailHelp: "Te enviaremos los datos de acceso a este correo.",
      enterEmail: "Introduce tu correo electrónico.",
      continue: "Continuar al pago",
      loading: "Cargando...",
      processing: "Procesando...",
      pay: "Pagar",
      securedBy: "Protegido por Stripe",
      checkDetails: "Revisa los datos de tu pago.",
      paymentFailed: "El pago falló. Inténtalo de nuevo.",
      networkError: "Error de red. Inténtalo de nuevo.",
      somethingWrong: "Algo salió mal. Inténtalo de nuevo.",
      successTitle: "¡Ya estás dentro!",
      successBodyPre: "Tu suscripción está activa. Revisa ",
      successBodyPost: " para ver tus datos de acceso.",
      done: "Listo",
      close: "Cerrar",
    },
  },
  pt: {
    bio: "O teu docinho preferido 🍫 Conteúdo sem censura, atualizado todas as semanas. Vem viver esta experiência comigo por aqui.",
    offerLabel: "SUBSCRIÇÃO",
    offerTitle: "Oferta limitada: 25% de desconto nos primeiros 31 dias!",
    offerSubtitle: "A oferta termina em breve • vagas limitadas",
    offerCardText:
      "Apenas $5 para os próximos fãs 🙊 Subscreve agora e recebe acesso imediato a todo o meu conteúdo exclusivo. 🔥",
    subscriptions: [
      { id: "1m", name: "1 Mês", price: "$5", period: "por 31 dias", badge: "Mais popular", amountCents: 500, intervalCount: 1 },
      { id: "3m", name: "3 Meses", price: "$25 no total", amountCents: 2500, intervalCount: 3 },
      { id: "6m", name: "6 Meses", price: "$41 no total", amountCents: 4100, intervalCount: 6 },
    ],
    labels: {
      availableNow: "Disponível agora",
      moreInfo: "Mais informação",
      lessInfo: "Menos informação",
      subscribe: "Subscrever",
      packages: "PACOTES DE SUBSCRIÇÃO",
      regularPrice: "Preço normal",
      perMonth: "/ mês",
      posts: "PUBLICAÇÕES",
      media: "MULTIMÉDIA",
      subscribeToSee: "SUBSCREVE PARA VER AS PUBLICAÇÕES",
    },
    postCaptions: [
      "acordei com vontade de fazer travessuras 🙈 vem ver o resto...",
      "dia de folga no rio 🌿 tirei umas fotos bem atrevidas depois 🔥",
        ],
    stripeLabels: {
      subscribeTo: "Subscrever",
      emailLabel: "E-mail",
      emailPlaceholder: "tu@email.com",
      emailHelp: "Vamos enviar os teus dados de acesso para este e-mail.",
      enterEmail: "Introduz o teu e-mail.",
      continue: "Continuar para o pagamento",
      loading: "A carregar...",
      processing: "A processar...",
      pay: "Pagar",
      securedBy: "Protegido pela Stripe",
      checkDetails: "Verifica os dados do teu pagamento.",
      paymentFailed: "O pagamento falhou. Tenta novamente.",
      networkError: "Erro de rede. Tenta novamente.",
      somethingWrong: "Algo correu mal. Tenta novamente.",
      successTitle: "Já estás dentro!",
      successBodyPre: "A tua subscrição está ativa. Verifica ",
      successBodyPost: " para receberes os teus dados de acesso.",
      done: "Concluído",
      close: "Fechar",
    },
  },
}

// ---------- Estrutura editável (padrão vs. override do banco) ----------

export type EnBase = typeof BASE
export type EnPostImage = (typeof POST_IMAGES)[number]

// Snapshot completo e editável da página /en (base + imagens + 3 idiomas).
export type EnEditable = {
  base: EnBase
  postImages: EnPostImage[]
  locales: Record<Locale, LocaleContent>
}

// PADRÃO (hard code) usado quando não há override salvo no banco.
export const EN_DEFAULT: EnEditable = {
  base: BASE,
  postImages: POST_IMAGES,
  locales: CONTENT,
}

/**
 * Monta o objeto de dados da página /en para o idioma indicado.
 * Por padrão usa o hard code; se receber `source` (override do banco),
 * usa esse snapshot no lugar.
 */
export function getOnlyFansContent(locale: Locale, source: EnEditable = EN_DEFAULT) {
  const c = source.locales[locale] ?? source.locales.en ?? CONTENT.en
  const images = source.postImages ?? POST_IMAGES
  return {
    ...source.base,
    bio: c.bio,
    offerLabel: c.offerLabel,
    offerTitle: c.offerTitle,
    offerSubtitle: c.offerSubtitle,
    offerCardText: c.offerCardText,
    subscriptions: c.subscriptions,
    labels: c.labels,
    posts: images.map((img, i) => ({ ...img, caption: c.postCaptions[i] })),
    stripeLabels: c.stripeLabels,
  }
}

/**
 * Força um preço fixo no plano principal (1 mês) da página /en, em todos os
 * idiomas, e ajusta o texto da oferta para refletir esse valor.
 * Usado no funil de desconto: página normal com $9 e oferta de saída com $5.
 *
 * @param priceLabel  Rótulo exibido (ex.: "$9").
 * @param amountCents Valor cobrado na Stripe em centavos (ex.: 900).
 * @param prevLabel   Rótulo antigo a substituir nos textos da oferta (ex.: "$5").
 */
export function withOnlyFansPrice(
  source: EnEditable,
  priceLabel: string,
  amountCents: number,
  prevLabel = "$5",
): EnEditable {
  const principalId = source.base.principalId ?? "1m"
  const locales = {} as Record<Locale, LocaleContent>
  for (const key of ["en", "es", "pt"] as Locale[]) {
    const c = source.locales[key]
    locales[key] = {
      ...c,
      offerCardText: c.offerCardText.split(prevLabel).join(priceLabel),
      offerTitle: c.offerTitle.split(prevLabel).join(priceLabel),
      subscriptions: c.subscriptions.map((s) =>
        s.id === principalId ? { ...s, price: priceLabel, amountCents } : s,
      ),
    }
  }
  return { ...source, locales }
}

// Mescla um override (snapshot do banco) sobre o padrão, preenchendo
// campos ausentes para tolerar overrides antigos.
export function mergeEnContent(override: Partial<EnEditable> | null | undefined): EnEditable {
  if (!override) return EN_DEFAULT
  const locales = {} as Record<Locale, LocaleContent>
  for (const key of ["en", "es", "pt"] as Locale[]) {
    const ov = override.locales?.[key]
    const base = EN_DEFAULT.locales[key]
    locales[key] = ov
      ? {
          ...base,
          ...ov,
          labels: { ...base.labels, ...(ov.labels ?? {}) },
          stripeLabels: { ...base.stripeLabels, ...(ov.stripeLabels ?? {}) },
          subscriptions: Array.isArray(ov.subscriptions) ? ov.subscriptions : base.subscriptions,
          postCaptions: Array.isArray(ov.postCaptions) ? ov.postCaptions : base.postCaptions,
        }
      : base
  }
  return {
    base: { ...EN_DEFAULT.base, ...(override.base ?? {}) },
    postImages: Array.isArray(override.postImages) ? override.postImages : EN_DEFAULT.postImages,
    locales,
  }
}
