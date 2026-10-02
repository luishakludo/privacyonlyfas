import type { Metadata } from "next"
import { PrivacyPage } from "@/components/landing/privacy-page"
import { getHomeContentServer } from "@/lib/landing/overrides-server"
import { GpLocaleRedirect } from "@/components/landing/gp-locale-redirect"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Privacy | Geovanna Pierre",
  description: "Conteúdos privados de Geovanna Pierre.",
}

export default async function Page() {
  const data = await getHomeContentServer()

  return (
    <main className="mx-auto max-w-md">
      <GpLocaleRedirect />
      <PrivacyPage
        data={{
          ...data,
          username: "Geovanna Pierre",
          handle: "geovannapierre",
          avatar: "/models/geovanna-pierre/avatar.jpg",
          coverImage:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4936166533197663844-cJ8nMNrFT1biLSzOvJThzRP8AcCt0v.jpg",
          posts: (data.posts ?? []).slice(0, 2).map((post, index) => ({
            ...post,
            // Apenas a primeira postagem da página GP recebe a foto fornecida.
            url:
              index === 0
                ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image%20%283%29-tt2wA1T9LIz7ddFwetU6vTWg9FA8g0.png"
                : index === 1
                  ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/upload%20%283%29-4kx27crfKvbmo8vLKWcL4J0LjgbzAl.mp4"
                  : "",
            type: index === 1 ? "video" : post.type,
          })),
          medias: [],
          // A foto da chamada é exclusiva do order bump da página GP.
          orderBumps: (data.orderBumps ?? []).map((bump) =>
            /chamad|call|vídeo|video/i.test(`${bump.title} ${bump.description}`)
              ? { ...bump, imageUrl: "/images/geovanna-pierre-call-bump.jpg" }
              : bump,
          ),
          subscriptions: data.subscriptions.map((subscription) =>
            subscription.id === "1"
              ? { ...subscription, price: "R$ 19,90", badge: "Mais popular" }
              : subscription,
          ),
        }}
        exitRedirectUrl="/pierre-chat"
        callUpsellImage="/images/geovanna-pierre-call-bump.jpg"
      />
    </main>
  )
}
