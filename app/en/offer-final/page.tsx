import type { Metadata } from "next"
import { DiscountOfferPage } from "@/components/landing/discount-offer-page"
import { getEnContentServer } from "@/lib/landing/overrides-server"
import { getOnlyFansContent, withOnlyFansPrice } from "@/lib/i18n/onlyfans-content"

// Lê o conteúdo atual no servidor (mesma base da /en).
export const dynamic = "force-dynamic"

const modelName = "Geovanna Nescau"

export const metadata: Metadata = {
  title: `Last chance | ${modelName}`,
  description: "Lowest price, only now.",
  robots: { index: false, follow: false },
}

// Oferta final da /en (última chance): 1 mês por $3. Sem mais redirects.
export default async function Page() {
  const source = withOnlyFansPrice(await getEnContentServer(), "$3", 300)
  const data = getOnlyFansContent("en", source)

  return (
    <main className="mx-auto max-w-md">
      <DiscountOfferPage
        data={data as never}
        price="$3"
        originalPrice="$9"
        planName="1 month"
        headline="Last chance — unlock everything for less"
        subheadline="This is the lowest price available. Get full access now."
        badgeText="FINAL OFFER"
        ctaText="GET ACCESS NOW"
      />
    </main>
  )
}
