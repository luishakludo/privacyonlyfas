import "server-only"
import Stripe from "stripe"
import { STRIPE_SECRET_KEY } from "./keys"

/**
 * Cliente Stripe criado sob demanda (lazy). Assim, se a STRIPE_SECRET_KEY
 * não estiver configurada, o módulo NÃO quebra no carregamento — a rota
 * consegue retornar uma mensagem de erro amigável em vez de derrubar tudo
 * com um 500 genérico ("Network error").
 */
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY não configurada no ambiente do servidor.")
  }
  if (!_stripe) {
    _stripe = new Stripe(STRIPE_SECRET_KEY)
  }
  return _stripe
}

/**
 * Cria (ou reutiliza em memória) um Price recorrente na Stripe a partir dos
 * dados do plano. Usamos `product_data` inline para não exigir que você
 * crie produtos manualmente no dashboard — o Price/Product é criado na
 * primeira compra de cada plano e cacheado enquanto o servidor estiver quente.
 */
const priceCache = new Map<string, string>()

export async function getOrCreatePriceId(params: {
  planKey: string
  productName: string
  amountCents: number
  intervalCount: number
}): Promise<string> {
  const cacheKey = `${params.planKey}:${params.amountCents}:${params.intervalCount}`
  const cached = priceCache.get(cacheKey)
  if (cached) return cached

  const stripe = getStripe()
  const price = await stripe.prices.create({
    currency: "usd",
    unit_amount: params.amountCents,
    recurring: { interval: "month", interval_count: params.intervalCount },
    product_data: { name: params.productName },
  })

  priceCache.set(cacheKey, price.id)
  return price.id
}
