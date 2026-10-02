import type { Metadata } from "next"
import { DiscountOfferPage } from "@/components/landing/discount-offer-page"
import { HOME_MODEL_NAME } from "@/lib/landing/home-content"
import { getHomeContentServer } from "@/lib/landing/overrides-server"

// Lê o conteúdo atual no servidor (mesma base da home).
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Oferta especial | ${HOME_MODEL_NAME}`,
  description: "Oferta exclusiva por tempo limitado.",
  robots: { index: false, follow: false },
}

// 1ª oferta do funil de desconto: 1 mês por R$ 12,00 (era R$ 19,90).
export default async function Page() {
  const data = await getHomeContentServer()

  return (
    <main className="mx-auto max-w-md">
      {/* Tela de desconto dedicada. Se sair de novo (ou 1 min na tela), cai na oferta final (R$ 9,90). */}
      <DiscountOfferPage
        data={data}
        price="R$ 12,00"
        originalPrice="R$ 19,90"
        planName="1 mês"
        exitRedirectUrl="/oferta-final"
      />
    </main>
  )
}
