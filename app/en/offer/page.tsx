import type { Metadata } from "next"
import { DiscountOfferPage } from "@/components/landing/discount-offer-page"
import { getEnContentServer } from "@/lib/landing/overrides-server"
import { getOnlyFansContent, withOnlyFansPrice } from "@/lib/i18n/onlyfans-content"

// Lê o conteúdo atual no servidor (mesma base da /en).
export const dynamic = "force-dynamic"

const modelName = "Geovanna Nescau"

export const metadata: Metadata = {
  title: `Special offer | ${modelName}`,
  description: "Limited-time discount.",
  robots: { index: false, follow: false },
}

// Primeira oferta de saída da /en: 1 mês por $5.
// A página final só aparece se o visitante tentar sair novamente.
export default async function Page() {
  const source = withOnlyFansPrice(await getEnContentServer(), "$5", 500)
  const data = getOnlyFansContent("en", source)

  return (
    <main className="mx-auto max-w-md">
      <DiscountOfferPage
        data={data}
        price="$5"
        originalPrice="$9"
        planName="1 month"
        headline="Wait — your exclusive discount is ready"
        subheadline="Get full access today with this special one-time offer."
        exitRedirectUrl="/en/offer-final"
        badgeText="SPECIAL OFFER"
        ctaText="CLAIM MY DISCOUNT"
      />
    </main>
  )
}
