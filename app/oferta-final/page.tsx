import type { Metadata } from "next"
import { DiscountOfferPage } from "@/components/landing/discount-offer-page"
import { HOME_MODEL_NAME } from "@/lib/landing/home-content"
import { getHomeContentServer } from "@/lib/landing/overrides-server"

// Lê o conteúdo atual no servidor (mesma base da home).
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Última chance | ${HOME_MODEL_NAME}`,
  description: "Última oferta por tempo limitado.",
  robots: { index: false, follow: false },
}

// Oferta final do funil (última chance): 1 mês por R$ 9,90. Sem mais redirects.
export default async function Page() {
  const data = await getHomeContentServer()

  return (
    <main className="mx-auto max-w-md">
      {/* Sem exitRedirectUrl: aqui é o último preço. */}
      <DiscountOfferPage
        data={data}
        price="R$ 9,90"
        originalPrice="R$ 19,90"
        planName="1 mês"
        headline="Última chance! Menor preço, só agora"
        subheadline="Essa é a menor oferta que consigo liberar. Depois disso, volta ao valor normal."
        badgeText="ÚLTIMA CHANCE"
        ctaText="GARANTIR MENOR PREÇO"
      />
    </main>
  )
}
