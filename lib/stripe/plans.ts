/**
 * Fonte da verdade dos planos de assinatura (valores em centavos de USD).
 * O servidor SEMPRE usa estes valores — o cliente só envia o id do plano,
 * nunca o preço, evitando manipulação de valores.
 */
export type StripePlan = {
  id: string
  name: string
  productName: string
  amountCents: number
  intervalCount: number
}

export const STRIPE_PLANS: Record<string, StripePlan> = {
  "1m": {
    id: "1m",
    name: "1 Month",
    productName: "Subscription — 1 Month",
    amountCents: 900, // $9.00
    intervalCount: 1,
  },
  "3m": {
    id: "3m",
    name: "3 Months",
    productName: "Subscription — 3 Months",
    amountCents: 2500, // $25.00
    intervalCount: 3,
  },
  "6m": {
    id: "6m",
    name: "6 Months",
    productName: "Subscription — 6 Months",
    amountCents: 4100, // $41.00
    intervalCount: 6,
  },
}

export function getStripePlan(id: string): StripePlan | undefined {
  return STRIPE_PLANS[id]
}
