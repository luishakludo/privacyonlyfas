import type { Metadata } from "next"
import { OnlyFansLocalized } from "@/components/landing/onlyfans-localized"
import { getEnContentServer } from "@/lib/landing/overrides-server"
import { withOnlyFansPrice } from "@/lib/i18n/onlyfans-content"

// Lê o conteúdo atual no servidor (override do banco tem prioridade sobre o hard code).
export const dynamic = "force-dynamic"

// Model name for this page
const modelName = "Geovanna Nescau"

export const metadata: Metadata = {
  title: `OnlyFans | ${modelName}`,
  description: "Exclusive uncensored content.",
}

export default async function Page() {
  // Snapshot editável (base + 3 idiomas) resolvido no servidor.
  // Preço normal fixado em $9; ao tentar sair, cai na oferta de $5 (/en/offer).
  const source = withOnlyFansPrice(await getEnContentServer(), "$9", 900)

  return (
    <main className="mx-auto max-w-md">
      {/* A adaptação de idioma (EN / ES / PT-PT) acontece no cliente. */}
      <OnlyFansLocalized source={source} exitRedirectUrl="/en/offer" />
    </main>
  )
}
