import type { Metadata } from "next"
import { PrivacyPage } from "@/components/landing/privacy-page"

// Nome da modelo que a pessoa escolher ao criar a página
const modelName = "Sua Modelo"

export const metadata: Metadata = {
  title: `Privacy | ${modelName}`,
  description: "A maior plataforma de conteúdos privados do Brasil.",
}

export default function PreviewPage() {
  return (
    <main className="mx-auto max-w-md">
      <PrivacyPage
        data={{
          username: modelName,
          handle: "@suamodelo",
          avatar: "/images/avatar.jpg",
          coverImage: "/images/banner.webp",
          checkout: {
            title: "Falta pouco!",
            subtitle: "Digite seu e-mail para receber o acesso ao conteúdo após o pagamento.",
            deliverableEnabled: true,
            deliverableTitle: "Seu acesso está liberado!",
            deliverableDescription: "Clique no botão abaixo para acessar seu conteúdo exclusivo.",
            deliverableButtonText: "Acessar conteúdo",
            deliverableButtonUrl: "https://example.com",
          },
        }}
      />
    </main>
  )
}
