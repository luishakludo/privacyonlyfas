import type { Metadata } from "next"
import { DiscountOfferPage } from "@/components/landing/discount-offer-page"
import { getEnContentServer } from "@/lib/landing/overrides-server"
import { getOnlyFansContent, withOnlyFansPrice } from "@/lib/i18n/onlyfans-content"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Special offer | Geovanna Pierre",
  description: "Limited-time discount for Geovanna Pierre.",
  robots: { index: false, follow: false },
}

const GP_COVER =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4936166533197663844-cJ8nMNrFT1biLSzOvJThzRP8AcCt0v.jpg"

export default async function Page() {
  const source = withOnlyFansPrice(await getEnContentServer(), "$5", 500, "$9")
  const data = getOnlyFansContent("en", {
    ...source,
    base: {
      ...source.base,
      username: "Geovanna Pierre",
      handle: "geovannapierre",
      avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/790059490_18083216771471493_7120741971286687762_n-SLGBqGlxNyssD7kbPz18TJjJrsny9c.jpg",
      coverImage: GP_COVER,
      paymentProvider: "stripe",
    },
  })

  return (
    <main className="mx-auto max-w-md">
      <DiscountOfferPage
        data={data}
        price="$5"
        originalPrice="$9"
        planName="1 month"
        headline="Wait — your exclusive discount is ready"
        subheadline="Get full access today with this special one-time offer."
        badgeText="SPECIAL OFFER"
        ctaText="CLAIM MY DISCOUNT"
      />
    </main>
  )
}
