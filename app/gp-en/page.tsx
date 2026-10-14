import type { Metadata } from "next"
import { OnlyFansPage } from "@/components/landing/onlyfans-page"
import { getEnContentServer } from "@/lib/landing/overrides-server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "OnlyFans | Geovanna Pierre",
  description: "Exclusive content from Geovanna Pierre.",
}

const GP_COVER =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4936166533197663844-cJ8nMNrFT1biLSzOvJThzRP8AcCt0v.jpg"
const GP_POST_IMAGE =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image%20%283%29-tt2wA1T9LIz7ddFwetU6vTWg9FA8g0.png"
const GP_POST_VIDEO =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/upload%20%283%29-iAX3HJW4EF7ZSBXp6qKoHDLB9uatge.mp4"

export default async function Page() {
  const source = await getEnContentServer()
  const data = {
    ...source.base,
    username: "Geovanna Pierre",
    handle: "geovannapierre",
    avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/790059490_18083216771471493_7120741971286687762_n-SLGBqGlxNyssD7kbPz18TJjJrsny9c.jpg",
    coverImage: GP_COVER,
    paymentProvider: "stripe" as const,
    checkout: {
      ...source.base.checkout,
      deliverableEnabled: true,
      deliverableTitle: "Payment approved!",
      deliverableDescription: "Your access has been unlocked.",
      deliverableButtonText: "Access content",
      deliverableButtonUrl: "https://t.me/+r1wJP767rDA0Mjcx",
    },
    posts: source.postImages.slice(0, 2).map((post, index) => ({
      ...post,
      url: index === 0 ? GP_POST_IMAGE : GP_POST_VIDEO,
      type: index === 1 ? "video" as const : "image" as const,
    })),
    medias: [],
    subscriptions: source.locales.en.subscriptions.map((subscription) => {
      if (subscription.id === "1m") return { ...subscription, price: "$9", amountCents: 900 }
      if (subscription.id === "3m") return { ...subscription, benefit: "BONUS: CHAT + VIDEO CALL" }
      if (subscription.id === "6m") return { ...subscription, benefit: "BONUS: 10-MIN CUSTOM VIDEO" }
      return subscription
    }),
    bio: source.locales.en.bio,
    labels: source.locales.en.labels,
    stripeLabels: source.locales.en.stripeLabels,
  }
  const posts = (data.posts ?? []).slice(0, 2).map((post, index) => ({
    ...post,
    url: index === 0 ? GP_POST_IMAGE : index === 1 ? GP_POST_VIDEO : "",
    type: index === 1 ? "video" : post.type,
  }))

  return (
    <main className="mx-auto max-w-md">
      <OnlyFansPage
        data={{
          ...data,
          username: "Geovanna Pierre",
          handle: "geovannapierre",
          avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/790059490_18083216771471493_7120741971286687762_n-SLGBqGlxNyssD7kbPz18TJjJrsny9c.jpg",
          coverImage: GP_COVER,
          posts,
          medias: [],
          subscriptions: data.subscriptions.map((subscription) =>
            subscription.id === "1" || subscription.id === "1m"
              ? { ...subscription, id: "1m", price: "$9", amountCents: 900, badge: "Most popular" }
              : subscription,
          ),
        }}
        exitRedirectUrl="/gp-en/offer"
      />
    </main>
  )
}
