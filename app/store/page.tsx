import type { Metadata } from "next"
import { Storefront } from "@/components/store/storefront"

export const metadata: Metadata = {
  title: "Loja | Geovanna Fox",
  description: "Conteúdos exclusivos e vídeos personalizados da Geovanna Fox.",
}

export default function StorePage() {
  return <Storefront />
}
