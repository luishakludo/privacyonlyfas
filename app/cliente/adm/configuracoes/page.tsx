import { ConfiguracoesView } from "@/components/dashboard/configuracoes-view"

export const metadata = {
  title: "Configurações — Cliente/ADM",
  description: "Configure as chaves do gateway de pagamento.",
}

export default function ConfiguracoesPage() {
  return <ConfiguracoesView />
}
