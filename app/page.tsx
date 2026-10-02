import type { Metadata } from "next"
import { PrivacyPage } from "@/components/landing/privacy-page"
import { HOME_MODEL_NAME } from "@/lib/landing/home-content"
import { getHomeContentServer } from "@/lib/landing/overrides-server"

// Sempre lê o conteúdo atual no servidor (override do banco tem prioridade sobre o hard code).
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `Privacy | ${HOME_MODEL_NAME}`,
  description: "A maior plataforma de conteúdos privados do Brasil.",
}

export default async function Page() {
  // Carrega no servidor: se houver edição salva no painel, ela vem do banco;
  // caso contrário, usa o padrão (hard code). Sem "piscar" o conteúdo antigo.
  const data = await getHomeContentServer()

  // Nesta página específica, as três postagens continuam existindo como cartões,
  // mas sem fotos, legendas ou metadados visuais. As demais rotas permanecem intactas.
  const privacyData = {
    ...data,
    posts: (data.posts || []).slice(0, 3).map(({ id, type, blur }) => ({
      id,
      type,
      blur,
    })),
    medias: [],
  }

  return (
    <main className="mx-auto max-w-md">
      {/* Se a pessoa tentar sair sem gerar PIX, cai na 1ª oferta de desconto (R$12). */}
      <PrivacyPage data={privacyData} exitRedirectUrl="/nescau-chat" />
    </main>
  )
}
